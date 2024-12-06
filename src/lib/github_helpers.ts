import {ensure_end} from '@ryanatkn/belt/string.js';

import type {Github_Pull_Request} from '$lib/github.js';
import type {Repo} from '$lib/repo.js';

export type Filter_Pull_Request = (pull_request: Github_Pull_Request, repo: Repo) => boolean;

export interface Pull_Request_Meta {
	repo: Repo;
	pull_request: Github_Pull_Request;
}

export const to_pull_requests = (
	repos: Array<Repo>,
	filter_pull_request?: Filter_Pull_Request,
): Array<Pull_Request_Meta> =>
	repos
		.flatMap((repo) => {
			if (!repo.pull_requests) return null;
			// TODO hacky, figure out the data structure
			return repo.pull_requests.map((pull_request) =>
				repo.package_json.homepage &&
				(!filter_pull_request || filter_pull_request(pull_request, repo))
					? {repo, pull_request}
					: null,
			);
		})
		.filter((v) => v !== null);

export const to_pull_url = (repo_url: string, pull: Github_Pull_Request): string =>
	ensure_end(repo_url, '/') + 'pull/' + pull.number;
