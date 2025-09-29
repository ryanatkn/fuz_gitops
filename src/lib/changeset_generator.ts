import {writeFile, mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {existsSync} from 'node:fs';
import type {Logger} from '@ryanatkn/belt/log.js';
import type {Local_Repo} from './local_repo.js';
import type {Published_Version} from './multi_repo_publisher.js';
import {strip_version_prefix} from './version_utils.js';

export interface Dependency_Update {
	package_name: string;
	from_version: string;
	to_version: string;
	bump_type: 'major' | 'minor' | 'patch';
	breaking: boolean;
}

/**
 * Creates a changeset file for dependency updates.
 * Returns the path to the created changeset file.
 */
export const create_changeset_for_dependency_updates = async (
	repo: Local_Repo,
	updates: Array<Dependency_Update>,
	log?: Logger,
): Promise<string> => {
	const changesets_dir = join(repo.repo_dir, '.changeset');

	// Ensure .changeset directory exists
	if (!existsSync(changesets_dir)) {
		await mkdir(changesets_dir, {recursive: true});
	}

	// Generate a unique filename
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	const filename = `dependency-update-${timestamp}-${random}.md`;
	const filepath = join(changesets_dir, filename);

	// Determine the required bump type based on updates
	const required_bump = calculate_required_bump(repo, updates);

	// Generate changeset content
	const content = generate_changeset_content(repo.pkg.name, updates, required_bump);

	// Write the changeset file
	await writeFile(filepath, content, 'utf8');

	log?.info(`  Created changeset: ${filename}`);

	return filepath;
};

/**
 * Calculates the required bump type based on dependency updates.
 * Breaking changes propagate up the dependency tree.
 */
const calculate_required_bump = (
	repo: Local_Repo,
	updates: Array<Dependency_Update>,
): 'major' | 'minor' | 'patch' => {
	const current_version = repo.pkg.package_json.version || '0.0.0';
	const [major] = current_version.split('.').map(Number);
	const is_pre_1_0 = major === 0;

	// Check if any dependency had breaking changes
	const has_breaking = updates.some((u) => u.breaking);

	if (has_breaking) {
		// Breaking changes propagate
		// Pre-1.0: use minor for breaking changes
		// 1.0+: use major for breaking changes
		return is_pre_1_0 ? 'minor' : 'major';
	}

	// For non-breaking dependency updates, always use patch
	return 'patch';
};

/**
 * Generates the content of a changeset file.
 */
export const generate_changeset_content = (
	package_name: string,
	updates: Array<Dependency_Update>,
	bump_type: 'major' | 'minor' | 'patch',
): string => {
	// Group updates by type
	const breaking_updates = updates.filter((u) => u.breaking);
	const regular_updates = updates.filter((u) => !u.breaking);

	let message = 'Update dependencies';

	if (breaking_updates.length > 0) {
		message = 'Update dependencies (BREAKING CHANGES)';
	}

	const lines: Array<string> = [
		'---',
		`"${package_name}": ${bump_type}`,
		'---',
		'',
		message,
		'',
	];

	if (breaking_updates.length > 0) {
		lines.push('Breaking dependency changes:');
		for (const update of breaking_updates) {
			lines.push(
				`- ${update.package_name}: ${update.from_version} → ${update.to_version} (${update.bump_type})`,
			);
		}
		lines.push('');
	}

	if (regular_updates.length > 0) {
		if (breaking_updates.length > 0) {
			lines.push('Other dependency updates:');
		} else {
			lines.push('Updated dependencies:');
		}
		for (const update of regular_updates) {
			lines.push(
				`- ${update.package_name}: ${update.from_version} → ${update.to_version} (${update.bump_type})`,
			);
		}
		lines.push('');
	}

	return lines.join('\n');
};

/**
 * Creates Dependency_Update objects from published versions.
 */
export const create_dependency_updates = (
	dependencies: Map<string, string>,
	published_versions: Map<string, Published_Version>,
): Array<Dependency_Update> => {
	const updates: Array<Dependency_Update> = [];

	for (const [dep_name, current_version] of dependencies) {
		const published = published_versions.get(dep_name);
		if (published) {
			// Strip version prefix (^, ~, etc)
			const clean_current = strip_version_prefix(current_version);

			updates.push({
				package_name: dep_name,
				from_version: clean_current,
				to_version: published.new_version,
				bump_type: published.bump_type,
				breaking: published.breaking,
			});
		}
	}

	return updates;
};