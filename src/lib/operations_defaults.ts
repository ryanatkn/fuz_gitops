/**
 * Production implementations of operations interfaces.
 *
 * Provides real git, npm, fs, and build operations for production use.
 * For interface definitions and dependency injection pattern, see `operations.ts`.
 */

import {spawn, spawn_out} from '@ryanatkn/belt/process.js';
import {readFile, writeFile} from 'node:fs/promises';
import {git_checkout, type Git_Branch, type Git_Origin} from '@ryanatkn/belt/git.js';
import {EMPTY_OBJECT} from '@ryanatkn/belt/object.js';

import {has_changesets, read_changesets, predict_next_version} from '$lib/changeset_reader.js';
import {wait_for_package, check_package_available} from '$lib/npm_registry.js';
import {run_preflight_checks} from '$lib/preflight_checks.js';
import {
	git_add,
	git_commit,
	git_add_and_commit,
	git_tag,
	git_push_tag,
	git_has_changes,
	git_get_changed_files,
	git_has_file_changed,
	git_stash,
	git_stash_pop,
	git_switch_branch,
	git_current_branch_name_required,
	git_current_commit_hash_required,
	git_check_clean_workspace_as_boolean,
	git_has_remote,
} from '$lib/git_operations.js';
import type {
	Changeset_Operations,
	Git_Operations,
	Process_Operations,
	Npm_Operations,
	Preflight_Operations,
	Fs_Operations,
	Build_Operations,
	Gitops_Operations,
} from '$lib/operations.js';

