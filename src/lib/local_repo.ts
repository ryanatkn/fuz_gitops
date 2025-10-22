import {strip_end} from '@ryanatkn/belt/string.js';
import {load_package_json} from '@ryanatkn/gro/package_json.js';
import {parse_pkg, type Pkg} from '@ryanatkn/belt/pkg.js';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {create_src_json} from '@ryanatkn/gro/src_json.js';
import {parse_svelte_config} from '@ryanatkn/gro/svelte_config.js';
import {Task_Error} from '@ryanatkn/gro';
import type {Logger} from '@ryanatkn/belt/log.js';
import {spawn} from '@ryanatkn/belt/process.js';
import type {Git_Operations, Npm_Operations} from '$lib/operations.js';
import {default_git_operations, default_npm_operations} from '$lib/operations_defaults.js';

import type {Gitops_Config, Gitops_Repo_Config} from '$lib/gitops_config.js';
import type {Resolved_Gitops_Config} from '$lib/resolved_gitops_config.js';

export interface Local_Repo extends Resolved_Local_Repo {
	pkg: Pkg;
	dependencies?: Map<string, string>;
	dev_dependencies?: Map<string, string>;
	peer_dependencies?: Map<string, string>;
}

export type Maybe_Local_Repo = Resolved_Local_Repo | Unresolved_Local_Repo;

export interface Resolved_Local_Repo {
	type: 'resolved_local_repo';
	repo_name: string;
	repo_dir: string;
	repo_url: string;
	repo_git_ssh_url: string;
	repo_config: Gitops_Repo_Config;
}

export interface Unresolved_Local_Repo {
	type: 'unresolved_local_repo';
	repo_name: string;
	repo_url: string;
	repo_git_ssh_url: string;
	repo_config: Gitops_Repo_Config;
}

/**
 * Loads the data for a resolved local repo, switching branches if needed and pulling latest changes.
 * Automatically installs dependencies if package.json changed during pull.
 */
