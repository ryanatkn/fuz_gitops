import {Task_Error} from '@ryanatkn/gro';
import {styleText as st} from 'node:util';
import {resolve, dirname} from 'node:path';
import {print_path} from '@ryanatkn/gro/paths.js';
import type {Logger} from '@ryanatkn/belt/log.js';

import {load_gitops_config, type Gitops_Config} from '$lib/gitops_config.js';
import {load_local_repos, resolve_local_repos, type Local_Repo} from '$lib/local_repo.js';
import {resolve_gitops_config} from '$lib/resolved_gitops_config.js';
import {DEFAULT_REPOS_DIR} from '$lib/paths.js';

/**
 * Readies the workspace for all gitops repos.
 * @param path - path to the gitops config
 * @param dir - path to the repos dir
 * @param log
 * @param download - if repos are not available locally, should they be downloaded?
 */
export const get_gitops_ready = async (
	path: string,
	dir: string | undefined,
	download: boolean,
	install: boolean,
	log?: Logger,
): Promise<{
	config_path: string;
	repos_dir: string;
	gitops_config: Gitops_Config;
	local_repos: Array<Local_Repo>;
}> => {
	const config_path = resolve(path);
	const gitops_config = await import_gitops_config(config_path);

	// Priority: explicit dir arg → config repos_dir → default (two dirs up from config)
	const repos_dir = resolve_gitops_paths(path, dir, gitops_config.repos_dir).repos_dir;

	log?.info(
		`resolving gitops configs on the filesystem in ${repos_dir}`,
		gitops_config.repos.map((r) => r.repo_url),
	);
	const resolved_config = resolve_gitops_config(gitops_config, repos_dir);

	const resolved_local_repos = await resolve_local_repos(
		resolved_config,
		repos_dir,
		gitops_config,
		download,
		log,
	);

	const local_repos = await load_local_repos(resolved_local_repos, install, log);

	return {config_path, repos_dir, gitops_config, local_repos};
};

export const resolve_gitops_paths = (
	path: string,
	dir: string | undefined,
	config_repos_dir: string | undefined,
): {config_path: string; repos_dir: string} => {
	const config_path = resolve(path);
	const config_dir = dirname(config_path);

	// Priority: explicit dir arg → config repos_dir → default (parent of config dir)
	const repos_dir = dir !== undefined
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