export const default_changeset_operations: Changeset_Operations = {
	has_changesets: async (options) => {
		const {repo} = options;
		try {
			const value = await has_changesets(repo);
			return {ok: true, value};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	read_changesets: async (options) => {
		const {repo, log} = options;
		try {
			const value = await read_changesets(repo, log);
			return {ok: true, value};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	predict_next_version: async (options) => {
		const {repo, log} = options;
		try {
			const result = await predict_next_version(repo, log);
			if (result === null) {
				return null;
			}
			// predict_next_version returns {version, bump_type}, we need to wrap it in OK
			return {ok: true, ...result};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},
};

export const default_git_operations: Git_Operations = {
	// Core git info
	current_branch_name: async (options) => {
		const {cwd} = options ?? EMPTY_OBJECT;
		try {
			const value = await git_current_branch_name_required(cwd ? {cwd} : undefined);
			return {ok: true, value};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	current_commit_hash: async (options) => {
		const {branch, cwd} = options ?? EMPTY_OBJECT;
		try {
			const value = await git_current_commit_hash_required(branch, cwd ? {cwd} : undefined);
			return {ok: true, value};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	check_clean_workspace: async (options) => {
		const {cwd} = options ?? EMPTY_OBJECT;
		try {
			const value = await git_check_clean_workspace_as_boolean(cwd ? {cwd} : undefined);
			return {ok: true, value};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	// Branch operations
	checkout: async (options) => {
		const {branch, cwd} = options;
		try {
			await git_checkout(branch, cwd ? {cwd} : undefined);
			return {ok: true};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	pull: async (options) => {
		const {origin, branch, cwd} = options ?? EMPTY_OBJECT;
		try {
			await spawn('git', ['pull', origin || 'origin', branch || ''], cwd ? {cwd} : undefined);
			return {ok: true};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	switch_branch: async (options) => {
		const {branch, pull, cwd} = options;
		try {
			await git_switch_branch(branch as Git_Branch, pull, cwd ? {cwd} : undefined);
			return {ok: true};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	has_remote: async (options) => {
		const {remote, cwd} = options ?? EMPTY_OBJECT;
		try {
			const value = await git_has_remote(remote, cwd ? {cwd} : undefined);
			return {ok: true, value};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	// Staging and committing
	add: async (options) => {
		const {files, cwd} = options;
		try {
			await git_add(files, cwd ? {cwd} : undefined);
			return {ok: true};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	commit: async (options) => {
		const {message, cwd} = options;
		try {
			await git_commit(message, cwd ? {cwd} : undefined);
			return {ok: true};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	add_and_commit: async (options) => {
		const {files, message, cwd} = options;
		try {
			await git_add_and_commit(files, message, cwd ? {cwd} : undefined);
			return {ok: true};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	has_changes: async (options) => {
		const {cwd} = options ?? EMPTY_OBJECT;
		try {
			const value = await git_has_changes(cwd ? {cwd} : undefined);
			return {ok: true, value};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	get_changed_files: async (options) => {
		const {cwd} = options ?? EMPTY_OBJECT;
		try {
			const value = await git_get_changed_files(cwd ? {cwd} : undefined);
			return {ok: true, value};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	// Tagging
	tag: async (options) => {
		const {tag_name, message, cwd} = options;
		try {
			await git_tag(tag_name, message, cwd ? {cwd} : undefined);
			return {ok: true};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	push_tag: async (options) => {
		const {tag_name, origin, cwd} = options;
		try {
			await git_push_tag(tag_name, origin as Git_Origin, cwd ? {cwd} : undefined);
			return {ok: true};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	// Stashing
	stash: async (options) => {
		const {message, cwd} = options ?? EMPTY_OBJECT;
		try {
			await git_stash(message, cwd ? {cwd} : undefined);
			return {ok: true};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	stash_pop: async (options) => {
		const {cwd} = options ?? EMPTY_OBJECT;
		try {
			await git_stash_pop(cwd ? {cwd} : undefined);
			return {ok: true};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	// File change detection
	has_file_changed: async (options) => {
		const {from_commit, to_commit, file_path, cwd} = options;
		try {
			const value = await git_has_file_changed(
				from_commit,
				to_commit,
				file_path,
				cwd ? {cwd} : undefined,
			);
			return {ok: true, value};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},
};

export const default_process_operations: Process_Operations = {
	spawn: async (options) => {
		const {cmd, args, spawn_options} = options;
		try {
			const spawned = await spawn_out(cmd, args, spawn_options);
			if (spawned.result.ok) {
				return {
					ok: true,
					stdout: spawned.stdout || undefined,
					stderr: spawned.stderr || undefined,
				};
			} else {
				return {
					ok: false,
					message: 'Command failed',
					stderr: spawned.stderr || undefined,
				};
			}
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},
};

export const default_npm_operations: Npm_Operations = {
	wait_for_package: async (options) => {
		const {pkg, version, wait_options, log} = options;
		try {
			await wait_for_package(pkg, version, wait_options, log);
			return {ok: true};
		} catch (error) {
			return {ok: false, message: String(error), timeout: true};
		}
	},

	check_package_available: async (options) => {
		const {pkg, version, log} = options;
		try {
			const value = await check_package_available(pkg, version, log);
			return {ok: true, value};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	check_auth: async () => {
		try {
			const result = await spawn_out('npm', ['whoami']);
			if (result.stdout) {
				const username = result.stdout.trim();
				if (username) {
					return {ok: true, username};
				}
			}
			return {ok: false, message: 'Not logged in to npm'};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	check_registry: async () => {
		try {
			const result = await spawn_out('npm', ['ping']);
			if (result.stdout) {
				return {ok: true};
			}
			return {ok: false, message: 'Failed to ping npm registry'};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	install: async (options) => {
		const {cwd} = options ?? EMPTY_OBJECT;
		try {
			const spawned = await spawn_out('npm', ['install'], cwd ? {cwd} : undefined);
			if (spawned.result.ok) {
				return {ok: true};
			} else {
				return {ok: false, message: 'Install failed', stderr: spawned.stderr || undefined};
			}
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	cache_clean: async () => {
		try {
			const spawned = await spawn_out('npm', ['cache', 'clean', '--force']);
			if (spawned.result.ok) {
				return {ok: true};
			} else {
				return {ok: false, message: 'Cache clean failed'};
			}
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},
};

export const default_preflight_operations: Preflight_Operations = {
	run_preflight_checks: async (options) => {
		return run_preflight_checks(options);
	},
};

export const default_fs_operations: Fs_Operations = {
	readFile: async (options) => {
		const {path, encoding} = options;
		try {
			const value = await readFile(path, encoding);
			return {ok: true, value};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},

	writeFile: async (options) => {
		const {path, content} = options;
		try {
			await writeFile(path, content);
			return {ok: true};
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},
};

export const default_build_operations: Build_Operations = {
	build_package: async (options) => {
		const {repo, log} = options;
		try {
			log?.info(`  Building ${repo.pkg.name}...`);
			const spawned = await spawn_out('gro', ['build'], {cwd: repo.repo_dir});
			if (spawned.result.ok) {
				return {ok: true};
			} else {
				return {
					ok: false,
					message: 'Build failed',
					output: spawned.stderr || spawned.stdout || 'Build failed',
				};
			}
		} catch (error) {
			return {ok: false, message: String(error)};
		}
	},
};

/**
 * Combined default operations for all gitops functionality.
 */
export const default_gitops_operations: Gitops_Operations = {
	changeset: default_changeset_operations,
	git: default_git_operations,
	process: default_process_operations,
	npm: default_npm_operations,
	preflight: default_preflight_operations,
	fs: default_fs_operations,
	build: default_build_operations,
};
