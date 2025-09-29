import type {Logger} from '@ryanatkn/belt/log.js';
import {spawn_out} from '@ryanatkn/belt/process.js';
import {styleText as st} from 'node:util';

import type {Local_Repo} from './local_repo.js';
import {has_changesets} from './changeset_reader.js';
import type {Git_Operations} from './operations.js';
import {default_git_operations} from './default_operations.js';

export interface Pre_Flight_Options {
	skip_changesets?: boolean;
	required_branch?: string;
	log?: Logger;
}

export interface Pre_Flight_Result {
	ok: boolean;
	warnings: Array<string>;
	errors: Array<string>;
	repos_with_changesets: Set<string>;
	repos_without_changesets: Set<string>;
}

/**
 * Runs pre-flight checks for all repos before publishing.
 * Validates workspaces, branches, changesets, and npm auth.
 */
export const run_pre_flight_checks = async (
	repos: Array<Local_Repo>,
	options: Pre_Flight_Options = {},
	git_ops: Git_Operations = default_git_operations,
): Promise<Pre_Flight_Result> => {
	const {skip_changesets = false, required_branch = 'main', log} = options;

	const warnings: Array<string> = [];
	const errors: Array<string> = [];
	const repos_with_changesets = new Set<string>();
	const repos_without_changesets = new Set<string>();

	log?.info(st('cyan', '✅ Running pre-flight checks...'));

	// 1. Check clean workspaces
	log?.info('  Checking workspace cleanliness...');
	for (const repo of repos) {
		const is_clean = await git_ops.check_clean_workspace(repo.repo_dir);
		if (!is_clean) {
			errors.push(`${repo.pkg.name} has uncommitted changes`);
		}
	}

	// 2. Check correct branch
	log?.info(`  Checking branches (expecting ${required_branch})...`);
	for (const repo of repos) {
		const branch = await git_ops.current_branch_name(repo.repo_dir);
		if (branch !== required_branch) {
			errors.push(`${repo.pkg.name} is on branch '${branch}', expected '${required_branch}'`);
		}
	}

	// 3. Check changesets (unless skipped)
	if (!skip_changesets) {
		log?.info('  Checking for changesets...');
		for (const repo of repos) {
			const has = await has_changesets(repo);
			if (has) {
				repos_with_changesets.add(repo.pkg.name);
			} else {
				repos_without_changesets.add(repo.pkg.name);
				warnings.push(`${repo.pkg.name} has no changesets`);
			}
		}

		if (repos_without_changesets.size > 0) {
			log?.warn(
				st('yellow', `  ⚠️  ${repos_without_changesets.size} packages have no changesets`),
			);
		}
	}

	// 4. Check npm authentication
	log?.info('  Checking npm authentication...');
	const npm_auth_result = await check_npm_auth();
	if (!npm_auth_result.ok) {
		errors.push(`npm authentication failed: ${npm_auth_result.error}`);
	}

	// 5. Check network connectivity (npm registry)
	log?.info('  Checking npm registry connectivity...');
	const registry_result = await check_npm_registry();
	if (!registry_result.ok) {
		warnings.push(`npm registry check failed: ${registry_result.error}`);
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
	};
};

/**
 * Checks if npm authentication is configured.
 */
async function check_npm_auth(): Promise<{ok: boolean; error?: string}> {
	try {
		const result = await spawn_out('npm', ['whoami']);
		if (result.stdout) {
			const username = result.stdout.trim();
			if (username) {
				return {ok: true};
			}
		}
		return {ok: false, error: 'Not logged in to npm'};
	} catch (error) {
		return {ok: false, error: String(error)};
	}
}

/**
 * Checks npm registry connectivity.
 */
async function check_npm_registry(): Promise<{ok: boolean; error?: string}> {
	try {
		const result = await spawn_out('npm', ['ping']);
		if (result.stdout) {
			return {ok: true};
		}
		return {ok: false, error: 'Failed to ping npm registry'};
	} catch (error) {
		return {ok: false, error: String(error)};
	}
}

