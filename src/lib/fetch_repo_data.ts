import type {Logger} from '@ryanatkn/belt/log.js';
import {wait} from '@ryanatkn/belt/async.js';
import type {FetchValueCache} from '@ryanatkn/belt/fetch.js';

import {fetch_github_check_runs, fetch_github_pull_requests} from './github.js';
import type {RepoJson} from './repo.svelte.js';
import type {LocalRepo} from './local_repo.js';

/* eslint-disable no-await-in-loop */

/**
 * Fetches GitHub metadata (CI status, PRs) for all repos.
 *
 * Fetches sequentially with delay between requests to respect GitHub API rate limits.
 * Uses `await_in_loop` intentionally to avoid parallel requests overwhelming the API.
 *
 * Error handling: Logs fetch failures but continues processing remaining repos.
 * Repos with failed fetches will have `null` for check_runs or pull_requests.
 *
 * @param delay milliseconds between API requests (default: 33ms)
 * @param cache optional cache from belt's fetch.js for response memoization
 * @returns array of Repo objects with GitHub metadata attached
 */
export const fetch_repo_data = async (
	resolved_repos: Array<LocalRepo>,
	token?: string,
	cache?: FetchValueCache,
	log?: Logger,
	delay = 33,
	github_api_version?: string,
): Promise<Array<RepoJson>> => {
	const repos: Array<RepoJson> = [];
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
			package_json: pkg.package_json,
			src_json: pkg.src_json,
			check_runs,
			pull_requests,
		});
	}
	return repos;
};
