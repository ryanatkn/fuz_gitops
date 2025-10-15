/**
 * Operation interfaces for dependency injection
 * Allows functions to be testable by parameterizing external dependencies
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

	// Staging and committing
	add: (files: string | string[], cwd?: string) => Promise<void>;
	commit: (message: string, cwd?: string) => Promise<void>;
	add_and_commit: (files: string | string[], message: string, cwd?: string) => Promise<void>;
	has_changes: (cwd?: string) => Promise<boolean>;
	get_changed_files: (cwd?: string) => Promise<string[]>;

	// Tagging
	tag: (tag_name: string, message?: string, cwd?: string) => Promise<void>;
	push_tag: (tag_name: string, origin?: string, cwd?: string) => Promise<void>;

	// Stashing
	stash: (message?: string, cwd?: string) => Promise<void>;
	stash_pop: (cwd?: string) => Promise<void>;
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
 * Combined operations for publishing
 */
export interface Publishing_Operations {
	changeset: Changeset_Operations;
	git: Git_Operations;
	process: Process_Operations;
	npm: Npm_Operations;
	preflight: Preflight_Operations;
	fs: Fs_Operations;
}
