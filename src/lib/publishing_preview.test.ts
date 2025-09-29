import {test, expect} from 'vitest';

import type {Local_Repo} from './local_repo.js';
import {preview_publishing_plan} from './publishing_preview.js';
import type {Changeset_Operations} from './operations.js';
import {create_mock_repo} from './test_helpers.js';

test('detects breaking change cascades', async () => {
	const repos: Array<Local_Repo> = [
		create_mock_repo({name: 'pkg-a', version: '0.1.0'}),
		create_mock_repo({name: 'pkg-b', version: '0.2.0', deps: {'pkg-a': '0.1.0'}}),
		create_mock_repo({name: 'pkg-c', version: '0.3.0', deps: {'pkg-b': '0.2.0'}}),
	];

	// Mock changeset operations to simulate breaking changes
	const mock_ops: Changeset_Operations = {
		has_changesets: async (repo) => repo.pkg.name === 'pkg-a',
		read_changesets: async () => [],
		predict_next_version: async (repo) => {
			if (repo.pkg.name === 'pkg-a') {
				// Simulate a breaking change for pkg-a
				return {version: '0.2.0', bump_type: 'minor'};
			}
			return null;
		},
	};

	const preview = await preview_publishing_plan(repos, undefined, mock_ops);

	// pkg-a should have a breaking change (0.x.x minor bump)
	expect(preview.version_changes.find(vc => vc.package_name === 'pkg-a')?.breaking).toBe(true);

	// pkg-b should cascade the breaking change
	expect(preview.breaking_cascades.has('pkg-a')).toBe(true);
	expect(preview.breaking_cascades.get('pkg-a')).toContain('pkg-b');
});

test('handles bump escalation', async () => {
	const repos: Array<Local_Repo> = [
		create_mock_repo({name: 'pkg-a', version: '0.1.0'}),
		create_mock_repo({name: 'pkg-b', version: '0.2.0', deps: {'pkg-a': '0.1.0'}}),
	];

	// Mock operations where pkg-a has breaking change and pkg-b has patch
	const mock_ops: Changeset_Operations = {
		has_changesets: async () => true,
		read_changesets: async () => [],
		predict_next_version: async (repo) => {
			if (repo.pkg.name === 'pkg-a') {
				return {version: '0.2.0', bump_type: 'minor'}; // breaking
			}
			if (repo.pkg.name === 'pkg-b') {
				return {version: '0.2.1', bump_type: 'patch'}; // non-breaking
			}
			return null;
		},
	};

	const preview = await preview_publishing_plan(repos, undefined, mock_ops);

	// pkg-b should have bump escalation due to breaking dep
	const pkg_b_change = preview.version_changes.find(vc => vc.package_name === 'pkg-b');
	expect(pkg_b_change?.needs_bump_escalation).toBe(true);
	expect(pkg_b_change?.required_bump).toBe('minor');
});

test('generates auto-changesets for dependency updates', async () => {
	const repos: Array<Local_Repo> = [
		create_mock_repo({name: 'pkg-a', version: '0.1.0'}),
		create_mock_repo({name: 'pkg-b', version: '0.2.0', deps: {'pkg-a': '0.1.0'}}),
		create_mock_repo({name: 'pkg-c', version: '0.3.0', devDeps: {'pkg-a': '0.1.0'}}), // devDep only
	];

	// Mock operations where only pkg-a has changesets
	const mock_ops: Changeset_Operations = {
		has_changesets: async (repo) => repo.pkg.name === 'pkg-a',
		read_changesets: async () => [],
		predict_next_version: async (repo) => {
			if (repo.pkg.name === 'pkg-a') {
				return {version: '0.1.1', bump_type: 'patch'};
			}
			return null;
		},
	};

	const preview = await preview_publishing_plan(repos, undefined, mock_ops);

	// pkg-b should get auto-changeset for dependency update
	const pkg_b_change = preview.version_changes.find(vc => vc.package_name === 'pkg-b');
	expect(pkg_b_change?.will_generate_changeset).toBe(true);
	expect(pkg_b_change?.has_changesets).toBe(false);

	// pkg-c should not get auto-changeset (dev dependency only)
	const pkg_c_change = preview.version_changes.find(vc => vc.package_name === 'pkg-c');
	expect(pkg_c_change).toBeUndefined();
});

test('handles circular dev dependencies', async () => {
	const repos: Array<Local_Repo> = [
		create_mock_repo({name: 'pkg-a', version: '0.1.0', devDeps: {'pkg-b': '0.2.0'}}),
		create_mock_repo({name: 'pkg-b', version: '0.2.0', devDeps: {'pkg-a': '0.1.0'}}),
	];

	// Mock operations with no changesets
	const mock_ops: Changeset_Operations = {
		has_changesets: async () => false,
		read_changesets: async () => [],
		predict_next_version: async () => null,
	};

	const preview = await preview_publishing_plan(repos, undefined, mock_ops);

	// Should have warnings for dev cycles
	expect(preview.warnings.some((w) => w.includes('Dev dependency cycle'))).toBe(true);

	// Should still compute publishing order
	expect(preview.publishing_order.length).toBe(2);

	// Should not have errors
	expect(preview.errors.length).toBe(0);
});

test('detects production circular dependencies', async () => {
	const repos: Array<Local_Repo> = [
		create_mock_repo({name: 'pkg-a', version: '0.1.0', deps: {'pkg-b': '0.2.0'}}),
		create_mock_repo({name: 'pkg-b', version: '0.2.0', deps: {'pkg-a': '0.1.0'}}),
	];

	// Mock operations with no changesets
	const mock_ops: Changeset_Operations = {
		has_changesets: async () => false,
		read_changesets: async () => [],
		predict_next_version: async () => null,
	};

	const preview = await preview_publishing_plan(repos, undefined, mock_ops);

	// Should have errors for production cycles
	expect(preview.errors.some((e) => e.includes('Production dependency cycle'))).toBe(true);

	// Should not compute publishing order
	expect(preview.publishing_order.length).toBe(0);
});
