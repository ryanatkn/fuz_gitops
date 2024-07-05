import {ensure_end} from '@ryanatkn/belt/string.js';

import type {Github_Pull_Request} from '$lib/github.js';
import type {Fetched_Deployment, Deployment} from '$lib/fetch_deployments.js';

export type Filter_Pull_Request = (
	pull_request: Github_Pull_Request,
	deployment: Deployment,
) => boolean;

export interface Pull_Request_Meta {
	deployment: Fetched_Deployment;
	pull_request: Github_Pull_Request;
}

export const to_pull_requests = (
	deployments: Fetched_Deployment[],
	filter_pull_request?: Filter_Pull_Request,
): Pull_Request_Meta[] =>
	deployments
		.flatMap((deployment) => {
			if (!deployment.pull_requests) return null;
			// TODO hacky, figure out the data structure
			return deployment.pull_requests.map((pull_request) =>
				deployment.package_json.homepage &&
				(!filter_pull_request || filter_pull_request(pull_request, deployment))
					? {deployment, pull_request}
					: null,
			);
		})
		.filter((v) => v !== null);

export const to_pull_url = (repo_url: string, pull: Github_Pull_Request): string =>
	ensure_end(repo_url, '/') + 'pull/' + pull.number;
