import type {Src_Json} from '@ryanatkn/belt/src_json.js';
import type {Logger} from '@ryanatkn/belt/log.js';
import {vi} from 'vitest';

import type {Local_Repo} from '$lib/local_repo.js';
import type {
	Gitops_Operations,
	Changeset_Operations,
	Git_Operations,
	Fs_Operations,
	Npm_Operations,
	Build_Operations,
} from '$lib/operations.js';
import type {Bump_Type} from '$lib/semver.js';

/* eslint-disable @typescript-eslint/require-await,@typescript-eslint/no-empty-function */

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
 */
export const create_mock_repo = (options: Mock_Repo_Options): Local_Repo => {
	const {
		name,
		version = '1.0.0',
		deps = {},
		devDeps = {},
		peerDeps = {},
		isPrivate = false,
	} = options;
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
 * Creates mock Gitops_Operations with sensible defaults
 */
export const create_mock_gitops_ops = (
	overrides: Partial<{
		changeset: Partial<Gitops_Operations['changeset']>;
		git: Partial<Gitops_Operations['git']>;
		process: Partial<Gitops_Operations['process']>;
		npm: Partial<Gitops_Operations['npm']>;
		preflight: Partial<Gitops_Operations['preflight']>;
		fs: Partial<Gitops_Operations['fs']>;
		build: Partial<Gitops_Operations['build']>;
	}> = {},
): Gitops_Operations => ({
	changeset: {
		has_changesets: async () => true,
		read_changesets: async () => [],
		predict_next_version: async (repo) => ({
			version: incrementPatch(repo.pkg.package_json.version || '0.0.0'),
			bump_type: 'patch',
		}),
		...overrides.changeset,
	},
	git: create_mock_git_ops(overrides.git),
	process: {
		spawn: async () => ({ok: true}),
		...overrides.process,
	},
	npm: create_mock_npm_ops(overrides.npm),
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
	build: create_mock_build_ops(overrides.build),
});

/**
 * Helper to increment patch version
 */
const incrementPatch = (version: string): string => {
	const [major, minor, patch] = version.split('.').map(Number);
	return `${major}.${minor}.${patch + 1}`;
};

/**
 * Creates a map of package.json file paths to contents for testing
 */
export const create_mock_package_json_files = (
	repos: Array<Local_Repo>,
	updatedVersions: Map<string, string> = new Map(),
): Map<string, string> => {
	const fs: Map<string, string> = new Map();

	for (const repo of repos) {
		const version =
			updatedVersions.get(repo.pkg.name) ||
			incrementPatch(repo.pkg.package_json.version || '0.0.0');

		const packageJson = {
			...repo.pkg.package_json,
			version,
		};

		fs.set(`${repo.repo_dir}/package.json`, JSON.stringify(packageJson, null, 2));
	}

	return fs;
};

/**
 * Creates a mock repo with simulated changesets directory
 */
export const create_mock_repo_with_changesets = (
	options: Mock_Repo_Options & {changesets?: boolean},
): Local_Repo & {has_changesets: boolean} => {
	const repo = create_mock_repo(options);
	const has_changesets = options.changesets ?? true;

	return {
		...repo,
		has_changesets,
	};
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

/**
 * Creates mock Git_Operations for testing
 */
export const create_mock_git_ops = (overrides: Partial<Git_Operations> = {}): Git_Operations => ({
	current_branch_name: async () => 'main',
	current_commit_hash: async () => 'abc123',
	check_clean_workspace: async () => true,
	checkout: async () => {},
	pull: async () => {},
	switch_branch: async () => {},
	has_remote: async () => false,
	add: async () => {},
	commit: async () => {},
	add_and_commit: async () => {},
	has_changes: async () => false,
	get_changed_files: async () => [],
	tag: async () => {},
	push_tag: async () => {},
	stash: async () => {},
	stash_pop: async () => {},
	has_file_changed: async () => false,
	...overrides,
});

/**
 * Creates mock Npm_Operations for testing
 */
export const create_mock_npm_ops = (overrides: Partial<Npm_Operations> = {}): Npm_Operations => ({
	wait_for_package: async () => {},
	check_package_available: async () => true,
	check_auth: async () => ({ok: true, username: 'testuser'}),
	check_registry: async () => ({ok: true}),
	install: async () => ({ok: true}),
	...overrides,
});

/**
 * Creates mock Build_Operations for testing
 */
export const create_mock_build_ops = (
	overrides: Partial<Build_Operations> = {},
): Build_Operations => ({
	build_package: async () => ({ok: true}),
	...overrides,
});

/**
 * Creates a successful pre-flight mock with specified repos
 */
export const create_preflight_mock = (
	repos_with_changesets: Array<string> = [],
	repos_without_changesets: Array<string> = [],
): {
	run_pre_flight_checks: () => Promise<{
		ok: boolean;
		warnings: Array<string>;
		errors: Array<string>;
		repos_with_changesets: Set<string>;
		repos_without_changesets: Set<string>;
	}>;
} => ({
	run_pre_flight_checks: async () => ({
		ok: true,
		warnings: [],
		errors: [],
		repos_with_changesets: new Set(repos_with_changesets),
		repos_without_changesets: new Set(repos_without_changesets),
	}),
});

/**
 * Creates mock Fs_Operations for testing with in-memory storage
 */
export const create_mock_fs_ops = (): Fs_Operations & {
	get: (path: string) => string | undefined;
	set: (path: string, content: string) => void;
} => {
	const files: Map<string, string> = new Map();

	return {
		readFile: async (path: string, _encoding: BufferEncoding): Promise<string> => {
			const content = files.get(path);
			if (content === undefined) {
				throw new Error(`File not found: ${path}`);
			}
			return content;
		},
		writeFile: async (path: string, content: string): Promise<void> => {
			files.set(path, content);
		},
		get: (path: string): string | undefined => files.get(path),
		set: (path: string, content: string): void => {
			files.set(path, content);
		},
	};
};

/**
 * Creates and populates fs ops from package.json files
 */
export const create_populated_fs_ops = (
	repos: Array<Local_Repo>,
	updated_versions?: Map<string, string>,
): Fs_Operations & {
	get: (path: string) => string | undefined;
	set: (path: string, content: string) => void;
} => {
	const fs_ops = create_mock_fs_ops();
	const package_files = create_mock_package_json_files(repos, updated_versions);
	for (const [path, content] of package_files) {
		fs_ops.set(path, content);
	}
	return fs_ops;
};

/**
 * Tracked command for process operations
 */
export interface Tracked_Command {
	cmd: string;
	args: Array<string>;
	cwd: string;
}

/**
 * Creates process operations that track which commands were spawned
 */
export const create_tracking_process_ops = (): {
	ops: {
		spawn: (
			cmd: string,
			args: Array<string>,
			options?: {cwd?: string | URL},
		) => Promise<{ok: boolean; stdout?: string; stderr?: string}>;
	};
	get_spawned_commands: () => Array<Tracked_Command>;
	get_commands_by_type: (cmd_name: string) => Array<Tracked_Command>;
	get_package_names_from_cwd: (commands: Array<Tracked_Command>) => Array<string>;
} => {
	const spawned_commands: Array<Tracked_Command> = [];

	return {
		ops: {
			spawn: async (
				cmd: string,
				args: Array<string>,
				options?: {cwd?: string | URL},
			): Promise<{ok: boolean; stdout?: string; stderr?: string}> => {
				spawned_commands.push({
					cmd,
					args,
					cwd: typeof options?.cwd === 'string' ? options.cwd : '',
				});
				return {ok: true};
			},
		},
		get_spawned_commands: () => spawned_commands,
		get_commands_by_type: (cmd_name: string) =>
			spawned_commands.filter((c) => c.cmd === 'gro' && c.args[0] === cmd_name),
		get_package_names_from_cwd: (commands: Array<Tracked_Command>) =>
			commands.map((c) => c.cwd.split('/').pop() || ''),
	};
};

/**
 * Helper to create mock logger that tracks calls
 */
export const create_mock_logger = (): Logger & {
	debug_calls: Array<string>;
	info_calls: Array<string>;
	warn_calls: Array<string>;
} => {
	const debug_calls: Array<string> = [];
	const info_calls: Array<string> = [];
	const warn_calls: Array<string> = [];

	return {
		debug: vi.fn((msg: string) => debug_calls.push(msg)),
		info: vi.fn((msg: string) => info_calls.push(msg)),
		warn: vi.fn((msg: string) => warn_calls.push(msg)),
		error: vi.fn(),
		debug_calls,
		info_calls,
		warn_calls,
	} as unknown as Logger & {
		debug_calls: Array<string>;
		info_calls: Array<string>;
		warn_calls: Array<string>;
	};
};
