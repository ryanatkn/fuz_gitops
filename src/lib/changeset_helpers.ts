import {existsSync} from 'node:fs';
import {readdir} from 'node:fs/promises';
import {join} from 'node:path';
import type {Local_Repo} from './local_repo.js';

/**
 * Detects if a repo has changesets.
 * Used by pre-flight checks and publishing to determine if a repo needs publishing.
 */
export const has_changesets = async (repo: Local_Repo): Promise<boolean> => {
	const changesets_dir = join(repo.repo_dir, '.changeset');
	if (!existsSync(changesets_dir)) {
		return false;
	}

	try {
		const files = await readdir(changesets_dir);
		// Look for markdown files that aren't the README
		return files.some((file) => file.endsWith('.md') && file !== 'README.md');
	} catch {
		return false;
	}
};