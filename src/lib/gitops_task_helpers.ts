import {Task_Error} from '@ryanatkn/gro';
import {styleText as st} from 'node:util';
import {resolve} from 'node:path';
import {print_path} from '@ryanatkn/gro/paths.js';
import type {Logger} from '@ryanatkn/belt/log.js';
import {spawn_cli} from '@ryanatkn/gro/cli.js';

import {load_gitops_config, type Gitops_Config} from '$lib/gitops_config.js';
import {
	load_local_repos,
	resolve_local_repo,
	type Local_Repo,
	type Resolved_Local_Repo,
	type Unresolved_Local_Repo,
} from '$lib/local_repo.js';
import {resolve_gitops_config} from '$lib/resolved_gitops_config.js';

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
	local_repos: Array<Local_Repo>;
}> => {
	const {config_path, repos_dir} = resolve_gitops_paths(path, dir);

	const gitops_config = await import_gitops_config(config_path);

	log?.info(
		`resolving gitops configs on the filesystem in ${repos_dir}`,
		gitops_config.repos.map((r) => r.repo_url),
	);
	const resolved_config = resolve_gitops_config(gitops_config, repos_dir);

	let resolved_local_repos: Array<Resolved_Local_Repo> | null = null;

	if (resolved_config.unresolved_local_repos) {
		if (download) {
			const downloaded = await download_repos(
				repos_dir,
				resolved_config.unresolved_local_repos,
				log,
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
	} else {
		resolved_local_repos = resolved_config.resolved_local_repos;
	}

	if (!resolved_local_repos) {
		throw new Task_Error('No repos are configured in `gitops_config.ts`');
	}

	const local_repos = await load_local_repos(resolved_local_repos, log);

	return {config_path, repos_dir, gitops_config, local_repos};
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

const download_repos = async (
	repos_dir: string,
	unresolved_local_repos: Array<Unresolved_Local_Repo>,
	log: Logger | undefined,
): Promise<Array<Resolved_Local_Repo>> => {
	const resolved: Array<Resolved_Local_Repo> = [];
	for (const {repo_config, repo_git_ssh_url} of unresolved_local_repos) {
		log?.info(`cloning repo ${repo_git_ssh_url} to ${repos_dir}`);
		await spawn_cli('git', ['clone', repo_git_ssh_url], log, {cwd: repos_dir}); // eslint-disable-line no-await-in-loop
		const local_repo = resolve_local_repo(repo_config, repos_dir);
		if (local_repo.type === 'unresolved_local_repo') {
			throw new Task_Error(`Failed to clone repo ${repo_git_ssh_url} to ${repos_dir}`);
		}
		resolved.push(local_repo);
	}
	return resolved;
};
