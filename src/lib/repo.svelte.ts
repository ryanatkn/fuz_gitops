import {create_context} from '@ryanatkn/fuz/context_helpers.js';
import type {PackageJson} from '@ryanatkn/belt/package_json.js';
import {
	repo_name_parse,
	repo_url_parse,
	github_owner_parse,
	url_npm_package,
	package_is_published,
	url_package_logo,
	url_github_file,
	url_github_org,
} from '@ryanatkn/fuz/package_helpers.js';

import {GithubCheckRunsItem, type GithubPullRequest} from './github.js';

/**
 * Serialized repo data as stored in repos.ts (JSON).
 */
export interface RepoJson {
	package_json: PackageJson;
	check_runs: GithubCheckRunsItem | null;
	pull_requests: Array<GithubPullRequest> | null;
}

/**
 * Runtime repo with computed properties from package.json.
 *
 * Provides convenient accessors for package metadata without the module/identifier
 * features of Pkg (which are not needed for gitops).
 */
export class Repo {
	readonly package_json: PackageJson = $state.raw()!;
	check_runs: GithubCheckRunsItem | null;
	pull_requests: Array<GithubPullRequest> | null;

	/** Package name (e.g., '@ryanatkn/fuz'). */
	name = $derived(this.package_json.name);

	/** Repository name without scope (e.g., 'fuz'). */
	repo_name = $derived(repo_name_parse(this.package_json.name));

	/** GitHub repository URL (e.g., 'https://github.com/ryanatkn/fuz'). */
	repo_url = $derived(
		(() => {
			const url = repo_url_parse(this.package_json.repository);
			if (!url) {
				throw Error('failed to parse repo - `repo_url` is required in package_json');
			}
			return url;
		})(),
	);

	/** GitHub owner/org name (e.g., 'ryanatkn'). */
	owner_name = $derived(this.repo_url ? github_owner_parse(this.repo_url) : null);

	/** Homepage URL (e.g., 'https://www.fuz.dev/'). */
	homepage_url = $derived(this.package_json.homepage ?? null);

	/** Logo URL (falls back to favicon.png). */
	logo_url = $derived(url_package_logo(this.homepage_url, this.package_json.logo));

	/** Logo alt text. */
	logo_alt = $derived(this.package_json.logo_alt ?? `logo for ${this.repo_name}`);

	/** Whether package is published to npm. */
	published = $derived(package_is_published(this.package_json));

	/** npm package URL (if published). */
	npm_url = $derived(this.published ? url_npm_package(this.package_json.name) : null);

	/** Changelog URL (if published). */
	changelog_url = $derived(
		this.published && this.repo_url ? url_github_file(this.repo_url, 'CHANGELOG.md') : null,
	);

	/** Organization URL (e.g., 'https://github.com/ryanatkn'). */
	org_url = $derived(url_github_org(this.repo_url, this.repo_name));

	constructor(repo_json: RepoJson) {
		this.package_json = repo_json.package_json;
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
	const repo = repos.find((d) => d.homepage_url === homepage_url);
	if (!repo) throw Error(`Cannot find repo with homepage_url: ${homepage_url}`);

	return {repo, repos};
};
