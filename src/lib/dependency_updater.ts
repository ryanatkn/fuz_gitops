import type {Logger} from '@ryanatkn/belt/log.js';
import {spawn_cli} from '@ryanatkn/gro/cli.js';
import {writeFile, readFile} from 'node:fs/promises';
import {join} from 'node:path';

import type {Local_Repo} from './local_repo.js';

export type Version_Strategy = 'exact' | 'caret' | 'tilde';

/**
 * Handles updating dependencies in package.json files.
 */
export class Dependency_Updater {
	private log?: Logger;

	constructor(log?: Logger) {
		this.log = log;
	}

	/**
	 * Updates dependencies in a repo's package.json file.
	 */
	async update_package_json(
		repo: Local_Repo,
		updates: Map<string, string>,
		strategy: Version_Strategy = 'caret',
	): Promise<void> {
		if (updates.size === 0) return;

		const package_json_path = join(repo.repo_dir, 'package.json');

		// Read current package.json
		const content = await readFile(package_json_path, 'utf8');
		const package_json = JSON.parse(content);

		// Apply version strategy
		const prefix = strategy === 'exact' ? '' : strategy === 'caret' ? '^' : '~';

		let updated = false;

		// Update dependencies
		if (package_json.dependencies) {
			for (const [name, version] of updates) {
				if (name in package_json.dependencies) {
					package_json.dependencies[name] = prefix + version;
					updated = true;
				}
			}
		}

		// Update devDependencies
		if (package_json.devDependencies) {
			for (const [name, version] of updates) {
				if (name in package_json.devDependencies) {
					package_json.devDependencies[name] = prefix + version;
					updated = true;
				}
			}
		}

		// Update peerDependencies
		if (package_json.peerDependencies) {
			for (const [name, version] of updates) {
				if (name in package_json.peerDependencies) {
					package_json.peerDependencies[name] = prefix + version;
					updated = true;
				}
			}
		}

		if (!updated) return;

		// Write updated package.json
		await writeFile(package_json_path, JSON.stringify(package_json, null, '\t') + '\n');

		// Commit the changes
		await spawn_cli('git', ['add', 'package.json'], this.log, {cwd: repo.repo_dir});
		await spawn_cli('git', ['commit', '-m', `update dependencies after publishing`], this.log, {
			cwd: repo.repo_dir,
		});
	}

	/**
	 * Updates all dependencies across multiple repos.
	 */
	async update_all_repos(
		repos: Array<Local_Repo>,
		published: Map<string, string>,
		strategy: Version_Strategy = 'caret',
	): Promise<{updated: number; failed: Array<{repo: string; error: Error}>}> {
		let updated_count = 0;
		const failed: Array<{repo: string; error: Error}> = [];

		for (const repo of repos) {
			const updates = new Map<string, string>();

			// Find dependencies that were published
			if (repo.dependencies) {
				for (const [dep_name] of repo.dependencies) {
					const new_version = published.get(dep_name);
					if (new_version) {
						updates.set(dep_name, new_version);
					}
				}
			}

			if (repo.dev_dependencies) {
				for (const [dep_name] of repo.dev_dependencies) {
					const new_version = published.get(dep_name);
					if (new_version) {
						updates.set(dep_name, new_version);
					}
				}
			}

			if (repo.peer_dependencies) {
				for (const [dep_name] of repo.peer_dependencies) {
					const new_version = published.get(dep_name);
					if (new_version) {
						updates.set(dep_name, new_version);
					}
				}
			}

			if (updates.size === 0) continue;

			try {
				await this.update_package_json(repo, updates, strategy);
				updated_count++;
				this.log?.info(`    Updated ${updates.size} dependencies in ${repo.pkg.name}`);
			} catch (error) {
				const err = error instanceof Error ? error : new Error(String(error));
				failed.push({repo: repo.pkg.name, error: err});
				this.log?.error(`    Failed to update ${repo.pkg.name}: ${err.message}`);
			}
		}

		return {updated: updated_count, failed};
	}

	/**
	 * Gets dependencies that need updating for a repo.
	 */
	find_updates_needed(
		repo: Local_Repo,
		published: Map<string, string>,
	): Map<string, {current: string; new: string; type: 'dependencies' | 'devDependencies' | 'peerDependencies'}> {
		const updates = new Map<string, {current: string; new: string; type: 'dependencies' | 'devDependencies' | 'peerDependencies'}>();

		// Check dependencies
		if (repo.dependencies) {
			for (const [dep_name, current_version] of repo.dependencies) {
				const new_version = published.get(dep_name);
				if (new_version && new_version !== current_version) {
					updates.set(dep_name, {
						current: current_version,
						new: new_version,
						type: 'dependencies',
					});
				}
			}
		}

		// Check devDependencies
		if (repo.dev_dependencies) {
			for (const [dep_name, current_version] of repo.dev_dependencies) {
				const new_version = published.get(dep_name);
				if (new_version && new_version !== current_version) {
					updates.set(dep_name, {
						current: current_version,
						new: new_version,
						type: 'devDependencies',
					});
				}
			}
		}

		// Check peerDependencies
		if (repo.peer_dependencies) {
			for (const [dep_name, current_version] of repo.peer_dependencies) {
				const new_version = published.get(dep_name);
				if (new_version && new_version !== current_version) {
					updates.set(dep_name, {
						current: current_version,
						new: new_version,
						type: 'peerDependencies',
					});
				}
			}
		}

		return updates;
	}
}