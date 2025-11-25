import {strip_end} from '@ryanatkn/belt/string.js';
import {load_package_json} from '@ryanatkn/gro/package_json.js';
import {Pkg} from '@ryanatkn/fuz/pkg.svelte.js';
import type {SrcJson} from '@ryanatkn/belt/src_json.js';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {TaskError} from '@ryanatkn/gro';
import type {Logger} from '@ryanatkn/belt/log.js';
import {spawn} from '@ryanatkn/belt/process.js';
import type {GitOperations, NpmOperations} from './operations.js';
import {default_git_operations, default_npm_operations} from './operations_defaults.js';

import type {GitopsConfig, GitopsRepoConfig} from './gitops_config.js';
import type {ResolvedGitopsConfig} from './resolved_gitops_config.js';

export interface LocalRepo extends ResolvedLocalRepo {
	pkg: Pkg;
	dependencies?: Map<string, string>;
	dev_dependencies?: Map<string, string>;
	peer_dependencies?: Map<string, string>;
}

export type MaybeLocalRepo = ResolvedLocalRepo | UnresolvedLocalRepo;

export interface ResolvedLocalRepo {
	type: 'resolved_local_repo';
	repo_name: string;
	repo_dir: string;
	repo_url: string;
	repo_git_ssh_url: string;
	repo_config: GitopsRepoConfig;
}

export interface UnresolvedLocalRepo {
	type: 'unresolved_local_repo';
	repo_name: string;
	repo_url: string;
	repo_git_ssh_url: string;
	repo_config: GitopsRepoConfig;
}

/**
 * Loads repo data with automatic syncing and dependency management.
 *
 * Workflow:
 * 1. Records current commit hash (for detecting changes)
 * 2. Switches to target branch if needed (requires clean workspace)
 * 3. Pulls latest changes from remote (skipped for local-only repos)
 * 4. Validates workspace is clean after pull
 * 5. Auto-installs dependencies if package.json changed
 * 6. Parses package.json and extracts Pkg metadata
 *
 * This ensures repos are always in sync with their configured branch
 * before being used by gitops commands.
 *
 * @throws {TaskError} if workspace dirty, branch switch fails, or install fails
 */
export const load_local_repo = async ({
	resolved_local_repo,
	log: _log,
	git_ops = default_git_operations,
	npm_ops = default_npm_operations,
}: {
	resolved_local_repo: ResolvedLocalRepo;
	log?: Logger;
	git_ops?: GitOperations;
	npm_ops?: NpmOperations;
}): Promise<LocalRepo> => {
	const {repo_config, repo_dir} = resolved_local_repo;

	// Record commit hash before any changes
	const commit_before_result = await git_ops.current_commit_hash({cwd: repo_dir});
	if (!commit_before_result.ok) {
		throw new TaskError(`Failed to get commit hash: ${commit_before_result.message}`);
	}
	const commit_before = commit_before_result.value;

	// Switch to target branch if needed
	const branch_result = await git_ops.current_branch_name({cwd: repo_dir});
	if (!branch_result.ok) {
		throw new TaskError(`Failed to get current branch: ${branch_result.message}`);
	}

	const switched_branches = branch_result.value !== repo_config.branch;
	if (switched_branches) {
		const clean_result = await git_ops.check_clean_workspace({cwd: repo_dir});
		if (!clean_result.ok) {
			throw new TaskError(`Failed to check workspace: ${clean_result.message}`);
		}

		if (!clean_result.value) {
			throw new TaskError(
				`Repo ${repo_dir} is not on branch "${repo_config.branch}" and the workspace is unclean, blocking switch`,
			);
		}

		const checkout_result = await git_ops.checkout({branch: repo_config.branch, cwd: repo_dir});
		if (!checkout_result.ok) {
			throw new TaskError(`Failed to checkout branch: ${checkout_result.message}`);
		}
	}

	// Only pull if remote exists (skip for local-only repos, test fixtures)
	const origin_result = await git_ops.has_remote({remote: 'origin', cwd: repo_dir});
	if (!origin_result.ok) {
		throw new TaskError(`Failed to check for remote: ${origin_result.message}`);
	}

	if (origin_result.value) {
		const pull_result = await git_ops.pull({cwd: repo_dir});
		if (!pull_result.ok) {
			throw new TaskError(`Failed to pull: ${pull_result.message}`);
		}
	}

	// Check clean workspace after pull to ensure we're in a good state
	const clean_after_result = await git_ops.check_clean_workspace({cwd: repo_dir});
	if (!clean_after_result.ok) {
		throw new TaskError(`Failed to check workspace: ${clean_after_result.message}`);
	}

	if (!clean_after_result.value) {
		throw new TaskError(
			`Workspace ${repo_dir} is unclean after pulling branch "${repo_config.branch}"`,
		);
	}

	// Record commit hash after pull
	const commit_after_result = await git_ops.current_commit_hash({cwd: repo_dir});
	if (!commit_after_result.ok) {
		throw new TaskError(`Failed to get commit hash: ${commit_after_result.message}`);
	}
	const commit_after = commit_after_result.value;

	// Track if we got new commits
	const got_new_commits = commit_before !== commit_after;

	// Only install if package.json changed
	if (got_new_commits) {
		const changed_result = await git_ops.has_file_changed({
			from_commit: commit_before,
			to_commit: commit_after,
			file_path: 'package.json',
			cwd: repo_dir,
		});

		if (!changed_result.ok) {
			throw new TaskError(`Failed to check if package.json changed: ${changed_result.message}`);
		}

		if (changed_result.value) {
			const install_result = await npm_ops.install({cwd: repo_dir});
			if (!install_result.ok) {
				throw new TaskError(
					`Failed to install dependencies in ${repo_dir}: ${install_result.message}${install_result.stderr ? `\n${install_result.stderr}` : ''}`,
				);
			}
		}
	}

	const package_json = load_package_json(repo_dir);
	// Minimal src_json - gitops doesn't need module metadata for core functionality
	const src_json: SrcJson = {
		name: package_json.name,
		version: package_json.version,
		modules: [],
	};

	const local_repo: LocalRepo = {
		...resolved_local_repo,
		pkg: new Pkg(package_json, src_json),
	};

	// Extract dependencies
	if (package_json.dependencies) {
		local_repo.dependencies = new Map(Object.entries(package_json.dependencies));
	}
	if (package_json.devDependencies) {
		local_repo.dev_dependencies = new Map(Object.entries(package_json.devDependencies));
	}
	if (package_json.peerDependencies) {
		local_repo.peer_dependencies = new Map(Object.entries(package_json.peerDependencies));
	}

	return local_repo;
};

