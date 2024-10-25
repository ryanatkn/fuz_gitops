import {strip_end} from '@ryanatkn/belt/string.js';
import {load_package_json} from '@ryanatkn/gro/package_json.js';
import {parse_package_meta, type Package_Meta} from '@ryanatkn/gro/package_meta.js';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {create_src_json} from '@ryanatkn/gro/src_json.js';
import {init_sveltekit_config} from '@ryanatkn/gro/sveltekit_config.js';

import type {Gitops_Repo_Config} from '$lib/gitops_config.js';

export type Local_Repo = Resolved_Local_Repo | Unresolved_Local_Repo;

export interface Resolved_Local_Repo {
	type: 'resolved_local_repo';
	repo_name: string;
	repo_dir: string;
	repo_url: string;
	repo_git_ssh_url: string;
	repo_config: Gitops_Repo_Config;
	pkg: Package_Meta;
	// TODO what else? filesystem info?
}

export interface Unresolved_Local_Repo {
	type: 'unresolved_local_repo';
	repo_name: string;
	repo_url: string;
	repo_git_ssh_url: string;
	repo_config: Gitops_Repo_Config;
}

export const resolve_local_repo = async (
	repo_config: Gitops_Repo_Config,
	repos_dir: string,
): Promise<Local_Repo> => {
	const {repo_url} = repo_config;
	const repo_name = strip_end(repo_url, '/').split('/').at(-1);
	if (!repo_name) throw Error('Invalid `repo_config.repo_url` ' + repo_url);

	const repo_git_ssh_url = to_repo_git_ssh_url(repo_url);

	const repo_dir = repo_config.repo_dir ?? join(repos_dir, repo_name);
	if (!existsSync(repo_dir)) {
		return {type: 'unresolved_local_repo', repo_name, repo_url, repo_git_ssh_url, repo_config};
	}

	const parsed_sveltekit_config = await init_sveltekit_config(repo_dir);
	const lib_path = join(repo_dir, parsed_sveltekit_config.lib_path);

	const package_json = load_package_json(repo_dir);
	const src_json = create_src_json(package_json, lib_path);

	return {
		type: 'resolved_local_repo',
		repo_name,
		repo_dir,
		repo_url,
		repo_git_ssh_url,
		repo_config,
		pkg: parse_package_meta(package_json, src_json),
	};
};

const to_repo_git_ssh_url = (repo_url: string): string => {
	const url = new URL(repo_url);
	return `git@${url.hostname}:${url.pathname.substring(1)}`;
};
