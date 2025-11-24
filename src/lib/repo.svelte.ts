import {create_context} from '@ryanatkn/fuz/context_helpers.js';
import {Pkg} from '@ryanatkn/fuz/pkg.svelte.js';
import type {Package_Json} from '@ryanatkn/belt/package_json.js';
import type {Src_Json} from '@ryanatkn/belt/src_json.js';

import {Github_Check_Runs_Item, type Github_Pull_Request} from './github.js';

/**
 * Serialized repo data as stored in repos.ts (JSON).
 */
export interface Repo_Json {
	package_json: Package_Json;
	src_json: Src_Json;
	check_runs: Github_Check_Runs_Item | null;
	pull_requests: Array<Github_Pull_Request> | null;
}

/**
 * Runtime repo with Pkg instance.
 */
export class Repo {
	pkg: Pkg;
	check_runs: Github_Check_Runs_Item | null;
	pull_requests: Array<Github_Pull_Request> | null;

	constructor(repo_json: Repo_Json) {
		this.pkg = new Pkg(repo_json.package_json, repo_json.src_json);
		this.check_runs = repo_json.check_runs;
		this.pull_requests = repo_json.pull_requests;
	}
}

export interface Repos {
	repo: Repo;
	repos: Array<Repo>;
}

export const repos_context = create_context<Repos>();

export const repos_parse = (repos: Array<Repo>, homepage_url: string): Repos => {
	// We expect to find this because it's sourced from the local package.json
	const repo = repos.find((d) => d.pkg.homepage_url === homepage_url);
	if (!repo) throw Error(`Cannot find repo with homepage_url: ${homepage_url}`);

	return {repo, repos};
};
