import {test, expect} from 'vitest';

import type {Local_Repo} from '$lib/local_repo.js';
import {publish_repos} from '$lib/multi_repo_publisher.js';
import {
	create_mock_repo,
	create_mock_gitops_ops,
	create_mock_package_json_files,
} from '$lib/test_helpers.js';

/* eslint-disable @typescript-eslint/require-await */

test('dry run predicts versions without publishing', async () => {
	const repos: Array<Local_Repo> = [
		create_mock_repo({name: 'pkg-a', version: '0.1.0'}),
		create_mock_repo({name: 'pkg-b', version: '0.2.0', deps: {'pkg-a': '0.1.0'}}),
	];

	// Create mock operations
	const mock_ops = create_mock_gitops_ops({
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

test('always fails fast on publish errors', async () => {
	const repos: Array<Local_Repo> = [
		create_mock_repo({name: 'pkg-a', version: '0.1.0'}),
		create_mock_repo({name: 'pkg-b', version: '0.2.0'}),
		create_mock_repo({name: 'pkg-c', version: '0.3.0'}),
	];

	// Create mock file system
	const mock_fs = create_mock_package_json_files(repos);

	let publish_attempt = 0;
	const mock_ops = create_mock_gitops_ops({
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
			readFile: async (path) => {
				const content = mock_fs.get(path);
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
			update_deps: false,
		},
		mock_ops,
	);

	// With fail-fast behavior: only pkg-a fails, no other packages are attempted
	expect(result.ok).toBe(false);
	expect(result.failed.length).toBe(1);
	expect(result.failed[0].name).toBe('pkg-a');
	expect(result.published.length).toBe(0); // No packages published after failure
});

test('handles breaking change cascades in dry run', async () => {
	const repos: Array<Local_Repo> = [
		create_mock_repo({name: 'pkg-core', version: '0.5.0'}),
		create_mock_repo({name: 'pkg-mid', version: '0.3.0', deps: {'pkg-core': '^0.5.0'}}),
		create_mock_repo({name: 'pkg-app', version: '0.2.0', deps: {'pkg-mid': '^0.3.0'}}),
	];

	const mock_ops = create_mock_gitops_ops({
		changeset: {
			predict_next_version: async (repo) => {
				// pkg-core has a breaking change (0.x minor bump)
				if (repo.pkg.name === 'pkg-core') {
					return {version: '0.6.0', bump_type: 'minor'};
				}
				// Others have patch bumps
				if (repo.pkg.name === 'pkg-mid') {
					return {version: '0.3.1', bump_type: 'patch'};
				}
				if (repo.pkg.name === 'pkg-app') {
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
				repos_with_changesets: new Set(['pkg-core', 'pkg-mid', 'pkg-app']),
				repos_without_changesets: new Set(),
			}),
		},
	});

	const result = await publish_repos(
		repos,
		{
			dry: true,
			update_deps: false,
		},
		mock_ops,
	);

	expect(result.ok).toBe(true);
	expect(result.published.length).toBe(3);

	// Check versions
	const core = result.published.find((p) => p.name === 'pkg-core');
	const mid = result.published.find((p) => p.name === 'pkg-mid');
	const app = result.published.find((p) => p.name === 'pkg-app');

	expect(core?.new_version).toBe('0.6.0');
	expect(core?.breaking).toBe(true);
	expect(mid?.new_version).toBe('0.3.1');
	expect(app?.new_version).toBe('0.2.1');
});

test('skips repos without changesets', async () => {
	const repos: Array<Local_Repo> = [
		create_mock_repo({name: 'pkg-a', version: '0.1.0'}),
		create_mock_repo({name: 'pkg-b', version: '0.2.0'}),
		create_mock_repo({name: 'pkg-c', version: '0.3.0'}),
	];

	// Create mock file system
	const mock_fs = create_mock_package_json_files(repos);

	// Create mock operations where only pkg-a has changesets
	const mock_ops = create_mock_gitops_ops({
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
			readFile: async (path) => {
				const content = mock_fs.get(path);
				if (!content) {
					throw new Error(`File not found: ${path}`);
				}
				return content;
			},
			writeFile: async () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
		},
	});

	const result = await publish_repos(
		repos,
		{
			dry: false,
			update_deps: false,
		},
		mock_ops,
	);

	// Only pkg-a should be published
	expect(result.ok).toBe(true);
	expect(result.published.length).toBe(1);
	expect(result.published[0].name).toBe('pkg-a');
});
