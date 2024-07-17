import type {Url} from '@ryanatkn/gro/package_json.js';
import {getContext, setContext} from 'svelte';
import {parse_package_meta, type Package_Meta} from '@ryanatkn/gro/package_meta.js';

import {Github_Check_Runs_Item, type Github_Pull_Request} from '$lib/github.js';

export type Repo = Fetched_Repo | Unfetched_Repo;

// TODO ideally all of the repos stuff would be in a different repo,
// but this usage of `Package_Meta` would cause a circular dependency between this repo and that one,
// so maybe `Package_Meta` belongs in Gro?
export interface Fetched_Repo extends Package_Meta {
	check_runs: Github_Check_Runs_Item | null;
	pull_requests: Github_Pull_Request[] | null;
}

export interface Unfetched_Repo {
	repo_url: Url;
	package_json: null;
	src_json: null;
	check_runs: null;
	pull_requests: null;
}

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

	for (const {repo_url, package_json, src_json, check_runs, pull_requests} of maybe_repos) {
		if (package_json) {
			repos.push({
				...parse_package_meta(package_json, src_json),
				check_runs,
				pull_requests,
			});
		} else {
			unfetched_repos.push({
				repo_url,
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
