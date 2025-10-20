import type {Logger} from '@ryanatkn/belt/log.js';
import {Task_Error} from '@ryanatkn/gro';
import {join} from 'node:path';
import {styleText as st} from 'node:util';

import type {Local_Repo} from '$lib/local_repo.js';
import {update_package_json, type Version_Strategy} from '$lib/dependency_updater.js';
import {validate_dependency_graph} from '$lib/graph_validation.js';
import type {Bump_Type} from '$lib/semver.js';
import {type Pre_Flight_Options} from '$lib/pre_flight_checks.js';
import {init_publishing_state, Publishing_State_Manager} from '$lib/publishing_state.js';
import {needs_update, is_breaking_change, detect_bump_type} from '$lib/version_utils.js';
import type {Gitops_Operations} from '$lib/operations.js';
import {default_gitops_operations} from '$lib/operations_defaults.js';

/* eslint-disable no-await-in-loop */

export interface Publishing_Options {
	dry: boolean;
	bump: Bump_Type | 'auto';
	continue_on_error: boolean;
	update_deps: boolean;
	version_strategy?: Version_Strategy;
	deploy?: boolean;
	max_wait?: number;
	resume?: boolean; // Resume from saved state
	log?: Logger;
}

export interface Published_Version {
	name: string;
	old_version: string;
	new_version: string;
	bump_type: 'major' | 'minor' | 'patch';
	breaking: boolean;
	commit: string;
	tag: string;
}

export interface Publishing_Result {
	ok: boolean;
	published: Array<Published_Version>;
	failed: Array<{name: string; error: Error}>;
	duration: number;
}

/**
 * Publishes multiple repositories in dependency order.
 */
export const publish_repos = async (
	repos: Array<Local_Repo>,
	options: Publishing_Options,
	ops: Gitops_Operations = default_gitops_operations,
): Promise<Publishing_Result> => {
	const start_time = Date.now();
	const {dry, continue_on_error, update_deps, resume = false, log} = options;

	// Pre-flight checks (skip for dry runs since we're not actually publishing)
	if (!dry) {
		const pre_flight_options: Pre_Flight_Options = {
			skip_changesets: false, // Always check for changesets
			required_branch: 'main',
			log,
		};
		const pre_flight = await ops.preflight.run_pre_flight_checks(
			repos,
			pre_flight_options,
			ops.git,
			ops.npm,
		);

		if (!pre_flight.ok) {
			throw new Task_Error(`Pre-flight checks failed: ${pre_flight.errors.join(', ')}`);
		}
	} else {
		log?.info('⏭️  Skipping pre-flight checks for dry run');
	}

	// Build dependency graph and validate
	const {publishing_order: order} = validate_dependency_graph(repos, log, {
		throw_on_prod_cycles: true,
		log_cycles: true,
		log_order: true,
	});

	// Initialize or load publishing state (skip for dry runs - they don't need persistence)
	const state_manager: Publishing_State_Manager = dry
		? new Publishing_State_Manager({log}) // Empty manager, no file I/O
		: await init_publishing_state(order, {log});
	const packages_to_skip =
		resume && !dry ? state_manager.get_packages_to_skip() : new Set<string>();

	const published: Map<string, Published_Version> = new Map();
	const failed: Map<string, Error> = new Map();

	// Phase 1: Publish each package and immediately update dependents
	log?.info(st('cyan', `\n🚀 Publishing ${order.length} packages...\n`));

	for (const pkg_name of order) {
		// Skip if already processed (from resumed state)
		if (packages_to_skip.has(pkg_name)) {
			log?.info(st('dim', `  Skipping ${pkg_name} (already processed)`));
			continue;
		}

		const repo = repos.find((r) => r.pkg.name === pkg_name);
		if (!repo) continue;

		// Check for changesets (both dry and real runs)
		const has = await ops.changeset.has_changesets(repo);
		if (!has) {
			// Skip packages without changesets
			// In real publish: They might get auto-changesets during dependency updates
			// In dry run: We can't simulate auto-changesets, so just skip
			if (dry) {
				// Silent skip in dry run - plan shows which packages get auto-changesets
				continue;
			} else {
				log?.info(st('yellow', `  ⚠️  Skipping ${pkg_name} - no changesets`));
				continue;
			}
		}

		try {
			// Mark as current in state (skip for dry runs)
			if (!dry) {
				state_manager.mark_current(pkg_name);
			}

			// 1. Publish this package
			log?.info(`Publishing ${pkg_name}...`);
			const version = await publish_single_repo(repo, options, ops);
			published.set(pkg_name, version);
			log?.info(st('green', `  ✅ Published ${pkg_name}@${version.new_version}`));

			// Mark as completed in state (skip for dry runs)
			if (!dry) {
				await state_manager.mark_completed(pkg_name, version.new_version);
			}

			if (!dry) {
				// 2. Wait for this package to be available on NPM
				log?.info(`  ⏳ Waiting for ${pkg_name}@${version.new_version} on NPM...`);
				await ops.npm.wait_for_package(
					pkg_name,
					version.new_version,
					{
						max_attempts: 30,
						initial_delay: 1000,
						max_delay: 60000,
						timeout: options.max_wait || 300000,
					},
					log,
				);

				// 3. Update all repos that have prod/peer deps on this package
				if (update_deps) {
					for (const dependent_repo of repos) {
						const updates: Map<string, string> = new Map();

						// Check prod dependencies
						if (dependent_repo.dependencies?.has(pkg_name)) {
							const current = dependent_repo.dependencies.get(pkg_name)!;
							if (needs_update(current, version.new_version)) {
								updates.set(pkg_name, version.new_version);
							}
						}

						// Check peer dependencies
						if (dependent_repo.peer_dependencies?.has(pkg_name)) {
							const current = dependent_repo.peer_dependencies.get(pkg_name)!;
							if (needs_update(current, version.new_version)) {
								updates.set(pkg_name, version.new_version);
							}
						}

						// Apply updates if any
						if (updates.size > 0) {
							log?.info(`    Updating ${dependent_repo.pkg.name}'s dependency on ${pkg_name}`);
							await update_package_json(
								dependent_repo,
								updates,
								options.version_strategy || 'caret',
								published, // Pass published versions for changeset generation
								log,
								ops.git,
							);
						}
					}
				}
			}
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			failed.set(pkg_name, err);
			log?.error(st('red', `  ❌ Failed to publish ${pkg_name}: ${err.message}`));

			// Mark as failed in state (skip for dry runs)
			if (!dry) {
				await state_manager.mark_failed(pkg_name, err);
			}

			if (!continue_on_error) break;
		}
	}

	// Phase 2: Update all dev dependencies (can have cycles)
	if (update_deps && published.size > 0 && !dry) {
		log?.info(st('cyan', '\n🔄 Updating dev dependencies...\n'));

		for (const repo of repos) {
			const dev_updates: Map<string, string> = new Map();

			// Check dev dependencies only
			if (repo.dev_dependencies) {
				for (const [dep_name, current_version] of repo.dev_dependencies) {
					const published_version = published.get(dep_name);
					if (published_version && needs_update(current_version, published_version.new_version)) {
						dev_updates.set(dep_name, published_version.new_version);
					}
				}
			}

			if (dev_updates.size > 0) {
				log?.info(`  Updating ${dev_updates.size} dev dependencies in ${repo.pkg.name}`);
				await update_package_json(
					repo,
					dev_updates,
					options.version_strategy || 'caret',
					published, // Pass published versions for changeset generation
					log,
					ops.git,
				);
			}
		}
	}

	// Phase 3: Deploy all repos (optional)
	if (options.deploy && !dry) {
		log?.info(st('cyan', '\n🚢 Deploying all repos...\n'));

		for (const repo of repos) {
			try {
				log?.info(`  Deploying ${repo.pkg.name}...`);
				const deploy_result = await ops.process.spawn('gro', ['deploy'], {cwd: repo.repo_dir});

				if (deploy_result.ok) {
					log?.info(st('green', `  ✅ Deployed ${repo.pkg.name}`));
				} else {
					log?.warn(st('yellow', `  ⚠️  Failed to deploy ${repo.pkg.name}`));
				}
			} catch (error) {
				log?.error(st('red', `  ❌ Error deploying ${repo.pkg.name}: ${error}`));
			}
		}
	}

	// Summary
	const duration = Date.now() - start_time;
	const ok = failed.size === 0;

	log?.info(st('cyan', '\n📋 Publishing Summary\n'));
	log?.info(`  Duration: ${(duration / 1000).toFixed(1)}s`);
	log?.info(`  Published: ${published.size} packages`);
	if (failed.size > 0) {
		log?.info(`  Failed: ${failed.size} packages`);
	}

	if (ok) {
		log?.info(st('green', '\n✨ All packages published successfully!\n'));
		// Clear state file on successful completion
		if (!dry) {
			await state_manager.clear_state();
		}
	} else {
		log?.error(st('red', '\n❌ Some packages failed to publish\n'));
		// State file remains for potential resume
		log?.info(st('yellow', '\n💾 State saved - you can resume with --resume flag'));
	}

	return {
		ok,
		published: Array.from(published.values()),
		failed: Array.from(failed.entries()).map(([name, error]) => ({name, error})),
		duration,
	};
};

