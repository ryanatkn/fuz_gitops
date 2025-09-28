import {strip_end} from '@ryanatkn/belt/string.js';
import {load_package_json} from '@ryanatkn/gro/package_json.js';
import {parse_pkg, type Pkg} from '@ryanatkn/belt/pkg.js';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {create_src_json} from '@ryanatkn/gro/src_json.js';
import {parse_svelte_config} from '@ryanatkn/gro/svelte_config.js';
import {Task_Error} from '@ryanatkn/gro';
import {
	git_check_clean_workspace,
	git_checkout,
	git_current_branch_name,
	git_pull,
} from '@ryanatkn/gro/git.js';
import type {Logger} from '@ryanatkn/belt/log.js';
import {spawn_cli} from '@ryanatkn/gro/cli.js';

import type {Gitops_Repo_Config} from '$lib/gitops_config.js';

export interface Local_Repo extends Resolved_Local_Repo {
	pkg: Pkg;
	// TODO what else? filesystem info?
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
 * Loads the data for a resolved local repo, switching branches if needed.
 */
export const load_local_repo = async (
	resolved_local_repo: Resolved_Local_Repo,
	log?: Logger,
): Promise<Local_Repo> => {
	const {repo_config, repo_dir} = resolved_local_repo;

	// Switch branches if needed, erroring if unable.
	const branch = await git_current_branch_name({cwd: repo_dir});
	if (branch !== repo_config.branch) {
		const error_message = await git_check_clean_workspace({cwd: repo_dir});
		if (error_message) {
			throw new Task_Error(
				`Repo ${repo_dir} is not on branch "${repo_config.branch}" and the workspace is unclean, blocking switch: ${error_message}`,
			);
		}
		await git_checkout(repo_config.branch, {cwd: repo_dir});

		await git_pull();

		// TODO probably allow opt-in syncing, problem is it's very slow to do in the normal case
		// Sync the repo so deps are installed and generated files are up-to-date.
		await spawn_cli('gro', ['sync'], log, {cwd: resolved_local_repo.repo_dir});
	}

	const parsed_svelte_config = await parse_svelte_config({dir_or_config: repo_dir});
	const lib_path = join(repo_dir, parsed_svelte_config.lib_path);

	const package_json = load_package_json(repo_dir);
	const src_json = create_src_json(package_json, lib_path);

	return {
		...resolved_local_repo,
		pkg: parse_pkg(package_json, src_json),
	};
};

export const load_local_repos = async (
	resolved_local_repos: Array<Resolved_Local_Repo>,
	log?: Logger,
): Promise<Array<Local_Repo>> => {
	const loaded: Array<Local_Repo> = [];
	for (const resolved_local_repo of resolved_local_repos) {
		loaded.push(await load_local_repo(resolved_local_repo, log)); // eslint-disable-line no-await-in-loop
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
