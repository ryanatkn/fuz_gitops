import type {Logger} from '@ryanatkn/belt/log.js';
import {wait} from '@ryanatkn/belt/async.js';
import type {Fetch_Value_Cache} from '@ryanatkn/belt/fetch.js';

import {fetch_github_check_runs, fetch_github_pull_requests} from '$lib/github.js';
import type {Repo} from '$lib/repo.js';
import type {Local_Repo} from '$lib/local_repo.js';

/* eslint-disable no-await-in-loop */

export const fetch_repo_data = async (
	resolved_repos: Array<Local_Repo>,
	token?: string,
	cache?: Fetch_Value_Cache,
	log?: Logger,
	delay = 33,
	github_api_version?: string,
): Promise<Array<Repo>> => {
	const repos: Array<Repo> = [];
	for (const {repo_url, repo_config, pkg} of resolved_repos) {
		// CI status
		await wait(delay);
		const check_runs = await fetch_github_check_runs(
			pkg,
			cache,
			log,
			token,
			github_api_version,
			repo_config.branch,
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
