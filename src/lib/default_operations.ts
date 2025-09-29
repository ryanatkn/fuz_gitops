/**
 * Default implementations of operations interfaces
 */

import {spawn} from '@ryanatkn/belt/process.js';

import {has_changesets, read_changesets, predict_next_version} from './changeset_reader.js';
import {wait_for_package, check_package_available} from './npm_registry.js';
import {run_pre_flight_checks} from './pre_flight_checks.js';
import {
	git_add,
	git_commit,
	git_add_and_commit,
	git_tag,
	git_push_tag,
	git_has_changes,
	git_get_changed_files,
	git_stash,
	git_stash_pop,
	git_switch_branch,
	git_current_branch_name_required,
	git_current_commit_hash_required,
	git_check_clean_workspace_as_boolean,
	git_checkout_wrapper,
	git_pull_wrapper,
	type Git_Branch,
	type Git_Origin,
} from './git_operations.js';
import type {
	Changeset_Operations,
	Git_Operations,
	Process_Operations,
	Npm_Operations,
	Preflight_Operations,
	Publishing_Operations,
} from './operations.js';

/**
 * Default changeset operations using actual file system
 */
export const default_changeset_operations: Changeset_Operations = {
	has_changesets,
	read_changesets,
	predict_next_version,
};

/**
 * Default git operations using actual git commands
 */
export const default_git_operations: Git_Operations = {
	// Core git info
	current_branch_name: async (cwd?: string) =>
		git_current_branch_name_required(cwd ? {cwd} : undefined),
	current_commit_hash: async (branch?: string, cwd?: string) =>
		git_current_commit_hash_required(branch, cwd ? {cwd} : undefined),
	check_clean_workspace: async (cwd?: string) =>
		git_check_clean_workspace_as_boolean(cwd ? {cwd} : undefined),

	// Branch operations
	checkout: async (branch: string, cwd?: string) =>
		git_checkout_wrapper(branch, cwd ? {cwd} : undefined),
	pull: async (origin?: string, branch?: string, cwd?: string) =>
		git_pull_wrapper(origin, branch, cwd ? {cwd} : undefined),
	switch_branch: async (branch: string, pull?: boolean, cwd?: string) =>
		git_switch_branch(branch as Git_Branch, pull, cwd ? {cwd} : undefined),

	// Staging and committing
	add: async (files: string | string[], cwd?: string) =>
		git_add(files, cwd ? {cwd} : undefined),
	commit: async (message: string, cwd?: string) =>
		git_commit(message, cwd ? {cwd} : undefined),
	add_and_commit: async (files: string | string[], message: string, cwd?: string) =>
		git_add_and_commit(files, message, cwd ? {cwd} : undefined),
	has_changes: async (cwd?: string) =>
		git_has_changes(cwd ? {cwd} : undefined),
	get_changed_files: async (cwd?: string) =>
		git_get_changed_files(cwd ? {cwd} : undefined),

	// Tagging
	tag: async (tag_name: string, message?: string, cwd?: string) =>
		git_tag(tag_name, message, cwd ? {cwd} : undefined),
	push_tag: async (tag_name: string, origin?: string, cwd?: string) =>
		git_push_tag(tag_name, origin as Git_Origin, cwd ? {cwd} : undefined),

	// Stashing
	stash: async (message?: string, cwd?: string) =>
		git_stash(message, cwd ? {cwd} : undefined),
	stash_pop: async (cwd?: string) =>
		git_stash_pop(cwd ? {cwd} : undefined),
};

/**
 * Default process operations using actual spawn
 */
export const default_process_operations: Process_Operations = {
	spawn,
};

/**
 * Default NPM operations using actual registry
 */
export const default_npm_operations: Npm_Operations = {
	wait_for_package,
	check_package_available,
};

/**
 * Default pre-flight operations
 */
export const default_preflight_operations: Preflight_Operations = {
	run_pre_flight_checks: async (repos, options, git_ops) =>
		run_pre_flight_checks(repos, options, git_ops || default_git_operations),
};

/**
 * Combined default operations for publishing
 */
export const default_publishing_operations: Publishing_Operations = {
	changeset: default_changeset_operations,
	git: default_git_operations,
	process: default_process_operations,
	npm: default_npm_operations,
	preflight: default_preflight_operations,
};