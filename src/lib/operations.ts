/**
 * Operations interfaces for dependency injection.
 *
 * This is the core pattern enabling testability without mocks.
 * All side effects (git, npm, fs, process) are abstracted into interfaces.
 *
 * **Production usage:**
 * ```typescript
 * import {default_gitops_operations} from '$lib/default_operations.js';
 * await publish_repos(repos, options, default_gitops_operations);
 * ```
 *
 * **Test usage:**
 * ```typescript
 * import {mock_gitops_operations} from '$lib/fixtures/mock_operations.js';
 * const result = await publish_repos(repos, options, mock_gitops_operations);
 * // Assert on result without any real git/npm calls
 * ```
 *
 * See `default_operations.ts` for real implementations.
 * See test files (*.test.ts) for mock implementations.
 */

import type {Logger} from '@ryanatkn/belt/log.js';
import type {SpawnOptions} from 'node:child_process';
import type {Local_Repo} from '$lib/local_repo.js';
import type {Changeset_Info} from '$lib/changeset_reader.js';
import type {Bump_Type} from '$lib/semver.js';
import type {Pre_Flight_Options, Pre_Flight_Result} from '$lib/pre_flight_checks.js';

/**
 * Operations for working with changesets
 */
export interface Changeset_Operations {
	has_changesets: (repo: Local_Repo) => Promise<boolean>;
	read_changesets: (repo: Local_Repo, log?: Logger) => Promise<Array<Changeset_Info>>;
	predict_next_version: (
		repo: Local_Repo,
		log?: Logger,
	) => Promise<{version: string; bump_type: Bump_Type} | null>;
}

/**
 * Operations for git commands
 */
export interface Git_Operations {
	// Core git info
	current_branch_name: (cwd?: string) => Promise<string>;
	current_commit_hash: (branch?: string, cwd?: string) => Promise<string>;
	check_clean_workspace: (cwd?: string) => Promise<boolean>;

	// Branch operations
	checkout: (branch: string, cwd?: string) => Promise<void>;
	pull: (origin?: string, branch?: string, cwd?: string) => Promise<void>;
	switch_branch: (branch: string, pull?: boolean, cwd?: string) => Promise<void>;
	has_remote: (remote?: string, cwd?: string) => Promise<boolean>;

	// Staging and committing
	add: (files: string | Array<string>, cwd?: string) => Promise<void>;
	commit: (message: string, cwd?: string) => Promise<void>;
	add_and_commit: (files: string | Array<string>, message: string, cwd?: string) => Promise<void>;
	has_changes: (cwd?: string) => Promise<boolean>;
	get_changed_files: (cwd?: string) => Promise<Array<string>>;

	// Tagging
	tag: (tag_name: string, message?: string, cwd?: string) => Promise<void>;
	push_tag: (tag_name: string, origin?: string, cwd?: string) => Promise<void>;

	// Stashing
	stash: (message?: string, cwd?: string) => Promise<void>;
	stash_pop: (cwd?: string) => Promise<void>;

	// File change detection
	/**
	 * Checks if a specific file changed between two commits.
	 * @param from_commit - Starting commit hash
	 * @param to_commit - Ending commit hash
	 * @param file_path - Path to file to check (relative to repo root)
	 * @param cwd - Working directory (repo path)
	 * @returns true if file changed between commits, false otherwise
	 */
	has_file_changed: (
		from_commit: string,
		to_commit: string,
		file_path: string,
		cwd?: string,
	) => Promise<boolean>;
}

/**
 * Operations for spawning processes
 */
export interface Process_Operations {
	spawn: (
		cmd: string,
		args: Array<string>,
		options?: SpawnOptions,
	) => Promise<{ok: boolean; stdout?: string; stderr?: string}>;
}

/**
 * Operations for building packages
 */
export interface Build_Operations {
	build_package: (repo: Local_Repo, log?: Logger) => Promise<{ok: boolean; error?: string}>;
}

/**
 * Options for waiting for NPM packages
 */
export interface Wait_Options {
	max_attempts?: number;
	initial_delay?: number;
	max_delay?: number;
	timeout?: number;
}

/**
 * Operations for NPM registry
 */
export interface Npm_Operations {
	wait_for_package: (
		pkg: string,
		version: string,
		options?: Wait_Options,
		log?: Logger,
	) => Promise<void>;
	check_package_available: (pkg: string, version: string, log?: Logger) => Promise<boolean>;
	check_auth: () => Promise<{ok: boolean; username?: string; error?: string}>;
	check_registry: () => Promise<{ok: boolean; error?: string}>;
	install: (cwd?: string) => Promise<{ok: boolean; error?: string}>;
}

/**
 * Operations for pre-flight checks
 */
export interface Preflight_Operations {
	run_pre_flight_checks: (
		repos: Array<Local_Repo>,
		options: Pre_Flight_Options,
		git_ops?: Git_Operations,
		npm_ops?: Npm_Operations,
		build_ops?: Build_Operations,
		changeset_ops?: Changeset_Operations,
	) => Promise<Pre_Flight_Result>;
}

/**
 * Operations for file system access
 */
export interface Fs_Operations {
	readFile: (path: string, encoding: BufferEncoding) => Promise<string>;
	writeFile: (path: string, content: string) => Promise<void>;
}

/**
 * Combined operations for all gitops functionality
 */
export interface Gitops_Operations {
	changeset: Changeset_Operations;
	git: Git_Operations;
	process: Process_Operations;
	npm: Npm_Operations;
	preflight: Preflight_Operations;
	fs: Fs_Operations;
	build: Build_Operations;
}
