import type {Logger} from '@ryanatkn/belt/log.js';
import {existsSync} from 'node:fs';
import {readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';

import type {Local_Repo} from '$lib/local_repo.js';
import type {Bump_Type} from '$lib/semver.js';
import {compare_bump_types, calculate_next_version} from '$lib/version_utils.js';

export interface Changeset_Info {
	filename: string;
	packages: Array<{name: string; bump_type: Bump_Type}>;
	summary: string;
}

/**
 * Parses changeset content string (pure function for testing).
 * Format:
 * ---
 * "package-name": patch
 * "@scope/package": minor
 * ---
 *
 * Summary of changes
 */
export const parse_changeset_content = (
	content: string,
	filename = 'changeset.md',
): Changeset_Info | null => {
	// Match frontmatter between --- markers
	const frontmatter_match = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)/.exec(content);
	if (!frontmatter_match) {
		return null;
	}

	const frontmatter = frontmatter_match[1]!;
	const summary = frontmatter_match[2]!.trim();

	// Parse package entries
	const packages: Array<{name: string; bump_type: Bump_Type}> = [];

	// Match lines like: "package-name": patch
	// or: '@scope/package': minor
	// Allow leading whitespace
	const package_regex = /^\s*["']([^"']+)["']\s*:\s*(major|minor|patch)\s*$/gm;
	let match;

	while ((match = package_regex.exec(frontmatter)) !== null) {
		packages.push({
			name: match[1]!,
			bump_type: match[2]! as Bump_Type,
		});
	}

	if (packages.length === 0) {
		return null;
	}

	return {
		filename,
		packages,
		summary,
	};
};

/**
 * Parses a changeset file's frontmatter using regexps.
 */
export const parse_changeset_file = async (
	filepath: string,
	log?: Logger,
): Promise<Changeset_Info | null> => {
	try {
		const content = await readFile(filepath, 'utf8');
		const filename = filepath.split('/').pop() || '';

		const result = parse_changeset_content(content, filename);

		if (!result) {
			log?.warn(`  Invalid changeset format in ${filepath}`);
		}

		return result;
	} catch (error) {
		log?.error(`  Failed to parse changeset ${filepath}: ${error}`);
		return null;
	}
};

/**
 * Reads all changesets for a repo.
 */
export const read_changesets = async (
	repo: Local_Repo,
	log?: Logger,
): Promise<Array<Changeset_Info>> => {
	const changesets_dir = join(repo.repo_dir, '.changeset');

	try {
		const files = await readdir(changesets_dir);
		const changeset_files = files.filter((f) => f.endsWith('.md') && f !== 'README.md');

		const changesets: Array<Changeset_Info> = [];

		for (const file of changeset_files) {
			const filepath = join(changesets_dir, file);
			const changeset = await parse_changeset_file(filepath, log); // eslint-disable-line no-await-in-loop
			if (changeset) {
				changesets.push(changeset);
			}
		}

		return changesets;
	} catch (_error) {
		// No .changeset directory or error reading
		return [];
	}
};

/**
 * Determines the next version bump type based on changesets.
 * Returns the highest bump type found (major > minor > patch).
 */
export const determine_bump_from_changesets = (
	changesets: Array<Changeset_Info>,
	package_name: string,
): Bump_Type | null => {
	let highest_bump: Bump_Type | null = null;

	for (const changeset of changesets) {
		for (const pkg of changeset.packages) {
			if (pkg.name === package_name) {
				if (!highest_bump || compare_bump_types(pkg.bump_type, highest_bump) > 0) {
					highest_bump = pkg.bump_type;
				}
			}
		}
	}

	return highest_bump;
};

/**
 * Detects if a repo has changesets.
 * Used by preflight checks and publishing to determine if a repo needs publishing.
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

/**
 * Predicts the next version for a repo based on its changesets.
 * This enables accurate dry_run mode.
 */
export const predict_next_version = async (
	repo: Local_Repo,
	log?: Logger,
): Promise<{version: string; bump_type: Bump_Type} | null> => {
	const changesets = await read_changesets(repo, log);
	if (changesets.length === 0) {
		return null;
	}

	const bump_type = determine_bump_from_changesets(changesets, repo.pkg.name);
	if (!bump_type) {
		return null;
	}

	const current_version = repo.pkg.package_json.version || '0.0.0';
	const next_version = calculate_next_version(current_version, bump_type);

	log?.debug(`  Predicted ${repo.pkg.name}: ${current_version} → ${next_version} (${bump_type})`);

	return {
		version: next_version,
		bump_type,
	};
};
