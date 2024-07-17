import {strip_end} from '@ryanatkn/belt/string.js';
import {load_package_json} from '@ryanatkn/gro/package_json.js';
import type {Package_Meta} from '@ryanatkn/gro/package_meta.js';
import {existsSync} from 'node:fs';
import {join} from 'node:path';

import type {Gitops_Config, Fuz_Repo_Config} from '$lib/gitops_config.js';

export interface Resolved_Gitops_Config {
	local_repos: Local_Repo[] | null;
	resolved_local_repos: Resolved_Local_Repo[] | null;
	unresolved_local_repos: Unresolved_Local_Repo[] | null;
}

export type Local_Repo = Resolved_Local_Repo | Unresolved_Local_Repo;

export interface Resolved_Local_Repo {
	type: 'resolved_local_repo';
	repo_url: string;
	repo_config: Fuz_Repo_Config;
	pkg: Package_Meta;
	// TODO what else? filesystem info?
}

export interface Unresolved_Local_Repo {
	type: 'unresolved_local_repo';
	repo_url: string;
	repo_config: Fuz_Repo_Config;
}

// TODO BLOCK infer the dirs only or also add to the `Gitops_Config`?

/**
 * Resolves repo data locally on the filesystem.
 */
export const resolve_gitops_config = (fuz_config: Gitops_Config): Resolved_Gitops_Config => {
	const local_repos: Local_Repo[] = [];

	for (const repo_config of fuz_config.repos) {
		local_repos.push(resolve_local_repo(repo_config));
	}

	const resolved_local_repos = local_repos.filter((r) => r.type === 'resolved_local_repo');
	const unresolved_local_repos = local_repos.filter((r) => r.type === 'unresolved_local_repo');

	const config: Resolved_Gitops_Config = {
		local_repos: local_repos.length ? local_repos : null,
		resolved_local_repos: resolved_local_repos.length ? resolved_local_repos : null,
		unresolved_local_repos: unresolved_local_repos.length ? unresolved_local_repos : null,
	};
	return config;
};

// TODO BLOCK return value?
const resolve_local_repo = (repo_config: Fuz_Repo_Config): Local_Repo => {
	const {repo_url} = repo_config;
	console.log(`repo_config.repo_url`, repo_url);
	const repo_name = strip_end(repo_url, '/').split('/').at(-1);
	if (!repo_name) throw new Error('invalid `repo_config.repo_url` ' + repo_url);

	console.log(`repo_name`, repo_name);

	// TODO BLOCK use the dir?
	const repo_dir = repo_config.repo_dir ?? join(process.cwd(), '..', repo_name);
	console.log(`dir`, repo_dir);
	if (!existsSync(repo_dir)) {
		return {type: 'unresolved_local_repo', repo_url, repo_config};
	}

	const package_json = load_package_json(repo_dir);
	console.log(`package_json.homepage`, package_json.homepage);
	return;

	// Handle the local package data, if available
	// if (homepage_url === local_homepage_url) {
	// 	log?.info('resolving data locally for', homepage_url);
	// 	package_json = local_package_json;

	// 	src_json = create_src_json(local_package_json, log, dir ? join(dir, 'src/lib') : undefined);
	// } else {
	// 	// Fetch the remote package data
	// 	log?.info('fetching data for', homepage_url);

	// 	await wait(delay);
	// 	package_json = await fetch_package_json(homepage_url, cache, log);
	// 	if (!package_json) log?.error('failed to load package_json: ' + homepage_url);

	// 	await wait(delay);
	// 	src_json = await fetch_src_json(homepage_url, cache, log);
	// 	if (!src_json) log?.error('failed to load src_json: ' + homepage_url);
	// }

	// if (package_json && src_json) {
	// 	try {
	// 		pkg = parse_package_meta(package_json, src_json);
	// 	} catch (err) {
	// 		pkg = null;
	// 		log?.error('failed to parse package meta: ' + err);
	// 	}
	// } else {
	// 	pkg = null;
	// }
};
