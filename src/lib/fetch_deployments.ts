import {load_package_json, Package_Json} from '@ryanatkn/gro/package_json.js';
import type {Url} from '@ryanatkn/gro/paths.js';
import {ensure_end} from '@ryanatkn/belt/string.js';
import type {Logger} from '@ryanatkn/belt/log.js';
import {wait} from '@ryanatkn/belt/async.js';
import {parse_package_meta, type Package_Meta} from '@ryanatkn/fuz/package_meta.js';
import {create_src_json, Src_Json} from '@ryanatkn/gro/src_json.js';
import {join} from 'node:path';
import {fetch_value, type Fetch_Value_Cache} from '@ryanatkn/belt/fetch.js';

import {
	fetch_github_check_runs,
	fetch_github_pull_requests,
	Github_Check_Runs_Item,
	type Github_Pull_Request,
} from '$lib/github.js';

export type Deployment = Fetched_Deployment | Unfetched_Deployment;

export interface Fetched_Deployment extends Package_Meta {
	check_runs: Github_Check_Runs_Item | null;
	pull_requests: Github_Pull_Request[] | null;
}

export interface Unfetched_Deployment {
	url: Url;
	package_json: null;
	src_json: null;
	check_runs: null;
	pull_requests: null;
}

/* eslint-disable no-await-in-loop */

// TODO probably refactor to an object API
export const fetch_deployments = async (
	homepage_urls: Url[],
	token?: string,
	cache?: Fetch_Value_Cache,
	dir?: string,
	log?: Logger,
	delay = 50,
	github_api_version?: string,
	github_refs?: Record<string, string>, // if not 'main', mapping from the provided raw `homepage_url` to branch name
): Promise<Deployment[]> => {
	log?.info(`homepage_urls`, homepage_urls);

	// If one of the `homepage_urls` is the local package.json's `homepage` (local in `dir`),
	// use the local information as much as possible to ensure we're up to date.
	// If this isn't done, the local package's info will be pulled from the web,
	// making it perpetually behind by one deployment.
	const local_package_json = await load_package_json(dir);
	const local_homepage_url = local_package_json.homepage
		? ensure_end(local_package_json.homepage, '/')
		: undefined;

	const deployments: Deployment[] = [];
	for (const raw_homepage_url of homepage_urls) {
		const homepage_url = ensure_end(raw_homepage_url, '/');
		try {
			let package_json: Package_Json;
			let src_json: Src_Json;

			// Handle the local package data, if available
			if (homepage_url === local_homepage_url) {
				log?.info('resolving data locally for', homepage_url);
				package_json = local_package_json;
				src_json = await create_src_json(
					local_package_json,
					log,
					dir ? join(dir, 'src/lib') : undefined,
				);
			} else {
				log?.info('fetching data for', homepage_url);

				// `${base}/.well-known/package.json`
				const fetched_package_json = await fetch_package_json(homepage_url, cache, log);
				if (!fetched_package_json) throw Error('failed to load package_json: ' + homepage_url);
				package_json = fetched_package_json;
				await wait(delay);

				// `${base}/.well-known/src.json`
				const fetched_src_json = await fetch_src_json(homepage_url, cache, log);
				if (!fetched_src_json) throw Error('failed to load src_json: ' + homepage_url);
				src_json = fetched_src_json;
				await wait(delay);
			}

			const pkg = parse_package_meta(homepage_url, package_json, src_json);

			// CI status
			const check_runs = await fetch_github_check_runs(
				pkg,
				cache,
				log,
				token,
				github_api_version,
				github_refs?.[raw_homepage_url],
			);
			if (!check_runs) throw Error('failed to fetch CI status: ' + homepage_url);
			await wait(delay);

			// pull requests
			const pull_requests = await fetch_github_pull_requests(
				pkg,
				cache,
				log,
				token,
				github_api_version,
			);
			if (!pull_requests) throw Error('failed to fetch issues: ' + homepage_url);
			await wait(delay);

			deployments.push({...pkg, check_runs, pull_requests});
		} catch (err) {
			deployments.push({
				url: homepage_url,
				package_json: null,
				src_json: null,
				check_runs: null,
				pull_requests: null,
			});
			log?.error(err);
		}
	}
	return deployments;
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
