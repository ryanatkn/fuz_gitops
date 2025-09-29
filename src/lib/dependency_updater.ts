import type {Logger} from '@ryanatkn/belt/log.js';
import {join} from 'node:path';

import type {Local_Repo} from '$lib/local_repo.js';
import type {Published_Version} from '$lib/multi_repo_publisher.js';
import {
	create_changeset_for_dependency_updates,
	create_dependency_updates,
} from '$lib/changeset_generator.js';
import {needs_update, get_update_prefix} from '$lib/version_utils.js';
import type {Git_Operations, Fs_Operations} from '$lib/operations.js';
import {default_git_operations, default_fs_operations} from '$lib/default_operations.js';

export type Version_Strategy = 'exact' | 'caret' | 'tilde';

/**
 * Updates dependencies in a repo's package.json file and creates a changeset.
 */
export const update_package_json = async (
	repo: Local_Repo,
	updates: Map<string, string>,
	strategy: Version_Strategy = 'caret',
	published_versions?: Map<string, Published_Version>,
	log?: Logger,
	git_ops: Git_Operations = default_git_operations,
	fs_ops: Fs_Operations = default_fs_operations,
): Promise<void> => {
	if (updates.size === 0) return;

	const package_json_path = join(repo.repo_dir, 'package.json');

	// Read current package.json
	const content = await fs_ops.readFile(package_json_path, 'utf8');
	const package_json = JSON.parse(content);

	// Apply version strategy
	const prefix = strategy === 'exact' ? '' : strategy === 'caret' ? '^' : '~';

	let updated = false;

	// Update dependencies
	if (package_json.dependencies) {
		for (const [name, version] of updates) {
			if (name in package_json.dependencies) {
				const current = package_json.dependencies[name];
				const update_prefix = get_update_prefix(current, prefix);
				package_json.dependencies[name] = update_prefix + version;
				updated = true;
			}
		}
	}

	// Update devDependencies
	if (package_json.devDependencies) {
		for (const [name, version] of updates) {
			if (name in package_json.devDependencies) {
				const current = package_json.devDependencies[name];
				const update_prefix = get_update_prefix(current, prefix);
				package_json.devDependencies[name] = update_prefix + version;
				updated = true;
			}
		}
	}

	// Update peerDependencies
	if (package_json.peerDependencies) {
		for (const [name, version] of updates) {
			if (name in package_json.peerDependencies) {
				const current = package_json.peerDependencies[name];
				const update_prefix = get_update_prefix(current, prefix);
				package_json.peerDependencies[name] = update_prefix + version;
				updated = true;
			}
		}
	}

	if (!updated) return;

	// Write updated package.json
	await fs_ops.writeFile(package_json_path, JSON.stringify(package_json, null, '\t') + '\n');

	// Create changeset if we have published version info
	if (published_versions && published_versions.size > 0) {
		// Build dependency updates info for changeset
		const all_deps = new Map<string, string>();

		// Collect all current dependencies with their versions
		if (repo.dependencies) {
			for (const [name, version] of repo.dependencies) {
				if (updates.has(name)) {
					all_deps.set(name, version);
				}
			}
		}
		if (repo.dev_dependencies) {
			for (const [name, version] of repo.dev_dependencies) {
				if (updates.has(name)) {
					all_deps.set(name, version);
				}
			}
		}
		if (repo.peer_dependencies) {
			for (const [name, version] of repo.peer_dependencies) {
				if (updates.has(name)) {
					all_deps.set(name, version);
				}
			}
		}

		const dependency_updates = create_dependency_updates(all_deps, published_versions);

		if (dependency_updates.length > 0) {
			const changeset_path = await create_changeset_for_dependency_updates(
				repo,
				dependency_updates,
				log,
			);

			// Add changeset to git
			await git_ops.add(changeset_path, repo.repo_dir);
		}
	}

	// Commit the changes (including both package.json and changeset)
	await git_ops.add('package.json', repo.repo_dir);
	await git_ops.commit(`update dependencies after publishing`, repo.repo_dir);
};

/**
 * Updates all dependencies across multiple repos.
 */
export const update_all_repos = async (
	repos: Array<Local_Repo>,
	published: Map<string, string>,
	strategy: Version_Strategy = 'caret',
	log?: Logger,
	git_ops: Git_Operations = default_git_operations,
	fs_ops: Fs_Operations = default_fs_operations,
): Promise<{updated: number; failed: Array<{repo: string; error: Error}>}> => {
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
			await update_package_json(repo, updates, strategy, undefined, log, git_ops, fs_ops);
			updated_count++;
			log?.info(`    Updated ${updates.size} dependencies in ${repo.pkg.name}`);
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			failed.push({repo: repo.pkg.name, error: err});
			log?.error(`    Failed to update ${repo.pkg.name}: ${err.message}`);
		}
	}

	return {updated: updated_count, failed};
};

/**
 * Gets dependencies that need updating for a repo.
 */
export const find_updates_needed = (
	repo: Local_Repo,
	published: Map<string, string>,
): Map<
	string,
	{current: string; new: string; type: 'dependencies' | 'devDependencies' | 'peerDependencies'}
> => {
	const updates = new Map<
		string,
		{current: string; new: string; type: 'dependencies' | 'devDependencies' | 'peerDependencies'}
	>();

	// Check dependencies
	if (repo.dependencies) {
		for (const [dep_name, current_version] of repo.dependencies) {
			const new_version = published.get(dep_name);
			if (new_version && needs_update(current_version, new_version)) {
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
			if (new_version && needs_update(current_version, new_version)) {
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
			if (new_version && needs_update(current_version, new_version)) {
				updates.set(dep_name, {
					current: current_version,
					new: new_version,
					type: 'peerDependencies',
				});
			}
		}
	}

	return updates;
};
