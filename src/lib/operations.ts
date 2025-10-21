/**
 * Operations interfaces for dependency injection.
 *
 * This is the core pattern enabling testability without mocks.
 * All side effects (git, npm, fs, process) are abstracted into interfaces.
 *
 * **Design principles:**
 * - All operations accept a single `options` object parameter
 * - All fallible operations return `Result` from `@ryanatkn/belt`
 * - Never throw `Error` in operations - return `Result` with `ok: false`
 * - Use `null` for expected "not found" cases (not errors)
 * - Include `log?: Logger` in options where logging is useful
 *
 * **Production usage:**
 * ```typescript
 * import {default_gitops_operations} from '$lib/operations_defaults.js';
 * const result = await ops.git.current_branch_name({cwd: '/path'});
 * if (!result.ok) {
 *   throw new Task_Error(result.message);
 * }
 * const branch = result.value;
 * ```
 *
 * **Test usage:**
 * ```typescript
 * const mock_ops = create_mock_operations();
 * const result = await publish_repos(repos, options, mock_ops);
 * // Assert on result without any real git/npm calls
 * ```
 *
 * See `operations_defaults.ts` for real implementations.
 * See test files (*.test.ts) for mock implementations.
 */

import type {Result} from '@ryanatkn/belt/result.js';
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
	/**
	 * Checks if a repo has any changeset files.
	 * Returns true if changesets exist, false if none found.
	 */
	has_changesets: (options: {
		repo: Local_Repo;
	}) => Promise<Result<{value: boolean}, {message: string}>>;

	/**
	 * Reads all changeset files from a repo.
	 * Returns array of changeset info, or error if reading fails.
	 */
	read_changesets: (options: {
		repo: Local_Repo;
		log?: Logger;
	}) => Promise<Result<{value: Array<Changeset_Info>}, {message: string}>>;

	/**
	 * Predicts the next version based on changesets.
	 * Returns null if no changesets found (expected, not an error).
	 * Returns error Result if changesets exist but can't be read/parsed.
	 */
	predict_next_version: (options: {
		repo: Local_Repo;
		log?: Logger;
	}) => Promise<Result<{version: string; bump_type: Bump_Type}, {message: string}> | null>;
}

/**
 * Operations for git commands
 */
export interface Git_Operations {
	/**
	 * Gets the current branch name.
	 */
	current_branch_name: (options?: {
		cwd?: string;
	}) => Promise<Result<{value: string}, {message: string}>>;

	/**
	 * Gets the current commit hash.
	 */
	current_commit_hash: (options?: {
		branch?: string;
		cwd?: string;
	}) => Promise<Result<{value: string}, {message: string}>>;

	/**
	 * Checks if the workspace is clean (no uncommitted changes).
	 */
	check_clean_workspace: (options?: {
		cwd?: string;
	}) => Promise<Result<{value: boolean}, {message: string}>>;

	/**
	 * Checks out a branch.
	 */
	checkout: (options: {branch: string; cwd?: string}) => Promise<Result<object, {message: string}>>;

	/**
	 * Pulls changes from remote.
	 */
	pull: (options?: {
		origin?: string;
		branch?: string;
		cwd?: string;
	}) => Promise<Result<object, {message: string}>>;

	/**
	 * Switches to a branch, optionally pulling.
	 */
	switch_branch: (options: {
		branch: string;
		pull?: boolean;
		cwd?: string;
	}) => Promise<Result<object, {message: string}>>;

	/**
	 * Checks if a remote exists.
	 */
	has_remote: (options?: {
		remote?: string;
		cwd?: string;
	}) => Promise<Result<{value: boolean}, {message: string}>>;

	/**
	 * Stages files for commit.
	 */
	add: (options: {
		files: string | Array<string>;
		cwd?: string;
	}) => Promise<Result<object, {message: string}>>;

	/**
	 * Creates a commit.
	 */
	commit: (options: {message: string; cwd?: string}) => Promise<Result<object, {message: string}>>;

