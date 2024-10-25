import {Task_Error} from '@ryanatkn/gro';
import {styleText as st} from 'node:util';
import {resolve} from 'node:path';
import {print_path} from '@ryanatkn/gro/paths.js';
import type {Logger} from '@ryanatkn/belt/log.js';

import {load_gitops_config, type Gitops_Config} from '$lib/gitops_config.js';
import {resolve_gitops_config, type Resolved_Local_Repo} from '$lib/resolve_gitops_config.js';

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
	log?: Logger,
	download: boolean = false,
): Promise<{
	config_path: string;
	repos_dir: string;
	gitops_config: Gitops_Config;
	local_repos: Resolved_Local_Repo[];
}> => {
	const {config_path, repos_dir} = resolve_gitops_paths(path, dir);

	const gitops_config = await import_gitops_config(config_path);

	log?.info('resolving gitops config on the filesystem');
	const resolved_config = await resolve_gitops_config(gitops_config, repos_dir);

	const {resolved_local_repos, unresolved_local_repos} = resolved_config;

	if (unresolved_local_repos) {
		if (download) {
			// TODO BLOCK clone each repo into `repos_dir`
		} else {
			log?.error(
				`Failed to resolve local repos in ${repos_dir} - do you need to pass \`--download\` or configure the directory?`, // TODO leaking task impl details
				unresolved_local_repos.map((r) => r.repo_url),
			);
			throw new Task_Error('Failed to resolve local configs');
		}
	}

	if (!resolved_local_repos) {
		throw new Task_Error('No repos are configured in `gitops_config.ts`');
	}

	return {config_path, repos_dir, gitops_config, local_repos: resolved_local_repos};
};

export const resolve_gitops_paths = (
	path: string,
	dir: string | undefined,
): {config_path: string; repos_dir: string} => {
	const config_path = resolve(path);

	const repos_dir = dir === undefined ? resolve(config_path, '../..') : resolve(dir);

	return {config_path, repos_dir};
};

export const import_gitops_config = async (config_path: string): Promise<Gitops_Config> => {
	const gitops_config = await load_gitops_config(config_path);
	if (!gitops_config) {
		throw new Task_Error(st('red', `No gitops config found at ${print_path(config_path)}`));
	}
	return gitops_config;
};
