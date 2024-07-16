import {getContext, setContext} from 'svelte';
import {parse_package_meta} from '@ryanatkn/gro/package_meta.js';

import type {Fetched_Repo, Repo, Unfetched_Repo} from '$lib/fetch_repos.js';

export interface Repos {
	repo: Fetched_Repo;
	repos: Fetched_Repo[];
	unfetched_repos: Unfetched_Repo[];
}

const KEY = Symbol('Repos');

export const set_repos = (repos: Repos): Repos => setContext(KEY, repos);

export const get_repos = (): Repos => getContext(KEY);

// TODO the types here are hacky, needs rethinking
export const parse_repos = (maybe_repos: Repo[], homepage_url: string): Repos => {
	const repos: Fetched_Repo[] = [];
	const unfetched_repos: Unfetched_Repo[] = [];

	for (const {url, package_json, src_json, check_runs, pull_requests} of maybe_repos) {
		if (package_json) {
			repos.push({
				...parse_package_meta(url, package_json, src_json),
				check_runs,
				pull_requests,
			});
		} else {
			unfetched_repos.push({
				url,
				package_json: null,
				src_json: null,
				check_runs: null,
				pull_requests: null,
			});
		}
	}

	// We expect to find this because it's sourced from the local package.json
	const repo = repos.find((d) => d.homepage_url === homepage_url);
	if (!repo) throw Error(`Cannot find repo with homepage_url: ${homepage_url}`);

	return {repo, repos, unfetched_repos};
};
