/**
 * Test helpers for creating mock operations and test data
 */

import type {Src_Json} from '@ryanatkn/belt/src_json.js';
import type {Local_Repo} from './local_repo.js';
import type {Publishing_Operations, Changeset_Operations} from './operations.js';
import type {Bump_Type} from './semver.js';

export interface Mock_Repo_Options {
	name: string;
	version?: string;
	deps?: Record<string, string>;
	devDeps?: Record<string, string>;
	peerDeps?: Record<string, string>;
	isPrivate?: boolean;
}

/**
 * Creates a mock Local_Repo for testing
 * Supports both object and legacy positional arguments for backwards compatibility
 */
export function create_mock_repo(options: Mock_Repo_Options): Local_Repo;
export function create_mock_repo(
	name: string,
	version?: string,
	deps?: Record<string, string>,
	devDeps?: Record<string, string>,
	peerDeps?: Record<string, string>,
	isPrivate?: boolean,
): Local_Repo;
export function create_mock_repo(
	nameOrOptions: string | Mock_Repo_Options,
	version = '1.0.0',
	deps: Record<string, string> = {},
	devDeps: Record<string, string> = {},
	peerDeps: Record<string, string> = {},
	isPrivate = false,
): Local_Repo {
	// Handle object parameter
	if (typeof nameOrOptions === 'object') {
		const options = nameOrOptions;
		return create_mock_repo_impl(
			options.name,
			options.version ?? '1.0.0',
			options.deps ?? {},
			options.devDeps ?? {},
			options.peerDeps ?? {},
			options.isPrivate ?? false,
		);
	}

	// Handle legacy positional parameters
	return create_mock_repo_impl(nameOrOptions, version, deps, devDeps, peerDeps, isPrivate);
}

const create_mock_repo_impl = (
	name: string,
	version: string,
	deps: Record<string, string>,
	devDeps: Record<string, string>,
	peerDeps: Record<string, string>,
	isPrivate: boolean,
): Local_Repo => {

	return {
		type: 'resolved_local_repo' as const,
		repo_name: name,
		repo_dir: `/test/${name}`,
		repo_url: `https://github.com/test/${name}`,
		repo_git_ssh_url: `git@github.com:test/${name}.git`,
		repo_config: {
			repo_url: `https://github.com/test/${name}`,
			repo_dir: null,
			branch: 'main',
		},
		pkg: {
			name,
			repo_name: name,
			repo_url: `https://github.com/test/${name}`,
			homepage_url: `https://test.com/${name}`,
			owner_name: 'test',
			logo_url: null,
			logo_alt: `logo for ${name}`,
			npm_url: null,
			changelog_url: null,
			published: false,
			src_json: {} as Src_Json,
			package_json: {
				name,
				version,
				dependencies: deps,
				devDependencies: devDeps,
				peerDependencies: peerDeps,
				private: isPrivate,
			},
		},
		dependencies: new Map(Object.entries(deps)),
		dev_dependencies: new Map(Object.entries(devDeps)),
		peer_dependencies: new Map(Object.entries(peerDeps)),
	};
};

/**
 * Creates mock Publishing_Operations with sensible defaults
 */
export const create_mock_publishing_ops = (
	overrides: Partial<{
		changeset: Partial<Publishing_Operations['changeset']>;
		git: Partial<Publishing_Operations['git']>;
		process: Partial<Publishing_Operations['process']>;
		npm: Partial<Publishing_Operations['npm']>;
		preflight: Partial<Publishing_Operations['preflight']>;
		fs: Partial<Publishing_Operations['fs']>;
	}> = {},
): Publishing_Operations => ({
	changeset: {
		has_changesets: async () => true,
		read_changesets: async () => [],
		predict_next_version: async (repo) => ({
			version: incrementPatch(repo.pkg.package_json.version || '0.0.0'),
			bump_type: 'patch',
		}),
		...overrides.changeset,
	},
	git: {
		current_branch_name: async () => 'main',
		current_commit_hash: async () => 'abc123',
		check_clean_workspace: async () => true,
		checkout: async () => {},
		pull: async () => {},
		switch_branch: async () => {},
		add: async () => {},
		commit: async () => {},
		add_and_commit: async () => {},
		has_changes: async () => false,
		get_changed_files: async () => [],
		tag: async () => {},
		push_tag: async () => {},
		stash: async () => {},
		stash_pop: async () => {},
		...overrides.git,
	},
	process: {
		spawn: async () => ({ok: true}),
		...overrides.process,
	},
	npm: {
		wait_for_package: async () => {},
		check_package_available: async () => true,
		...overrides.npm,
	},
	preflight: {
		run_pre_flight_checks: async () => ({
			ok: true,
			warnings: [],
			errors: [],
			repos_with_changesets: new Set(),
			repos_without_changesets: new Set(),
		}),
		...overrides.preflight,
	},
	fs: {
		readFile: async () => '{}',
		writeFile: async () => {},
		...overrides.fs,
	},
});

/**
 * Helper to increment patch version
 */
const incrementPatch = (version: string): string => {
	const [major, minor, patch] = version.split('.').map(Number);
	return `${major}.${minor}.${patch + 1}`;
};

/**
 * Creates a mock file system with package.json files
 */
export const create_mock_fs = (
	repos: Array<Local_Repo>,
	updatedVersions: Map<string, string> = new Map(),
): Map<string, string> => {
	const fs = new Map<string, string>();

	for (const repo of repos) {
		const version = updatedVersions.get(repo.pkg.name) ||
			incrementPatch(repo.pkg.package_json.version || '0.0.0');

		const packageJson = {
			...repo.pkg.package_json,
			version,
		};

		fs.set(
			`${repo.repo_dir}/package.json`,
			JSON.stringify(packageJson, null, 2),
		);
	}

	return fs;
};

/**
 * Creates mock Changeset_Operations with custom version predictions
 */
export const create_mock_changeset_ops = (
	versionPredictions: Map<string, {version: string; bump_type: Bump_Type}>,
	reposWithChangesets: Set<string> = new Set(),
): Changeset_Operations => ({
	has_changesets: async (repo) => reposWithChangesets.has(repo.pkg.name),
	read_changesets: async () => [],
	predict_next_version: async (repo) => {
		return versionPredictions.get(repo.pkg.name) || null;
	},
});