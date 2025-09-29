/**
 * Utilities for loading in-memory fixture data as Local_Repo objects.
 */

import type {Local_Repo} from '$lib/local_repo.js';
import type {Pkg} from '@ryanatkn/belt/pkg.js';
import type {Repo_Fixture_Set, Repo_Fixture_Data} from './repo_fixture_types.js';

/**
 * Convert fixture data to Local_Repo objects that can be used with publishing functions.
 */
export const fixture_to_local_repos = (fixture: Repo_Fixture_Set): Array<Local_Repo> => {
	return fixture.repos.map((repo_data) => fixture_repo_to_local_repo(repo_data));
};

/**
 * Convert a single fixture repo to a Local_Repo object.
 */
export const fixture_repo_to_local_repo = (repo_data: Repo_Fixture_Data): Local_Repo => {
	const {repo_name, repo_url, package_json} = repo_data;

	// Create minimal Pkg object
	const pkg: Pkg = {
		name: package_json.name,
		package_json,
		src_json: {
			name: package_json.name,
			version: package_json.version,
			exported_modules: [],
		},
	};

	const local_repo: Local_Repo = {
		type: 'resolved_local_repo',
		repo_name,
		repo_dir: `/fixtures/${repo_name}`, // Fake path - not used in tests
		repo_url,
		repo_git_ssh_url: `git@github.com:test/${repo_name}.git`,
		repo_config: {
			repo_url,
			repo_dir: null,
			branch: 'main' as any, // Git_Branch type
		},
		pkg,
	};

	// Add dependency maps if present
	if (package_json.dependencies) {
		local_repo.dependencies = new Map(Object.entries(package_json.dependencies));
	}
	if (package_json.devDependencies) {
		local_repo.dev_dependencies = new Map(Object.entries(package_json.devDependencies));
	}
	if (package_json.peerDependencies) {
		local_repo.peer_dependencies = new Map(Object.entries(package_json.peerDependencies));
	}

	return local_repo;
};