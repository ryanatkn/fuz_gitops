import {Package_Json} from '@ryanatkn/gro/package_json.js';
import {ensure_end} from '@ryanatkn/belt/string.js';
import type {Logger} from '@ryanatkn/belt/log.js';
import {wait} from '@ryanatkn/belt/async.js';
import {Src_Json} from '@ryanatkn/gro/src_json.js';
import {fetch_value, type Fetch_Value_Cache} from '@ryanatkn/belt/fetch.js';

import {fetch_github_check_runs, fetch_github_pull_requests} from '$lib/github.js';
import type {Repo} from '$lib/repo.js';
import type {Resolved_Local_Repo} from '$lib/resolve_gitops_config.js';

/* eslint-disable no-await-in-loop */

/**
 * Fetches repo data from the web.
 */
export const fetch_repos = async (
	resolved_repos: Resolved_Local_Repo[],
	token?: string,
	cache?: Fetch_Value_Cache,
	log?: Logger,
	delay = 33,
	github_api_version?: string,
): Promise<Repo[]> => {
	const repos: Repo[] = [];
	for (const {repo_url, repo_config, pkg} of resolved_repos) {
		// CI status
		await wait(delay);
		const check_runs = await fetch_github_check_runs(
			pkg,
			cache,
			log,
			token,
			github_api_version,
			repo_config.github_ref,
		);
		if (!check_runs) log?.error('failed to fetch CI status: ' + repo_url);

		// pull requests
		await wait(delay);
		const pull_requests = await fetch_github_pull_requests(
			pkg,
			cache,
			log,
			token,
			github_api_version,
		);
		if (!pull_requests) log?.error('failed to fetch issues: ' + repo_url);

		repos.push({
			...pkg,
			check_runs,
			pull_requests,
		});
	}
	return repos;
};

export const fetch_package_json = async (
	homepage_url: string,
	cache?: Fetch_Value_Cache,
	log?: Logger,
): Promise<Package_Json | null> => {
	const url = ensure_end(homepage_url, '/') + '.well-known/package.json';
	const fetched = await fetch_value(url, {parse: Package_Json.parse, cache, log});
	if (!fetched.ok) return null;
	return fetched.value;
};

export const fetch_src_json = async (
	homepage_url: string,
	cache?: Fetch_Value_Cache,
	log?: Logger,
): Promise<Src_Json | null> => {
	const url = ensure_end(homepage_url, '/') + '.well-known/src.json';
	const fetched = await fetch_value(url, {parse: Src_Json.parse, cache, log});
	if (!fetched.ok) return null;
	return fetched.value;
};
