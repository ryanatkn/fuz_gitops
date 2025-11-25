import {create_context} from '@ryanatkn/fuz/context_helpers.js';
import {Pkg} from '@ryanatkn/fuz/pkg.svelte.js';
import type {PackageJson} from '@ryanatkn/belt/package_json.js';
import type {SrcJson} from '@ryanatkn/belt/src_json.js';

import {GithubCheckRunsItem, type GithubPullRequest} from './github.js';

/**
 * Serialized repo data as stored in repos.ts (JSON).
 */
export interface RepoJson {
	package_json: PackageJson;
	src_json: SrcJson;
	check_runs: GithubCheckRunsItem | null;
	pull_requests: Array<GithubPullRequest> | null;
}

/**
 * Runtime repo with Pkg instance.
 */
export class Repo {
	pkg: Pkg;
	check_runs: GithubCheckRunsItem | null;
	pull_requests: Array<GithubPullRequest> | null;

	constructor(repo_json: RepoJson) {
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