export const load_local_repo = async (
	resolved_local_repo: Resolved_Local_Repo,
	_log?: Logger,
	git_ops: Git_Operations = default_git_operations,
	npm_ops: Npm_Operations = default_npm_operations,
): Promise<Local_Repo> => {
	const {repo_config, repo_dir} = resolved_local_repo;

	// Record commit hash before any changes
	const commit_before_result = await git_ops.current_commit_hash({cwd: repo_dir});
	if (!commit_before_result.ok) {
		throw new Task_Error(`Failed to get commit hash: ${commit_before_result.message}`);
	}
	const commit_before = commit_before_result.value;

	// Switch to target branch if needed
	const branch_result = await git_ops.current_branch_name({cwd: repo_dir});
	if (!branch_result.ok) {
		throw new Task_Error(`Failed to get current branch: ${branch_result.message}`);
	}

	const switched_branches = branch_result.value !== repo_config.branch;
	if (switched_branches) {
		const clean_result = await git_ops.check_clean_workspace({cwd: repo_dir});
		if (!clean_result.ok) {
			throw new Task_Error(`Failed to check workspace: ${clean_result.message}`);
		}

		if (!clean_result.value) {
			throw new Task_Error(
				`Repo ${repo_dir} is not on branch "${repo_config.branch}" and the workspace is unclean, blocking switch`,
			);
		}

		const checkout_result = await git_ops.checkout({branch: repo_config.branch, cwd: repo_dir});
		if (!checkout_result.ok) {
			throw new Task_Error(`Failed to checkout branch: ${checkout_result.message}`);
		}
	}

	// Only pull if remote exists (skip for local-only repos, test fixtures)
	const origin_result = await git_ops.has_remote({remote: 'origin', cwd: repo_dir});
	if (!origin_result.ok) {
		throw new Task_Error(`Failed to check for remote: ${origin_result.message}`);
	}

	if (origin_result.value) {
		const pull_result = await git_ops.pull({cwd: repo_dir});
		if (!pull_result.ok) {
			throw new Task_Error(`Failed to pull: ${pull_result.message}`);
		}
	}

	// Check clean workspace after pull to ensure we're in a good state
	const clean_after_result = await git_ops.check_clean_workspace({cwd: repo_dir});
	if (!clean_after_result.ok) {
		throw new Task_Error(`Failed to check workspace: ${clean_after_result.message}`);
	}

	if (!clean_after_result.value) {
		throw new Task_Error(`Workspace is unclean after pulling branch "${repo_config.branch}"`);
	}

	// Record commit hash after pull
	const commit_after_result = await git_ops.current_commit_hash({cwd: repo_dir});
	if (!commit_after_result.ok) {
		throw new Task_Error(`Failed to get commit hash: ${commit_after_result.message}`);
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
			throw new Task_Error(`Failed to check if package.json changed: ${changed_result.message}`);
		}

		if (changed_result.value) {
			const install_result = await npm_ops.install({cwd: resolved_local_repo.repo_dir});
			if (!install_result.ok) {
				throw new Task_Error(
					`Failed to install dependencies in ${repo_dir}: ${install_result.message}${install_result.stderr ? `\n${install_result.stderr}` : ''}`,
				);
			}
		}
	}

	const parsed_svelte_config = await parse_svelte_config({dir_or_config: repo_dir});
	const lib_path = join(repo_dir, parsed_svelte_config.lib_path);

	const package_json = load_package_json(repo_dir);
	const src_json = create_src_json(package_json, lib_path);

	const local_repo: Local_Repo = {
		...resolved_local_repo,
		pkg: parse_pkg(package_json, src_json),
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

export const resolve_local_repos = async (
	resolved_config: Resolved_Gitops_Config,
	repos_dir: string,
	gitops_config: Gitops_Config,
	download: boolean,
	log?: Logger,
	npm_ops: Npm_Operations = default_npm_operations,
): Promise<Array<Resolved_Local_Repo>> => {
	let resolved_local_repos: Array<Resolved_Local_Repo> | null = null;

	if (!resolved_config.unresolved_local_repos) {
		resolved_local_repos = resolved_config.resolved_local_repos;
	} else {
		if (download) {
			const downloaded = await download_repos(
				repos_dir,
				resolved_config.unresolved_local_repos,
				log,
				npm_ops,
			);
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
			throw new Task_Error('Failed to resolve local configs');
		}
	}

	if (!resolved_local_repos) {
		throw new Task_Error('No repos are configured in `gitops_config.ts`');
	}

	return resolved_local_repos;
};

export const load_local_repos = async (
	resolved_local_repos: Array<Resolved_Local_Repo>,
	log?: Logger,
	git_ops: Git_Operations = default_git_operations,
	npm_ops: Npm_Operations = default_npm_operations,
): Promise<Array<Local_Repo>> => {
	const loaded: Array<Local_Repo> = [];
	for (const resolved_local_repo of resolved_local_repos) {
		loaded.push(await load_local_repo(resolved_local_repo, log, git_ops, npm_ops)); // eslint-disable-line no-await-in-loop
	}
	return loaded;
};

export const resolve_local_repo = (
	repo_config: Gitops_Repo_Config,
	repos_dir: string,
): Maybe_Local_Repo => {
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

const download_repos = async (
	repos_dir: string,
	unresolved_local_repos: Array<Unresolved_Local_Repo>,
	log: Logger | undefined,
	npm_ops: Npm_Operations = default_npm_operations,
): Promise<Array<Resolved_Local_Repo>> => {
	const resolved: Array<Resolved_Local_Repo> = [];
	for (const {repo_config, repo_git_ssh_url} of unresolved_local_repos) {
		log?.info(`cloning repo ${repo_git_ssh_url} to ${repos_dir}`);
		await spawn('git', ['clone', repo_git_ssh_url], {cwd: repos_dir}); // eslint-disable-line no-await-in-loop
		const local_repo = resolve_local_repo(repo_config, repos_dir);
		if (local_repo.type === 'unresolved_local_repo') {
			throw new Task_Error(`Failed to clone repo ${repo_git_ssh_url} to ${repos_dir}`);
		}
		// Always install dependencies after cloning
		log?.info(`installing dependencies for newly cloned repo ${local_repo.repo_dir}`);
		const install_result = await npm_ops.install({cwd: local_repo.repo_dir}); // eslint-disable-line no-await-in-loop
		if (!install_result.ok) {
			throw new Task_Error(
				`Failed to install dependencies in ${local_repo.repo_dir}: ${install_result.message}${install_result.stderr ? `\n${install_result.stderr}` : ''}`,
			);
		}
		resolved.push(local_repo);
	}
	return resolved;
};
