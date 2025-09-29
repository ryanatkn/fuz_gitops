import {existsSync} from 'node:fs';
import {readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import type {Bump_Type} from './semver.js';
import type {Local_Repo} from './local_repo.js';
import {compare_bump_types} from './changeset_reader.js';

export interface Changeset {
	id: string;
	summary: string;
	packages: Map<string, Bump_Type>;
}

export interface Changeset_Analysis {
	has_changesets: boolean;
	changesets: Array<Changeset>;
	suggested_bumps: Map<string, Bump_Type>;
}

/**
 * Detects if a repo has changesets.
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
 * Parses changesets from a repo.
 */
export const parse_changesets = async (repo: Local_Repo): Promise<Array<Changeset>> => {
	const changesets_dir = join(repo.repo_dir, '.changeset');
	if (!existsSync(changesets_dir)) {
		return [];
	}

	const changesets: Array<Changeset> = [];

	try {
		const files = await readdir(changesets_dir);
		const changeset_files = files.filter((file) => file.endsWith('.md') && file !== 'README.md');

		for (const file of changeset_files) {
			const content = await readFile(join(changesets_dir, file), 'utf8');
			const changeset = parse_changeset_content(file.replace('.md', ''), content);
			if (changeset) {
				changesets.push(changeset);
			}
		}
	} catch {
		// Ignore errors
	}

	return changesets;
};

/**
 * Parses a changeset file content.
 * Format:
 * ---
 * "package-name": patch
 * "another-package": minor
 * ---
 *
 * Summary of changes
 */
const parse_changeset_content = (id: string, content: string): Changeset | null => {
	const lines = content.split('\n');

	// Find the frontmatter boundaries
	let start_index = -1;
	let end_index = -1;

	for (let i = 0; i < lines.length; i++) {
		if (lines[i].trim() === '---') {
			if (start_index === -1) {
				start_index = i;
			} else {
				end_index = i;
				break;
			}
		}
	}

	if (start_index === -1 || end_index === -1) {
		return null;
	}

	// Parse packages and bump types
	const packages = new Map<string, Bump_Type>();
	for (let i = start_index + 1; i < end_index; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		// Match lines like: "package-name": patch
		const match = line.match(/^"([^"]+)":\s*(major|minor|patch)$/);
		if (match) {
			packages.set(match[1], match[2] as Bump_Type);
		}
	}

	// Get summary (everything after the second ---)
	const summary = lines
		.slice(end_index + 1)
		.join('\n')
		.trim();

	return {
		id,
		summary,
		packages,
	};
};

/**
 * Analyzes changesets for a repo and suggests version bumps.
 */
export const analyze_changesets = async (repo: Local_Repo): Promise<Changeset_Analysis> => {
	const changesets = await parse_changesets(repo);

	if (changesets.length === 0) {
		return {
			has_changesets: false,
			changesets: [],
			suggested_bumps: new Map(),
		};
	}

	// Aggregate bump types - use the highest bump type for each package
	const suggested_bumps = new Map<string, Bump_Type>();

	for (const changeset of changesets) {
		for (const [pkg, bump] of changeset.packages) {
			const existing = suggested_bumps.get(pkg);
			if (!existing || compare_bump_types(bump, existing) > 0) {
				suggested_bumps.set(pkg, bump);
			}
		}
	}

	return {
		has_changesets: true,
		changesets,
		suggested_bumps,
	};
};


/**
 * Determines the bump type for a repo based on changesets.
 * Returns null if no changesets found.
 */
export const determine_bump_from_changesets = async (repo: Local_Repo): Promise<Bump_Type | null> => {
	const analysis = await analyze_changesets(repo);

	if (analysis.has_changesets) {
		// Get the bump for this specific package
		const bump = analysis.suggested_bumps.get(repo.pkg.name);
		if (bump) {
			return bump;
		}
	}

	// Return null if no changesets
	return null;
};