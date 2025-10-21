import type {Logger} from '@ryanatkn/belt/log.js';
import {spawn_out} from '@ryanatkn/belt/process.js';
import {styleText as st} from 'node:util';

import type {Local_Repo} from '$lib/local_repo.js';
import type {
	Git_Operations,
	Npm_Operations,
	Build_Operations,
	Changeset_Operations,
} from '$lib/operations.js';
import {
	default_git_operations,
	default_npm_operations,
	default_build_operations,
	default_changeset_operations,
} from '$lib/operations_defaults.js';

export interface Pre_Flight_Options {
	skip_changesets?: boolean;
	skip_build_validation?: boolean; // Skip build validation (useful for tests)
	required_branch?: string;
	check_remote?: boolean; // Check if git remote is reachable
	estimate_time?: boolean; // Estimate total publish time
	log?: Logger;
}

export interface Pre_Flight_Result {
	ok: boolean;
	warnings: Array<string>;
	errors: Array<string>;
	repos_with_changesets: Set<string>;
	repos_without_changesets: Set<string>;
	estimated_duration?: number; // In seconds
	npm_username?: string;
}

/**
 * Runs pre-flight checks for all repos before publishing.
 * Validates workspaces, branches, changesets, builds, and npm auth.
 */
export const run_pre_flight_checks = async (
	repos: Array<Local_Repo>,
	options: Pre_Flight_Options = {},
	git_ops: Git_Operations = default_git_operations,
	npm_ops: Npm_Operations = default_npm_operations,
	build_ops: Build_Operations = default_build_operations,
	changeset_ops: Changeset_Operations = default_changeset_operations,
): Promise<Pre_Flight_Result> => {
	const {
		skip_changesets = false,
		skip_build_validation = false,
		required_branch = 'main',
		check_remote = true,
		estimate_time = true,
		log,
	} = options;

	const warnings: Array<string> = [];
	const errors: Array<string> = [];
	const repos_with_changesets: Set<string> = new Set();
	const repos_without_changesets: Set<string> = new Set();
	let npm_username: string | undefined;
	let estimated_duration: number | undefined;

	log?.info(st('cyan', '✅ Running pre-flight checks...'));

	// 1. Check clean workspaces - must be 100% clean before publishing
	log?.info('  Checking workspace cleanliness...');
	for (const repo of repos) {
		const is_clean = await git_ops.check_clean_workspace(repo.repo_dir); // eslint-disable-line no-await-in-loop
		if (!is_clean) {
			// Get list of changed files for better error message
			try {
				const changed_files = await git_ops.get_changed_files(repo.repo_dir); // eslint-disable-line no-await-in-loop
				// No filtering - workspace must be 100% clean
				const unexpected_files = changed_files;

				if (unexpected_files.length > 0) {
					errors.push(
						`${repo.pkg.name} has uncommitted changes in: ${unexpected_files.slice(0, 3).join(', ')}${unexpected_files.length > 3 ? ` and ${unexpected_files.length - 3} more` : ''}`,
					);
				}
			} catch {
				errors.push(`${repo.pkg.name} has uncommitted changes`);
			}
		}
	}

	// 2. Check correct branch
	log?.info(`  Checking branches (expecting ${required_branch})...`);
	for (const repo of repos) {
		const branch = await git_ops.current_branch_name(repo.repo_dir); // eslint-disable-line no-await-in-loop
		if (branch !== required_branch) {
			errors.push(`${repo.pkg.name} is on branch '${branch}', expected '${required_branch}'`);
		}
	}

	// 3. Check changesets (unless skipped)
	if (!skip_changesets) {
		log?.info('  Checking for changesets...');
		for (const repo of repos) {
			const has = await changeset_ops.has_changesets(repo); // eslint-disable-line no-await-in-loop
			if (has) {
				repos_with_changesets.add(repo.pkg.name);
			} else {
				repos_without_changesets.add(repo.pkg.name);
				warnings.push(`${repo.pkg.name} has no changesets`);
			}
		}

		if (repos_without_changesets.size > 0) {
			log?.warn(st('yellow', `  ⚠️  ${repos_without_changesets.size} packages have no changesets`));
		}
	}

	// 4. Validate builds for packages with changesets
	if (!skip_build_validation && repos_with_changesets.size > 0) {
		log?.info(st('cyan', `  Validating builds for ${repos_with_changesets.size} package(s)...`));
		const repos_to_build = repos.filter((repo) => repos_with_changesets.has(repo.pkg.name));

		for (let i = 0; i < repos_to_build.length; i++) {
			const repo = repos_to_build[i];
			log?.info(st('dim', `    [${i + 1}/${repos_to_build.length}] Building ${repo.pkg.name}...`));
			const build_result = await build_ops.build_package(repo, log); // eslint-disable-line no-await-in-loop
			if (!build_result.ok) {
				errors.push(`${repo.pkg.name} failed to build: ${build_result.error || 'unknown error'}`);
			} else {
				log?.info(st('dim', `    ✓ ${repo.pkg.name} built successfully`));
			}
		}

		if (errors.some((err) => err.includes('failed to build'))) {
			log?.error(st('red', '  ❌ Build validation failed - fix build errors before publishing'));
		} else {
			log?.info(st('green', '  ✓ All builds validated successfully'));
		}
	}

	// 5. Check git remote reachability (skip in tests when check_remote is false)
	if (check_remote && repos.length > 0) {
		log?.info('  Checking git remote connectivity...');
		// Only check first repo to avoid slowing down tests with multiple remote checks
		const remote_result = await check_git_remote(repos[0].repo_dir);
		if (!remote_result.ok) {
			warnings.push(`git remote may not be reachable - ${remote_result.error}`);
		}
	}

	// 6. Check npm authentication with username
	log?.info('  Checking npm authentication...');
	const npm_auth_result = await npm_ops.check_auth();
	if (!npm_auth_result.ok) {
		errors.push(`npm authentication failed: ${npm_auth_result.error || 'not logged in'}`);
	} else {
		npm_username = npm_auth_result.username;
		log?.info(st('dim', `    Logged in as: ${npm_username}`));
	}

	// 7. Check network connectivity (npm registry)
	log?.info('  Checking npm registry connectivity...');
	const registry_result = await npm_ops.check_registry();
	if (!registry_result.ok) {
		warnings.push(`npm registry check failed: ${registry_result.error}`);
	}

	// 8. Estimate total publish time
	if (estimate_time) {
		const packages_to_publish = repos_with_changesets.size;
		if (packages_to_publish > 0) {
			// Rough estimate: 30s per package + 10s per package for NPM propagation
			estimated_duration = packages_to_publish * 40;
			log?.info(
				st(
					'dim',
					`  Estimated publish time: ~${Math.ceil(estimated_duration / 60)} minutes for ${packages_to_publish} package(s)`,
				),
			);
		}
	}

	// Report results
	const ok = errors.length === 0;

	if (errors.length > 0) {
		log?.error(st('red', `\n❌ Pre-flight checks failed with ${errors.length} errors:`));
		for (const error of errors) {
			log?.error(`  - ${error}`);
		}
	}

	if (warnings.length > 0) {
		log?.warn(st('yellow', `\n⚠️  Pre-flight checks found ${warnings.length} warnings:`));
		for (const warning of warnings) {
			log?.warn(`  - ${warning}`);
		}
	}

	if (ok) {
		log?.info(st('green', '\n✨ All pre-flight checks passed!'));
	}

	return {
		ok,
		warnings,
		errors,
		repos_with_changesets,
		repos_without_changesets,
		estimated_duration,
		npm_username,
	};
};

/**
 * Checks if git remote is reachable.
 */
const check_git_remote = async (cwd: string): Promise<{ok: boolean; error?: string}> => {
	try {
		// Try to fetch refs from remote without downloading objects
		const result = await spawn_out('git', ['ls-remote', '--heads', 'origin'], {cwd});
		if (result.stdout || result.stderr) {
			return {ok: true};
		}
		return {ok: false, error: 'No response from git remote'};
	} catch (error) {
		return {ok: false, error: String(error)};
	}
};
