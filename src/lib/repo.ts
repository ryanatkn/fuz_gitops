import {create_context} from '@ryanatkn/fuz/context_helpers.js';
import type {Package_Meta} from '@ryanatkn/gro/package_meta.js';

import {Github_Check_Runs_Item, type Github_Pull_Request} from '$lib/github.js';

export interface Repo extends Package_Meta {
	check_runs: Github_Check_Runs_Item | null;
	pull_requests: Github_Pull_Request[] | null;
}

export interface Repos {
	repo: Repo;
	repos: Repo[];
}

export const repos_context = create_context<Repos>();

export const parse_repos = (repos: Repo[], homepage_url: string): Repos => {
	// We expect to find this because it's sourced from the local package.json
	const repo = repos.find((d) => d.homepage_url === homepage_url);
	if (!repo) throw Error(`Cannot find repo with homepage_url: ${homepage_url}`);

	return {repo, repos};
};