/**
 * Publishes a single repository.
 */
const publish_single_repo = async (
	repo: Local_Repo,
	options: Publishing_Options,
	ops: Gitops_Operations = default_gitops_operations,
): Promise<Published_Version> => {
	const {dry, log} = options;

	const old_version = repo.pkg.package_json.version || '0.0.0';

	if (dry) {
		// In dry run, predict version from changesets
		const prediction = await ops.changeset.predict_next_version(repo, log);

		if (!prediction) {
			// No changesets found, skip this repo
			throw new Error(`No changesets found for ${repo.pkg.name}`);
		}

		const {version: new_version, bump_type} = prediction;
		const breaking = is_breaking_change(old_version, bump_type);

		return {
			name: repo.pkg.name,
			old_version,
			new_version,
			bump_type,
			breaking,
			commit: 'dry-run',
			tag: `v${new_version}`,
		};
	}

	// Run gro publish which handles changesets version, build, and npm publish
	const publish_result = await ops.process.spawn('gro', ['publish'], {cwd: repo.repo_dir});

	if (!publish_result.ok) {
		throw new Error(`Failed to publish ${repo.pkg.name}`);
	}

	// Read the new version from package.json after gro publish
	const package_json_path = join(repo.repo_dir, 'package.json');
	const content = await ops.fs.readFile(package_json_path, 'utf8');
	const package_json = JSON.parse(content);
	const new_version = package_json.version;

	// Determine bump type and if it's breaking
	const bump_type = detect_bump_type(old_version, new_version);
	const breaking = is_breaking_change(old_version, bump_type);

	// Get actual commit hash
	const commit = await ops.git.current_commit_hash(undefined, repo.repo_dir);

	return {
		name: repo.pkg.name,
		old_version,
		new_version,
		bump_type,
		breaking,
		commit,
		tag: `v${new_version}`,
	};
};
