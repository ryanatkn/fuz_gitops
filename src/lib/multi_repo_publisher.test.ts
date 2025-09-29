import {test, expect} from 'vitest';
import type {Src_Json} from '@ryanatkn/belt/src_json.js';

import type {Local_Repo} from './local_repo.js';
import {publish_repos} from './multi_repo_publisher.js';
import {create_mock_publishing_ops, create_mock_fs} from './test_helpers.js';

// Keep local create_mock_repo for now, can migrate to test_helpers later
const create_mock_repo = (
	name: string,
	version: string,
	deps: Record<string, string> = {},
): Local_Repo => ({
	type: 'resolved_local_repo' as const,
	repo_name: name,
	repo_dir: `/test/${name}`,
	repo_url: `https://github.com/test/${name}`,
	repo_git_ssh_url: `git@github.com:test/${name}.git`,
	repo_config: {
		repo_url: `https://github.com/test/${name}`,
		repo_dir: null,
		branch: 'main',
	},
	pkg: {
		name,
		repo_name: name,
		repo_url: `https://github.com/test/${name}`,
		homepage_url: `https://test.com/${name}`,
		owner_name: 'test',
		logo_url: null,
		logo_alt: `logo for ${name}`,
		npm_url: null,
		changelog_url: null,
		published: false,
		src_json: {} as Src_Json,
		package_json: {
			name,
			version,
			dependencies: deps,
		},
	},
	dependencies: new Map(Object.entries(deps)),
	dev_dependencies: new Map(),
	peer_dependencies: new Map(),
});

test('dry run predicts versions without publishing', async () => {
	const repos: Array<Local_Repo> = [
		create_mock_repo('pkg-a', '0.1.0'),
		create_mock_repo('pkg-b', '0.2.0', {'pkg-a': '0.1.0'}),
	];

	// Create mock operations
	const mock_ops = create_mock_publishing_ops({
		changeset: {
			predict_next_version: async (repo) => {
				if (repo.pkg.name === 'pkg-a') {
					return {version: '0.1.1', bump_type: 'patch'};
				}
				if (repo.pkg.name === 'pkg-b') {
					return {version: '0.2.1', bump_type: 'patch'};
				}
				return null;
			},
		},
		preflight: {
			run_pre_flight_checks: async () => ({
				ok: true,
				warnings: [],
				errors: [],
				repos_with_changesets: new Set(['pkg-a', 'pkg-b']),
				repos_without_changesets: new Set(),
			}),
		},
	});

	const result = await publish_repos(
		repos,
		{
			dry: true,
			bump: 'auto',
			continue_on_error: false,
			update_deps: false,
		},
		mock_ops,
	);

	expect(result.ok).toBe(true);
	expect(result.published.length).toBe(2);
	expect(result.published[0].name).toBe('pkg-a');
	expect(result.published[0].new_version).toBe('0.1.1');
	expect(result.published[1].name).toBe('pkg-b');
	expect(result.published[1].new_version).toBe('0.2.1');
});

test('handles publish failures with continue_on_error', async () => {
	const repos: Array<Local_Repo> = [
		create_mock_repo('pkg-a', '0.1.0'),
		create_mock_repo('pkg-b', '0.2.0'),
		create_mock_repo('pkg-c', '0.3.0'),
	];

	// Create mock file system
	const mockFs = create_mock_fs(repos);

	let publish_attempt = 0;
	const mock_ops = create_mock_publishing_ops({
		process: {
			spawn: async (cmd, args) => {
				if (cmd === 'gro' && args[0] === 'publish') {
					publish_attempt++;
					// Make pkg-a fail
					if (publish_attempt === 1) {
						return {ok: false};
					}
				}
				return {ok: true};
			},
		},
		preflight: {
			run_pre_flight_checks: async () => ({
				ok: true,
				warnings: [],
				errors: [],
				repos_with_changesets: new Set(['pkg-a', 'pkg-b', 'pkg-c']),
				repos_without_changesets: new Set(),
			}),
		},
		fs: {
			readFile: async (path: string) => {
				const content = mockFs.get(path);
				if (!content) {
					throw new Error(`File not found: ${path}`);
				}
				return content;
			},
		},
	});

	const result = await publish_repos(
		repos,
		{
			dry: false,
			bump: 'auto',
			continue_on_error: true,
			update_deps: false,
		},
		mock_ops,
	);

	expect(result.ok).toBe(false);
	expect(result.failed.length).toBe(1);
	expect(result.failed[0].name).toBe('pkg-a');
	expect(result.published.length).toBe(2); // pkg-b and pkg-c should succeed
});

test('skips repos without changesets', async () => {
	const repos: Array<Local_Repo> = [
		create_mock_repo('pkg-a', '0.1.0'),
		create_mock_repo('pkg-b', '0.2.0'),
		create_mock_repo('pkg-c', '0.3.0'),
	];

	// Create mock file system
	const mockFs = create_mock_fs(repos);

	// Create mock operations where only pkg-a has changesets
	const mock_ops = create_mock_publishing_ops({
		changeset: {
			has_changesets: async (repo) => repo.pkg.name === 'pkg-a',
		},
		preflight: {
			run_pre_flight_checks: async () => ({
				ok: true,
				warnings: [],
				errors: [],
				repos_with_changesets: new Set(['pkg-a']),
				repos_without_changesets: new Set(['pkg-b', 'pkg-c']),
			}),
		},
		fs: {
			readFile: async (path: string) => {
				const content = mockFs.get(path);
				if (!content) {
					throw new Error(`File not found: ${path}`);
				}
				return content;
			},
			writeFile: async () => {},
		},
	});

	const result = await publish_repos(
		repos,
		{
			dry: false,
			bump: 'auto',
			continue_on_error: false,
			update_deps: false,
		},
		mock_ops,
	);

	// Only pkg-a should be published
	expect(result.ok).toBe(true);
	expect(result.published.length).toBe(1);
	expect(result.published[0].name).toBe('pkg-a');
});

