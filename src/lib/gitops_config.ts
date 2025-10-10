import type {Url} from '@ryanatkn/belt/url.js';
import {existsSync} from 'node:fs';
import {strip_end} from '@ryanatkn/belt/string.js';
import type {Git_Branch} from '@ryanatkn/belt/git.js';

export interface Gitops_Config {
	repos: Array<Gitops_Repo_Config>;
}

export type Create_Gitops_Config = (
	base_config: Gitops_Config,
) => Raw_Gitops_Config | Promise<Raw_Gitops_Config>;

export interface Raw_Gitops_Config {
	repos?: Array<Url | Raw_Gitops_Repo_Config>;
}

export interface Gitops_Repo_Config {
	/**
	 * The HTTPS URL to the repo. Does not include a `.git` suffix.
	 * @example 'https://github.com/ryanatkn/fuz'
	 */
	repo_url: Url;

	/**
	 * Relative or absolute path to the repo's local directory.
	 * If `null`, the directory is inferred from the URL and cwd.
	 * @example 'relative/path/to/repo'
	 * @example '/absolute/path/to/repo'
	 */
	repo_dir: string | null;

	/**
	 * The branch name to use when fetching the repo. Defaults to `main`.
	 */
	branch: Git_Branch;
}

export interface Raw_Gitops_Repo_Config {
	repo_url: Url;
	repo_dir?: string | null;
	branch?: Git_Branch;
}

export const create_empty_gitops_config = (): Gitops_Config => ({
	repos: [],
});

/**
 * Transforms a `Raw_Gitops_Config` to the more strict `Gitops_Config`.
 * This allows users to provide a more relaxed config.
 */
export const normalize_gitops_config = (raw_config: Raw_Gitops_Config): Gitops_Config => {
	const empty_config = create_empty_gitops_config();
	// All of the raw config properties are optional,
	// so fall back to the empty values when `undefined`.
	const {repos} = raw_config;
	return {
		repos: repos ? repos.map((r) => parse_fuz_repo_config(r)) : empty_config.repos,
	};
};

const parse_fuz_repo_config = (r: Url | Raw_Gitops_Repo_Config): Gitops_Repo_Config => {
	if (typeof r === 'string') {
		return {repo_url: r, repo_dir: null, branch: 'main' as Git_Branch}; // TODO @zts use flavored for Git_Branch
	}
	return {
		repo_url: strip_end(r.repo_url, '.git'),
		repo_dir: r.repo_dir ?? null,
		branch: r.branch ?? ('main' as Git_Branch), // TODO @zts use flavored for Git_Branch
	};
};

export interface Gitops_Config_Module {
	readonly default: Raw_Gitops_Config | Create_Gitops_Config;
}

export const load_gitops_config = async (config_path: string): Promise<Gitops_Config | null> => {
	if (!existsSync(config_path)) {
		// No user config file found.
		return null;
	}
	// Import the user's `gitops.config.ts`.
	const config_module = await import(config_path);
	validate_gitops_config_module(config_module, config_path);
	return normalize_gitops_config(
		typeof config_module.default === 'function'
			? await config_module.default(create_empty_gitops_config())
			: config_module.default,
	);
};

export const validate_gitops_config_module: (
	config_module: any,
	config_path: string,
) => asserts config_module is Gitops_Config_Module = (config_module, config_path) => {
	const config = config_module.default;
	if (!config) {
		throw Error(`Invalid Fuz config module at ${config_path}: expected a default export`);
	} else if (!(typeof config === 'function' || typeof config === 'object')) {
		throw Error(
			`Invalid Fuz config module at ${config_path}: the default export must be a function or object`,
		);
	}
};
