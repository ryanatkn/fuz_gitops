import {load_package_json, Package_Json} from '@ryanatkn/gro/package_json.js';
import {ensure_end} from '@ryanatkn/belt/string.js';
import type {Logger} from '@ryanatkn/belt/log.js';
import {wait} from '@ryanatkn/belt/async.js';
import type {Package_Meta} from '@ryanatkn/gro/package_meta.js';
import {Src_Json} from '@ryanatkn/gro/src_json.js';
import {fetch_value, type Fetch_Value_Cache} from '@ryanatkn/belt/fetch.js';

import {
	fetch_github_check_runs,
	fetch_github_pull_requests,
	Github_Check_Runs_Item,
	Github_Pull_Requests,
} from '$lib/github.js';
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
	dir?: string,
	log?: Logger,
	delay = 50,
	github_api_version?: string,
	github_refs?: Record<string, string>, // if not 'main', mapping from the provided raw `homepage_url` to branch name
): Promise<Repo[]> => {
	// If one of the `homepage_urls` is the local package.json's `homepage` (local in `dir`),
	// use the local information as much as possible to ensure we're up to date.
	// If this isn't done, the local package's info will be pulled from the web,
	// making it perpetually behind by one repo.
	const local_package_json = load_package_json(dir);
	const local_homepage_url = local_package_json.homepage
		? ensure_end(local_package_json.homepage, '/')
		: undefined;

	const repos: Repo[] = [];
	for (const resolved_repo of resolved_repos) {
		const raw_homepage_url = resolved_repo?.homepage_url;
		const homepage_url = ensure_end(raw_homepage_url, '/');

		let check_runs: Github_Check_Runs_Item | null;
		let pull_requests: Github_Pull_Requests | null;

		if (resolved_repo) {
			// CI status
			await wait(delay);
			check_runs = await fetch_github_check_runs(
				resolved_repo,
				cache,
				log,
				token,
				github_api_version,
				github_refs?.[raw_homepage_url],
			);
			if (!check_runs) log?.error('failed to fetch CI status: ' + homepage_url);

			// pull requests
			await wait(delay);
			pull_requests = await fetch_github_pull_requests(
				resolved_repo,
				cache,
				log,
				token,
				github_api_version,
			);
			if (!pull_requests) log?.error('failed to fetch issues: ' + homepage_url);
		} else {
			check_runs = null;
			pull_requests = null;
		}

		if (resolved_repo) {
			repos.push({...resolved_repo, check_runs, pull_requests});
		} else {
			repos.push({
				homepage_url,
				package_json: null,
				src_json: null,
				check_runs: null,
				pull_requests: null,
			});
		}
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
