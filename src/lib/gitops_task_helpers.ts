import {Task_Error} from '@ryanatkn/gro';
import {styleText as st} from 'node:util';
import {resolve, dirname} from 'node:path';
import {print_path} from '@ryanatkn/gro/paths.js';
import type {Logger} from '@ryanatkn/belt/log.js';

import {load_gitops_config, type Gitops_Config} from '$lib/gitops_config.js';
import {load_local_repos, resolve_local_repos, type Local_Repo} from '$lib/local_repo.js';
import {resolve_gitops_config} from '$lib/resolved_gitops_config.js';
import {DEFAULT_REPOS_DIR} from '$lib/paths.js';
import type {Git_Operations, Npm_Operations} from '$lib/operations.js';

export interface Get_Gitops_Ready_Options {
	path: string;
	dir?: string;
	download: boolean;
	log?: Logger;
	git_ops?: Git_Operations;
	npm_ops?: Npm_Operations;
}

/**
 * Readies the workspace for all gitops repos.
 */
export const get_gitops_ready = async (
	options: Get_Gitops_Ready_Options,
): Promise<{
	config_path: string;
	repos_dir: string;
	gitops_config: Gitops_Config;
	local_repos: Array<Local_Repo>;
}> => {
	const {path, dir, download, log, git_ops, npm_ops} = options;
	const config_path = resolve(path);
	const gitops_config = await import_gitops_config(config_path);

	// Priority: explicit dir arg → config repos_dir → default (two dirs up from config)
	const repos_dir = resolve_gitops_paths({
		path,
		dir,
		config_repos_dir: gitops_config.repos_dir,
	}).repos_dir;

	log?.info(
		`resolving gitops configs on the filesystem in ${repos_dir}`,
		gitops_config.repos.map((r) => r.repo_url),
	);
	const resolved_config = resolve_gitops_config(gitops_config, repos_dir);

	const resolved_local_repos = await resolve_local_repos({
		resolved_config,
		repos_dir,
		gitops_config,
		download,
		log,
		npm_ops,
	});

	const local_repos = await load_local_repos({resolved_local_repos, log, git_ops, npm_ops});

	return {config_path, repos_dir, gitops_config, local_repos};
};

export interface Resolve_Gitops_Paths_Options {
	path: string;
	dir?: string;
	config_repos_dir?: string;
}

export const resolve_gitops_paths = (
	options: Resolve_Gitops_Paths_Options,
): {config_path: string; repos_dir: string} => {
	const {path, dir, config_repos_dir} = options;
	const config_path = resolve(path);
	const config_dir = dirname(config_path);

	// Priority: explicit dir arg → config repos_dir → default (parent of config dir)
	const repos_dir =
		dir !== undefined
			? resolve(dir)
			: config_repos_dir !== undefined
				? resolve(config_dir, config_repos_dir)
				: resolve(config_dir, DEFAULT_REPOS_DIR);

	return {config_path, repos_dir};
};

export const import_gitops_config = async (config_path: string): Promise<Gitops_Config> => {
	const gitops_config = await load_gitops_config(config_path);
	if (!gitops_config) {
		throw new Task_Error(st('red', `No gitops config found at ${print_path(config_path)}`));
	}
	return gitops_config;
};