	/**
	 * Stages files and creates a commit.
	 */
	add_and_commit: (options: {
		files: string | Array<string>;
		message: string;
		cwd?: string;
	}) => Promise<Result<object, {message: string}>>;

	/**
	 * Checks if there are any uncommitted changes.
	 */
	has_changes: (options?: {cwd?: string}) => Promise<Result<{value: boolean}, {message: string}>>;

	/**
	 * Gets a list of changed files.
	 */
	get_changed_files: (options?: {
		cwd?: string;
	}) => Promise<Result<{value: Array<string>}, {message: string}>>;

	/**
	 * Creates a git tag.
	 */
	tag: (options: {
		tag_name: string;
		message?: string;
		cwd?: string;
	}) => Promise<Result<object, {message: string}>>;

	/**
	 * Pushes a tag to remote.
	 */
	push_tag: (options: {
		tag_name: string;
		origin?: string;
		cwd?: string;
	}) => Promise<Result<object, {message: string}>>;

	/**
	 * Stashes uncommitted changes.
	 */
	stash: (options?: {message?: string; cwd?: string}) => Promise<Result<object, {message: string}>>;

	/**
	 * Pops the most recent stash.
	 */
	stash_pop: (options?: {cwd?: string}) => Promise<Result<object, {message: string}>>;

	/**
	 * Checks if a specific file changed between two commits.
	 */
	has_file_changed: (options: {
		from_commit: string;
		to_commit: string;
		file_path: string;
		cwd?: string;
	}) => Promise<Result<{value: boolean}, {message: string}>>;
}

/**
 * Operations for spawning processes
 */
export interface Process_Operations {
	/**
	 * Spawns a child process and waits for completion.
	 */
	spawn: (options: {
		cmd: string;
		args: Array<string>;
		spawn_options?: SpawnOptions;
	}) => Promise<Result<{stdout?: string; stderr?: string}, {message: string; stderr?: string}>>;
}

/**
 * Operations for building packages
 */
export interface Build_Operations {
	/**
	 * Builds a package using gro build.
	 */
	build_package: (options: {
		repo: Local_Repo;
		log?: Logger;
	}) => Promise<Result<object, {message: string; output?: string}>>;
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
	/**
	 * Waits for a package version to be available on NPM.
	 * Uses exponential backoff with configurable timeout.
	 */
	wait_for_package: (options: {
		pkg: string;
		version: string;
		wait_options?: Wait_Options;
		log?: Logger;
	}) => Promise<Result<object, {message: string; timeout?: boolean}>>;

	/**
	 * Checks if a package version is available on NPM.
	 */
	check_package_available: (options: {
		pkg: string;
		version: string;
		log?: Logger;
	}) => Promise<Result<{value: boolean}, {message: string}>>;

	/**
	 * Checks npm authentication status.
	 */
	check_auth: () => Promise<Result<{username: string}, {message: string}>>;

	/**
	 * Checks if npm registry is reachable.
	 */
	check_registry: () => Promise<Result<object, {message: string}>>;

	/**
	 * Installs npm dependencies.
	 */
	install: (options?: {
		cwd?: string;
	}) => Promise<Result<object, {message: string; stderr?: string}>>;
}

/**
 * Operations for pre-flight checks
 */
export interface Preflight_Operations {
	/**
	 * Runs pre-flight validation checks before publishing.
	 */
	run_pre_flight_checks: (options: {
		repos: Array<Local_Repo>;
		pre_flight_options: Pre_Flight_Options;
		git_ops?: Git_Operations;
		npm_ops?: Npm_Operations;
		build_ops?: Build_Operations;
		changeset_ops?: Changeset_Operations;
	}) => Promise<Pre_Flight_Result>;
}

/**
 * Operations for file system access
 */
export interface Fs_Operations {
	/**
	 * Reads a file from the file system.
	 */
	readFile: (options: {
		path: string;
		encoding: BufferEncoding;
	}) => Promise<Result<{value: string}, {message: string}>>;

	/**
	 * Writes a file to the file system.
	 */
	writeFile: (options: {
		path: string;
		content: string;
	}) => Promise<Result<object, {message: string}>>;
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
