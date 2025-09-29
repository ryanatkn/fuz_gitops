/**
 * Mock changeset operations that read from fixture data instead of filesystem.
 */

import type {Logger} from '@ryanatkn/belt/log.js';
import type {Changeset_Operations} from '$lib/operations.js';
import type {Local_Repo} from '$lib/local_repo.js';
import type {Changeset_Info} from '$lib/changeset_reader.js';
import {parse_changeset_content} from '$lib/changeset_reader.js';
import {compare_bump_types, calculate_next_version} from '$lib/version_utils.js';
import type {Bump_Type} from '$lib/semver.js';
import type {Repo_Fixture_Set} from './repo_fixture_types.js';

/**
 * Create mock changeset operations that read from fixture data.
 */
export const create_mock_changeset_ops = (fixture: Repo_Fixture_Set): Changeset_Operations => {
	// Create lookup map for quick access
	const repos_by_name = new Map(fixture.repos.map((repo) => [repo.package_json.name, repo]));

	return {
		has_changesets: async (repo: Local_Repo): Promise<boolean> => {
			const fixture_repo = repos_by_name.get(repo.pkg.name);
			return !!(fixture_repo?.changesets && fixture_repo.changesets.length > 0);
		},

		read_changesets: async (repo: Local_Repo, _log?: Logger): Promise<Array<Changeset_Info>> => {
			const fixture_repo = repos_by_name.get(repo.pkg.name);
			if (!fixture_repo?.changesets) {
				return [];
			}

			const changesets: Array<Changeset_Info> = [];
			for (const changeset_data of fixture_repo.changesets) {
				const parsed = parse_changeset_content(changeset_data.content, changeset_data.filename);
				if (parsed) {
					changesets.push(parsed);
				}
			}

			return changesets;
		},

		predict_next_version: async (
			repo: Local_Repo,
			log?: Logger,
		): Promise<{version: string; bump_type: Bump_Type} | null> => {
			const fixture_repo = repos_by_name.get(repo.pkg.name);
			if (!fixture_repo?.changesets || fixture_repo.changesets.length === 0) {
				return null;
			}

			// Parse all changesets for this repo
			let highest_bump: Bump_Type | null = null;

			for (const changeset_data of fixture_repo.changesets) {
				const parsed = parse_changeset_content(changeset_data.content, changeset_data.filename);
				if (!parsed) continue;

				// Find the package entry for this repo
				const pkg_entry = parsed.packages.find((p) => p.name === repo.pkg.name);
				if (!pkg_entry) continue;

				// Track the highest bump type
				if (!highest_bump || compare_bump_types(pkg_entry.bump_type, highest_bump) > 0) {
					highest_bump = pkg_entry.bump_type;
				}
			}

			if (!highest_bump) {
				return null;
			}

			const current_version = repo.pkg.package_json.version || '0.0.0';
			const next_version = calculate_next_version(current_version, highest_bump);

			log?.info(`  Predicted version for ${repo.pkg.name}: ${current_version} → ${next_version}`);

			return {
				version: next_version,
				bump_type: highest_bump,
			};
		},
	};
};
