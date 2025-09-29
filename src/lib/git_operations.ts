import {spawn, spawn_out} from '@ryanatkn/belt/process.js';
import type {SpawnOptions} from 'node:child_process';
import {
	git_check_clean_workspace,
	git_checkout,
	git_pull,
	type Git_Branch,
	type Git_Origin,
} from '@ryanatkn/gro/git.js';

/**
 * Adds files to git staging area and throws if anything goes wrong.
 */
export const git_add = async (
	files: string | string[],
	options?: SpawnOptions,
): Promise<void> => {
	const file_list = Array.isArray(files) ? files : [files];
	const result = await spawn('git', ['add', ...file_list], options);
	if (!result.ok) {
		throw Error(`git_add failed with code ${result.code}`);
	}
};

/**
 * Commits staged changes with a message and throws if anything goes wrong.
 */
export const git_commit = async (
	message: string,
	options?: SpawnOptions,
): Promise<void> => {
	const result = await spawn('git', ['commit', '-m', message], options);
	if (!result.ok) {
		throw Error(`git_commit failed with code ${result.code}`);
	}
};

/**
 * Adds files and commits in one operation and throws if anything goes wrong.
 */
export const git_add_and_commit = async (
	files: string | string[],
	message: string,
	options?: SpawnOptions,
): Promise<void> => {
	await git_add(files, options);
	await git_commit(message, options);
};

/**
 * Creates a git tag and throws if anything goes wrong.
 */
export const git_tag = async (
	tag_name: string,
	message?: string,
	options?: SpawnOptions,
): Promise<void> => {
	const args = message
		? ['tag', '-a', tag_name, '-m', message]
		: ['tag', tag_name];

	const result = await spawn('git', args, options);
	if (!result.ok) {
		throw Error(`git_tag failed for tag '${tag_name}' with code ${result.code}`);
	}
};

/**
 * Pushes a tag to origin and throws if anything goes wrong.
 */
export const git_push_tag = async (
	tag_name: string,
	origin: Git_Origin = 'origin' as Git_Origin,
	options?: SpawnOptions,
): Promise<void> => {
	const result = await spawn('git', ['push', origin, tag_name], options);
	if (!result.ok) {
		throw Error(`git_push_tag failed for tag '${tag_name}' with code ${result.code}`);
	}
};

/**
 * Returns true if there are any uncommitted changes.
 */
export const git_has_changes = async (
	options?: SpawnOptions,
): Promise<boolean> => {
	const {stdout} = await spawn_out('git', ['status', '--porcelain'], options);
	return stdout ? stdout.trim().length > 0 : false;
};

/**
 * Returns list of changed files compared to HEAD.
 */
export const git_get_changed_files = async (
	options?: SpawnOptions,
): Promise<string[]> => {
	const {stdout} = await spawn_out('git', ['diff', '--name-only', 'HEAD'], options);
	if (!stdout) return [];

	return stdout
		.split('\n')
		.map((f) => f.trim())
		.filter(Boolean);
};

/**
 * Stashes current changes and throws if anything goes wrong.
 */
export const git_stash = async (
	message?: string,
	options?: SpawnOptions,
): Promise<void> => {
	const args = message
		? ['stash', 'push', '-m', message]
		: ['stash', 'push'];

	const result = await spawn('git', args, options);
	if (!result.ok) {
		throw Error(`git_stash failed with code ${result.code}`);
	}
};

/**
 * Applies stashed changes and throws if anything goes wrong.
 */
export const git_stash_pop = async (
	options?: SpawnOptions,
): Promise<void> => {
	const result = await spawn('git', ['stash', 'pop'], options);
	if (!result.ok) {
		throw Error(`git_stash_pop failed with code ${result.code}`);
	}
};

/**
 * Switches to a branch with safety checks and throws if workspace is not clean.
 */
export const git_switch_branch = async (
	branch: Git_Branch,
	pull: boolean = true,
	options?: SpawnOptions,
): Promise<void> => {
	// Check if workspace is clean first
	const error = await git_check_clean_workspace(options);
	if (error) {
		throw Error(`Cannot switch branch: ${error}`);
	}

	// Checkout the branch
	await git_checkout(branch, options);

	// Pull latest changes if requested
	if (pull) {
		await git_pull(undefined, undefined, options);
	}

	// Verify workspace is still clean
	const error_after = await git_check_clean_workspace(options);
	if (error_after) {
		throw Error(`Workspace unclean after switching to ${branch}: ${error_after}`);
	}
};

// Re-export commonly used functions from gro for convenience
export {
	git_check_clean_workspace,
	git_checkout,
	git_current_branch_name,
	git_current_commit_hash,
	git_fetch,
	git_pull,
	git_push,
	git_push_to_create,
	git_remote_branch_exists,
	git_local_branch_exists,
	type Git_Branch,
	type Git_Origin,
} from '@ryanatkn/gro/git.js';