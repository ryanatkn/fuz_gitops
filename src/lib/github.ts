import type {Logger} from '@ryanatkn/belt/log.js';
import type {Package_Meta} from '@ryanatkn/gro/package_meta.js';
import {z} from 'zod';
import {fetch_value, type Fetch_Value_Cache} from '@ryanatkn/belt/fetch.js';

/**
 * @see https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests
 */
export const Github_Pull_Request = z.object({
	number: z.number(),
	title: z.string(),
	user: z.object({
		login: z.string(),
	}),
	draft: z.boolean(),
});
export type Github_Pull_Request = z.infer<typeof Github_Pull_Request>;
export const Github_Pull_Requests = z.array(Github_Pull_Request);
export type Github_Pull_Requests = z.infer<typeof Github_Pull_Requests>;

/**
 * @see https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests
 */
export const fetch_github_pull_requests = async (
	pkg: Package_Meta,
	cache?: Fetch_Value_Cache,
	log?: Logger,
	token?: string,
	api_version?: string,
): Promise<Github_Pull_Requests | null> => {
	if (!pkg.owner_name) throw Error('owner_name is required');
	const headers = api_version ? new Headers({'x-github-api-version': api_version}) : undefined;
	const url = `https://api.github.com/repos/${pkg.owner_name}/${pkg.repo_name}/pulls`;
	const fetched = await fetch_value(url, {
		request: {headers},
		parse: Github_Pull_Requests.parse,
		token,
		cache,
		log,
	});
	if (!fetched.ok) {
		// TODO @many this is messy but I think it's the main case we need to worry about?
		if (fetched.status === 401) {
			throw Error(
				'401 response fetching github pull requests - check your SECRET_GITHUB_API_TOKEN',
			);
		}
		return null;
	}
	return fetched.value;
};

/**
 * @see https://docs.github.com/en/rest/checks/runs?apiVersion=2022-11-28#list-check-runs-for-a-git-reference
 */
export const Github_Check_Runs_Item = z.object({
	status: z.enum(['queued', 'in_progress', 'completed']),
	conclusion: z
		.enum(['success', 'failure', 'neutral', 'cancelled', 'skipped', 'timed_out', 'action_required'])
		.nullable(),
});
export type Github_Check_Runs_Item = z.infer<typeof Github_Check_Runs_Item>;
export const Github_Check_Runs = z.object({
	total_count: z.number(),
	check_runs: z.array(Github_Check_Runs_Item),
});
export type Github_Check_Runs = z.infer<typeof Github_Check_Runs>;

/**
 * @see https://docs.github.com/en/rest/checks/runs?apiVersion=2022-11-28#list-check-runs-for-a-git-reference
 */
export const fetch_github_check_runs = async (
	pkg: Package_Meta,
	cache?: Fetch_Value_Cache,
	log?: Logger,
	token?: string,
	api_version?: string,
	ref = 'main',
): Promise<Github_Check_Runs_Item | null> => {
	if (!pkg.owner_name) throw Error('owner_name is required');
	const headers = api_version ? new Headers({'x-github-api-version': api_version}) : undefined;
	const url = `https://api.github.com/repos/${pkg.owner_name}/${pkg.repo_name}/commits/${ref}/check-runs`;
	const fetched = await fetch_value(url, {
		request: {headers},
		parse: (v) => reduce_check_runs(Github_Check_Runs.parse(v).check_runs),
		token,
		cache,
		log,
	});
	if (!fetched.ok) {
		// TODO @many this is messy but I think it's the main case we need to worry about?
		if (fetched.status === 401) {
			throw Error('401 response fetching github CI status - check your SECRET_GITHUB_API_TOKEN');
		}
		return null;
	}
	return fetched.value;
};

const reduce_check_runs = (check_runs: Github_Check_Runs_Item[]): Github_Check_Runs_Item | null => {
	if (!check_runs.length) return null;
	// TODO fix these types and remove the eslint disable, `Github_Check_Runs_Item` should maybe have nullable properties?
	let status!: Github_Check_Runs_Item['status'];
	let conclusion!: Github_Check_Runs_Item['conclusion'];
	for (const check_run of check_runs) {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!status || status === 'completed') {
			status = check_run.status;
		}
		if (!conclusion || conclusion === 'success') {
			conclusion = check_run.conclusion;
		}
	}
	return {status, conclusion};
};
