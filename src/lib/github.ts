import type {Logger} from '@grogarden/util/log.js';
import type {PackageMeta} from '@fuz.dev/fuz_library/package_meta.js';
import {request} from '@octokit/request';
import {z} from 'zod';

import {
	to_fetch_cache_key,
	type Fetch_Cache_Data,
	type Fetch_Cache_Item,
} from '$lib/fetch_cache.js';

export const Github_Pull_Request = z.object({
	url: z.string(),
	id: z.number(),
	number: z.number(),
	state: z.enum(['open', 'closed', 'all']),
	title: z.string(),
	user: z.object({
		login: z.string(),
		id: z.number(),
		avatar_url: z.string(),
		url: z.string(),
	}),
	body: z.string().nullable(),
	created_at: z.string(),
	updated_at: z.string(),
	draft: z.boolean(),
});
export type Github_Pull_Request = z.infer<typeof Github_Pull_Request>;

// TODO refactor with `fetch_package_json`
export const fetch_github_pull_requests = async (
	url: string,
	pkg: PackageMeta,
	cache?: Fetch_Cache_Data,
	log?: Logger,
	token?: string,
): Promise<Fetch_Cache_Item<Github_Pull_Request[] | null>> => {
	log?.info('url', url);
	if (!pkg.owner_name) throw Error('owner_name is required');
	const params = {owner: pkg.owner_name, repo: pkg.repo_name, sort: 'updated'} as const;
	const headers: Record<string, string> = {};
	if (token) headers.authorization = 'token ' + token;
	const route = 'GET /repos/{owner}/{repo}/pulls'; // TODO param
	const key = to_fetch_cache_key(route, params);
	const cached = cache?.get(key);
	const etag = cached?.etag;
	if (etag) {
		headers['if-none-match'] = etag;
	}
	try {
		const res = await request(route, {
			headers,
			...params,
		});
		log?.info('not cached', key);
		log?.info('res.headers', res.headers);
		const result: Fetch_Cache_Item<Github_Pull_Request[] | null> = {
			url,
			params,
			key,
			etag: res.headers.etag ?? null,
			data: res.data.map((i) => Github_Pull_Request.parse(i)),
		};
		cache?.set(result.key, result);
		return result;
	} catch (err) {
		// TODO better error handling?
		if (err.status === 304) {
			log?.info('cached', key);
			return cached!;
		}
		const result: Fetch_Cache_Item<Github_Pull_Request[] | null> = {
			url,
			params,
			key,
			etag: null,
			data: null,
		};
		return result;
	}
};
