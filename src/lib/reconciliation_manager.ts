import type {Logger} from '@ryanatkn/belt/log.js';
import {spawn_cli} from '@ryanatkn/gro/cli.js';
import {writeFile, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {styleText as st} from 'node:util';
import type {Local_Repo} from './local_repo.js';
import type {Dependency_Update_Plan} from './dependency_classifier.js';
import {Registry_Monitor} from './registry_monitor.js';

export interface Reconciliation_Options {
	strategy: 'exact' | 'caret' | 'tilde';
	install: boolean;
	test: boolean;
	commit: boolean;
	log?: Logger;
}

export interface Reconciliation_Result {
	ok: boolean;
	updated: Array<{repo: string; dependencies: Array<string>}>;
	failed: Array<{repo: string; error: Error}>;
	duration: number;
}

/**
 * Manages the reconciliation phase - updating dev dependencies after publishing.
 */
export class Reconciliation_Manager {
	private registry_monitor: Registry_Monitor;
	private log?: Logger;

	constructor(log?: Logger) {
		this.log = log;
		this.registry_monitor = new Registry_Monitor({log});
	}

	/**
	 * Updates dev dependencies across all repos.
	 */
	async reconcile_dev_dependencies(
		repos: Array<Local_Repo>,
		updates: Array<Dependency_Update_Plan>,
		published_versions: Map<string, {version: string}>,
		options: Reconciliation_Options,
	): Promise<Reconciliation_Result> {
		const start_time = Date.now();
		const results = {
			updated: [] as Array<{repo: string; dependencies: Array<string>}>,
			failed: [] as Array<{repo: string; error: Error}>,
		};

		this.log?.info(st('cyan', '\n🔄 Starting dev dependency reconciliation'));

		// Group updates by repository
		const updates_by_repo = this.group_updates_by_repo(updates);

		for (const repo of repos) {
			const repo_updates = updates_by_repo.get(repo.pkg.name);
			if (!repo_updates || repo_updates.length === 0) {
				continue;
			}

			try {
				this.log?.info(`\n  Updating ${repo.pkg.name}...`);

				// Update package.json
				const updated_deps = await this.update_repo_dependencies(
					repo,
					repo_updates,
					published_versions,
					options.strategy,
				);

				if (updated_deps.length > 0) {
					this.log?.info(`    Updated ${updated_deps.length} dependencies`);

					// Install if requested
					if (options.install) {
						await this.install_dependencies(repo);
					}

					// Run tests if requested
					if (options.test) {
						await this.run_tests(repo);
					}

					// Commit changes if requested
					if (options.commit) {
						await this.commit_changes(repo, updated_deps);
					}

					results.updated.push({
						repo: repo.pkg.name,
						dependencies: updated_deps,
					});
				}
			} catch (error) {
				const err = error instanceof Error ? error : new Error(String(error));
				this.log?.error(`    Failed: ${err.message}`);
				results.failed.push({
					repo: repo.pkg.name,
					error: err,
				});
			}
		}

		const duration = Date.now() - start_time;

		// Summary
		this.log?.info(st('cyan', '\n📊 Reconciliation Summary'));
		this.log?.info(`  Updated: ${results.updated.length} repos`);
		this.log?.info(`  Failed: ${results.failed.length} repos`);
		this.log?.info(st('dim', `  Duration: ${(duration / 1000).toFixed(1)}s`));

		return {
			ok: results.failed.length === 0,
			updated: results.updated,
			failed: results.failed,
			duration,
		};
	}

	/**
	 * Groups updates by repository.
	 */
	private group_updates_by_repo(
		updates: Array<Dependency_Update_Plan>,
	): Map<string, Array<Dependency_Update_Plan>> {
		const grouped = new Map<string, Array<Dependency_Update_Plan>>();

		for (const update of updates) {
			for (const repo_name of update.required_by) {
				if (!grouped.has(repo_name)) {
					grouped.set(repo_name, []);
				}
				grouped.get(repo_name)!.push(update);
			}
		}

		return grouped;
	}

	/**
	 * Updates dependencies in a repo's package.json.
	 */
	private async update_repo_dependencies(
		repo: Local_Repo,
		updates: Array<Dependency_Update_Plan>,
		published_versions: Map<string, {version: string}>,
		strategy: 'exact' | 'caret' | 'tilde',
	): Promise<Array<string>> {
		const package_json_path = join(repo.repo_dir, 'package.json');
		const content = await readFile(package_json_path, 'utf8');
		const package_json = JSON.parse(content);

		const updated_deps: Array<string> = [];
		const prefix = strategy === 'exact' ? '' : strategy === 'caret' ? '^' : '~';

		// Update devDependencies
		if (package_json.devDependencies) {
			for (const update of updates) {
				const published = published_versions.get(update.package);
				if (published && update.package in package_json.devDependencies) {
					const new_version = prefix + published.version;
					if (package_json.devDependencies[update.package] !== new_version) {
						package_json.devDependencies[update.package] = new_version;
						updated_deps.push(`${update.package}@${new_version}`);
						this.log?.info(
							`    ${update.package}: ${update.from_version} → ${new_version}`,
						);
					}
				}
			}
		}

		// Write back if there were changes
		if (updated_deps.length > 0) {
			await writeFile(package_json_path, JSON.stringify(package_json, null, 2) + '\n');
		}

		return updated_deps;
	}

	/**
	 * Installs dependencies in a repo.
	 */
	private async install_dependencies(repo: Local_Repo): Promise<void> {
		this.log?.info('    Installing dependencies...');

		const result = await spawn_cli('npm', ['install'], this.log, {
			cwd: repo.repo_dir,
		});

		if (!result?.ok) {
			throw new Error('Failed to install dependencies');
		}
	}

	/**
	 * Runs tests in a repo.
	 */
	private async run_tests(repo: Local_Repo): Promise<void> {
		this.log?.info('    Running tests...');

		// Try to find and run test script
		const package_json_path = join(repo.repo_dir, 'package.json');
		const content = await readFile(package_json_path, 'utf8');
		const package_json = JSON.parse(content);

		if (package_json.scripts?.test) {
			const result = await spawn_cli('npm', ['test'], this.log, {
				cwd: repo.repo_dir,
			});

			if (!result?.ok) {
				throw new Error('Tests failed');
			}
		} else {
			this.log?.info('    No test script found, skipping...');
		}
	}

	/**
	 * Commits dependency updates.
	 */
	private async commit_changes(
		repo: Local_Repo,
		updated_deps: Array<string>,
	): Promise<void> {
		this.log?.info('    Committing changes...');

		// Stage package.json and package-lock.json
		await spawn_cli('git', ['add', 'package.json', 'package-lock.json'], this.log, {
			cwd: repo.repo_dir,
		});

		// Create commit message
		const message = `update dev dependencies after publishing

Updated:
${updated_deps.map((d) => `- ${d}`).join('\n')}`;

		// Commit
		const result = await spawn_cli('git', ['commit', '-m', message], this.log, {
			cwd: repo.repo_dir,
		});

		if (!result?.ok) {
			// May already be up to date
			this.log?.info('    No changes to commit');
		}
	}

	/**
	 * Waits for all packages to be installable before proceeding.
	 * This handles the NPM registry propagation delay.
	 */
	async wait_for_installability(
		repos: Array<Local_Repo>,
		published_versions: Map<string, {version: string}>,
	): Promise<boolean> {
		this.log?.info(st('yellow', '\n⏳ Waiting for packages to be installable...'));

		const packages_to_check: Array<{name: string; version: string; repo: Local_Repo}> = [];

		// Collect all packages we need to wait for
		for (const repo of repos) {
			// Check dev dependencies
			if (repo.dev_dependencies) {
				for (const [dep_name] of repo.dev_dependencies) {
					const published = published_versions.get(dep_name);
					if (published) {
						packages_to_check.push({
							name: dep_name,
							version: published.version,
							repo,
						});
					}
				}
			}
		}

		// Remove duplicates
		const unique_packages = new Map<string, {name: string; version: string}>();
		for (const pkg of packages_to_check) {
			const key = `${pkg.name}@${pkg.version}`;
			if (!unique_packages.has(key)) {
				unique_packages.set(key, {name: pkg.name, version: pkg.version});
			}
		}

		// Wait for all to be available
		const results = await this.registry_monitor.wait_for_multiple(
			Array.from(unique_packages.values()),
		);

		// Check results
		const all_available = Array.from(results.values()).every((r) => r.available);

		if (all_available) {
			this.log?.info(st('green', '✓ All packages are now installable'));
		} else {
			this.log?.error(st('red', '✗ Some packages failed to become installable'));
		}

		return all_available;
	}
}

/**
 * Creates a reconciliation manager.
 */
export const create_reconciliation_manager = (log?: Logger): Reconciliation_Manager => {
	return new Reconciliation_Manager(log);
};