export const resolve_local_repos = async ({
	resolved_config,
	repos_dir,
	gitops_config,
	download,
	log,
	npm_ops = default_npm_operations,
}: {
	resolved_config: ResolvedGitopsConfig;
	repos_dir: string;
	gitops_config: GitopsConfig;
	download: boolean;
	log?: Logger;
	npm_ops?: NpmOperations;
}): Promise<Array<ResolvedLocalRepo>> => {
	let resolved_local_repos: Array<ResolvedLocalRepo> | null = null;

	if (!resolved_config.unresolved_local_repos) {
		resolved_local_repos = resolved_config.resolved_local_repos;
	} else {
		if (download) {
			const downloaded = await download_repos({
				repos_dir,
				unresolved_local_repos: resolved_config.unresolved_local_repos,
				log,
				npm_ops,
			});
			resolved_local_repos = (resolved_config.resolved_local_repos ?? [])
				.concat(downloaded)
				.sort(
					(a, b) =>
						gitops_config.repos.findIndex((r) => r.repo_url === a.repo_url) -
						gitops_config.repos.findIndex((r) => r.repo_url === b.repo_url),
				);
		} else {
			log?.error(
				`Failed to resolve local repos in ${repos_dir} - do you need to pass \`--download\` or configure the directory?`, // TODO leaking task impl details
				resolved_config.unresolved_local_repos.map((r) => r.repo_url),
			);
			throw new TaskError('Failed to resolve local configs');
		}
	}

	if (!resolved_local_repos) {
		throw new TaskError('No repos are configured in `gitops_config.ts`');
	}

	return resolved_local_repos;
};

export const load_local_repos = async ({
	resolved_local_repos,
	log,
	git_ops = default_git_operations,
	npm_ops = default_npm_operations,
}: {
	resolved_local_repos: Array<ResolvedLocalRepo>;
	log?: Logger;
	git_ops?: GitOperations;
	npm_ops?: NpmOperations;
}): Promise<Array<LocalRepo>> => {
	const loaded: Array<LocalRepo> = [];
	for (const resolved_local_repo of resolved_local_repos) {
		loaded.push(await load_local_repo({resolved_local_repo, log, git_ops, npm_ops})); // eslint-disable-line no-await-in-loop
	}
	return loaded;
};

export const resolve_local_repo = ({
	repo_config,
	repos_dir,
}: {
	repo_config: GitopsRepoConfig;
	repos_dir: string;
}): MaybeLocalRepo => {
	const {repo_url} = repo_config;
	const repo_name = strip_end(repo_url, '/').split('/').at(-1);
	if (!repo_name) throw Error('Invalid `repo_config.repo_url` ' + repo_url);

	const repo_git_ssh_url = to_repo_git_ssh_url(repo_url);

	const repo_dir = repo_config.repo_dir ?? join(repos_dir, repo_name);
	if (!existsSync(repo_dir)) {
		return {type: 'unresolved_local_repo', repo_name, repo_url, repo_git_ssh_url, repo_config};
	}

	return {
		type: 'resolved_local_repo',
		repo_name,
		repo_dir,
		repo_url,
		repo_git_ssh_url,
		repo_config,
	};
};

const to_repo_git_ssh_url = (repo_url: string): string => {
	const url = new URL(repo_url);
	return `git@${url.hostname}:${url.pathname.substring(1)}`;
};

const download_repos = async ({
	repos_dir,
	unresolved_local_repos,
	log,
	npm_ops = default_npm_operations,
}: {
	repos_dir: string;
	unresolved_local_repos: Array<UnresolvedLocalRepo>;
	log?: Logger;
	npm_ops?: NpmOperations;
}): Promise<Array<ResolvedLocalRepo>> => {
	const resolved: Array<ResolvedLocalRepo> = [];
	for (const {repo_config, repo_git_ssh_url} of unresolved_local_repos) {
		log?.info(`cloning repo ${repo_git_ssh_url} to ${repos_dir}`);
		await spawn('git', ['clone', repo_git_ssh_url], {cwd: repos_dir}); // eslint-disable-line no-await-in-loop
		const local_repo = resolve_local_repo({repo_config, repos_dir});
		if (local_repo.type === 'unresolved_local_repo') {
			throw new TaskError(`Failed to clone repo ${repo_git_ssh_url} to ${repos_dir}`);
		}
		// Always install dependencies after cloning
		log?.info(`installing dependencies for newly cloned repo ${local_repo.repo_dir}`);
		const install_result = await npm_ops.install({cwd: local_repo.repo_dir}); // eslint-disable-line no-await-in-loop
		if (!install_result.ok) {
			throw new TaskError(
				`Failed to install dependencies in ${local_repo.repo_dir}: ${install_result.message}${install_result.stderr ? `\n${install_result.stderr}` : ''}`,
			);
		}
		resolved.push(local_repo);
	}
	return resolved;
};
