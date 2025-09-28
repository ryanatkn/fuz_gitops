import type {Logger} from '@ryanatkn/belt/log.js';
import {spawn_cli} from '@ryanatkn/gro/cli.js';
import {git_check_clean_workspace, git_current_commit_hash} from '@ryanatkn/gro/git.js';
import {Task_Error} from '@ryanatkn/gro';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {styleText as st} from 'node:util';

import type {Local_Repo} from './local_repo.js';
import {Dependency_Graph_Builder} from './dependency_graph.js';
import {Npm_Registry} from './npm_registry.js';
import {Dependency_Updater, type Version_Strategy} from './dependency_updater.js';
import type {Bump_Type} from './semver.js';

export interface Publishing_Options {
	dry: boolean;
	bump: Bump_Type | 'auto';
	continue_on_error: boolean;
	update_deps: boolean;
	version_strategy?: Version_Strategy;
	skip_dev?: boolean;
	max_wait?: number;
	log?: Logger;
}

export interface Published_Version {
	name: string;
	old_version: string;
	new_version: string;
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
export async function publish_repos(
	repos: Array<Local_Repo>,
	options: Publishing_Options,
): Promise<Publishing_Result> {
	const start_time = Date.now();
	const {dry, continue_on_error, update_deps, skip_dev, log} = options;

	// Build dependency graph
	log?.info('📊 Analyzing dependencies...');
	const builder = new Dependency_Graph_Builder();
	const graph = builder.build_from_repos(repos);

	// Compute publishing order
	let order: Array<string>;
	try {
		order = graph.topological_sort(true); // exclude dev deps to break cycles
		log?.info(`  Publishing order: ${order.join(' → ')}`);
	} catch (error) {
		throw new Task_Error('Failed to compute publishing order: ' + error);
	}

	// Pre-flight checks
	log?.info('✅ Running pre-flight checks...');
	for (const repo of repos) {
		const error_message = await git_check_clean_workspace({cwd: repo.repo_dir});
		if (error_message) {
			throw new Task_Error(
				`Repository ${repo.pkg.name} has uncommitted changes: ${error_message}`,
			);
		}
	}

	const published = new Map<string, Published_Version>();
	const failed = new Map<string, Error>();

	// Phase 1: Publish packages
	log?.info(st('cyan', `\n🚀 Publishing ${order.length} packages...\n`));

	for (const pkg_name of order) {
		const repo = repos.find((r) => r.pkg.name === pkg_name);
		if (!repo) continue;

		try {
			log?.info(`Publishing ${pkg_name}...`);
			const version = await publish_single_repo(repo, options);
			published.set(pkg_name, version);
			log?.info(st('green', `  ✅ Published ${pkg_name}@${version.new_version}`));
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			failed.set(pkg_name, err);
			log?.error(st('red', `  ❌ Failed to publish ${pkg_name}: ${err.message}`));
			if (!continue_on_error) break;
		}
	}

	// Phase 2: Wait for NPM availability
	if (published.size > 0 && !dry) {
		log?.info(st('cyan', '\n⏳ Waiting for NPM availability...\n'));
		const registry = new Npm_Registry(log);

		const packages = Array.from(published.values()).map((v) => ({
			name: v.name,
			version: v.new_version,
		}));

		await registry.wait_for_packages(packages, {
			max_attempts: 30,
			initial_delay: 1000,
			max_delay: 60000,
			timeout: options.max_wait || 300000,
		});
	}

	// Phase 3: Update dependencies
	if (update_deps && published.size > 0 && !dry) {
		log?.info(st('cyan', '\n🔄 Updating dependencies...\n'));
		const updater = new Dependency_Updater(log);

		// Create version map
		const published_versions = new Map<string, string>();
		for (const [name, info] of published) {
			published_versions.set(name, info.new_version);
		}

		// Filter repos based on skip_dev option
		const repos_to_update = skip_dev
			? repos.filter((r) => {
					// Only update repos that have non-dev dependencies on published packages
					const has_prod_or_peer_deps =
						(r.dependencies && Array.from(r.dependencies.keys()).some((d) => published_versions.has(d))) ||
						(r.peer_dependencies && Array.from(r.peer_dependencies.keys()).some((d) => published_versions.has(d)));
					return has_prod_or_peer_deps;
			  })
			: repos;

		const result = await updater.update_all_repos(
			repos_to_update,
			published_versions,
			options.version_strategy || 'caret',
		);

		if (result.updated > 0) {
			log?.info(st('green', `  ✅ Updated dependencies in ${result.updated} repositories`));
		} else {
			log?.info('  No dependencies needed updating');
		}

		if (result.failed.length > 0) {
			log?.error(st('red', `  ❌ Failed to update ${result.failed.length} repositories`));
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
	} else {
		log?.error(st('red', '\n❌ Some packages failed to publish\n'));
	}

	return {
		ok,
		published: Array.from(published.values()),
		failed: Array.from(failed.entries()).map(([name, error]) => ({name, error})),
		duration,
	};
}

/**
 * Publishes a single repository.
 */
async function publish_single_repo(
	repo: Local_Repo,
	options: Publishing_Options,
): Promise<Published_Version> {
	const {dry, log} = options;

	const old_version = repo.pkg.package_json.version || '0.0.0';

	if (dry) {
		// In dry run, just simulate what would happen
		return {
			name: repo.pkg.name,
			old_version,
			new_version: old_version, // Can't predict without running changesets
			commit: 'dry-run',
			tag: `v${old_version}`,
		};
	}

	// Run gro publish which handles changesets version, build, and npm publish
	const publish_result = await spawn_cli('gro', ['publish'], log, {cwd: repo.repo_dir});

	if (!publish_result?.ok) {
		throw new Error(`Failed to publish ${repo.pkg.name}`);
	}

	// Read the new version from package.json after gro publish
	const package_json_path = join(repo.repo_dir, 'package.json');
	const content = await readFile(package_json_path, 'utf8');
	const package_json = JSON.parse(content);
	const new_version = package_json.version;

	// Get actual commit hash
	const commit = (await git_current_commit_hash(undefined, {cwd: repo.repo_dir})) || 'HEAD';

	return {
		name: repo.pkg.name,
		old_version,
		new_version,
		commit,
		tag: `v${new_version}`,
	};
}