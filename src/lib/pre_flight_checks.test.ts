import {describe, it, expect} from 'vitest';

import {run_pre_flight_checks} from '$lib/pre_flight_checks.js';
import {create_mock_repo, create_mock_git_ops, create_mock_npm_ops} from '$lib/test_helpers.js';
import type {Local_Repo} from '$lib/local_repo.js';

/* eslint-disable @typescript-eslint/require-await */

describe('pre_flight_checks', () => {
	describe('workspace cleanliness', () => {
		it('passes when all workspaces are clean', async () => {
			const repos = [create_mock_repo({name: 'package-a'}), create_mock_repo({name: 'package-b'})];

			const git_ops = create_mock_git_ops({
				check_clean_workspace: async () => true,
			});
			const npm_ops = create_mock_npm_ops();

			const result = await run_pre_flight_checks(
				repos,
				{skip_changesets: true, check_remote: false},
				git_ops,
				npm_ops,
			);

			expect(result.ok).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('fails when a workspace has uncommitted changes', async () => {
			const repos = [create_mock_repo({name: 'package-a'}), create_mock_repo({name: 'package-b'})];

			let call_count = 0;
			const git_ops = create_mock_git_ops({
				check_clean_workspace: async () => {
					call_count++;
					return call_count !== 2; // Second repo fails
				},
				get_changed_files: async () => ['src/main.ts'], // Simulate changed files
			});
			const npm_ops = create_mock_npm_ops();

			const result = await run_pre_flight_checks(
				repos,
				{skip_changesets: true, check_remote: false},
				git_ops,
				npm_ops,
			);

			expect(result.ok).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('package-b');
			expect(result.errors[0]).toContain('uncommitted changes');
		});

		it('reports all repos with uncommitted changes', async () => {
			const repos = [
				create_mock_repo({name: 'package-a'}),
				create_mock_repo({name: 'package-b'}),
				create_mock_repo({name: 'package-c'}),
			];

			const git_ops = create_mock_git_ops({
				check_clean_workspace: async () => false, // All dirty
				get_changed_files: async () => ['src/file.ts'], // Simulate changed files
			});
			const npm_ops = create_mock_npm_ops();

			const result = await run_pre_flight_checks(
				repos,
				{skip_changesets: true, check_remote: false},
				git_ops,
				npm_ops,
			);

			expect(result.ok).toBe(false);
			expect(result.errors).toHaveLength(3);
		});
	});

	describe('branch validation', () => {
		it('passes when all repos are on the required branch', async () => {
			const repos = [create_mock_repo({name: 'package-a'}), create_mock_repo({name: 'package-b'})];

			const git_ops = create_mock_git_ops({
				current_branch_name: async () => 'main',
			});
			const npm_ops = create_mock_npm_ops();

			const result = await run_pre_flight_checks(
				repos,
				{skip_changesets: true, required_branch: 'main', check_remote: false},
				git_ops,
				npm_ops,
			);

			expect(result.ok).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('fails when a repo is on wrong branch', async () => {
			const repos = [create_mock_repo({name: 'package-a'}), create_mock_repo({name: 'package-b'})];

			let call_count = 0;
			const git_ops = create_mock_git_ops({
				current_branch_name: async () => {
					call_count++;
					return call_count === 1 ? 'main' : 'develop';
				},
			});
			const npm_ops = create_mock_npm_ops();

			const result = await run_pre_flight_checks(
				repos,
				{skip_changesets: true, required_branch: 'main', check_remote: false},
				git_ops,
				npm_ops,
			);

			expect(result.ok).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain('package-b');
			expect(result.errors[0]).toContain("is on branch 'develop'");
			expect(result.errors[0]).toContain("expected 'main'");
		});

		it('supports custom required branch', async () => {
			const repos = [create_mock_repo({name: 'package-a'})];

			const git_ops = create_mock_git_ops({
				current_branch_name: async () => 'release',
			});
			const npm_ops = create_mock_npm_ops();

			const result = await run_pre_flight_checks(
				repos,
				{skip_changesets: true, required_branch: 'release', check_remote: false},
				git_ops,
				npm_ops,
			);

			expect(result.ok).toBe(true);
		});

		it('defaults to main branch if not specified', async () => {
			const repos = [create_mock_repo({name: 'package-a'})];

			const git_ops = create_mock_git_ops({
				current_branch_name: async () => 'develop',
			});

			const npm_ops = create_mock_npm_ops();
			const result = await run_pre_flight_checks(
				repos,
				{skip_changesets: true, check_remote: false},
				git_ops,
				npm_ops,
			);

			expect(result.ok).toBe(false);
			expect(result.errors[0]).toContain("expected 'main'");
		});
	});

	describe('changeset validation', () => {
		it('detects repos with changesets', async () => {
			const repos = [create_mock_repo({name: 'package-a'}), create_mock_repo({name: 'package-b'})];

			const git_ops = create_mock_git_ops();
			const npm_ops = create_mock_npm_ops();

			const result = await run_pre_flight_checks(repos, {check_remote: false}, git_ops, npm_ops);

			// Without actual changesets, all should be marked as without
			expect(result.repos_without_changesets.size).toBe(2);
			expect(result.repos_with_changesets.size).toBe(0);
		});

		it('warns about packages without changesets', async () => {
			const repos = [create_mock_repo({name: 'package-a'}), create_mock_repo({name: 'package-b'})];

			const git_ops = create_mock_git_ops();
			const npm_ops = create_mock_npm_ops();

			const result = await run_pre_flight_checks(repos, {check_remote: false}, git_ops, npm_ops);

			// Filter for changeset-related warnings (may also have npm warnings)
			const changeset_warnings = result.warnings.filter((w) => w.includes('no changesets'));
			expect(changeset_warnings).toHaveLength(2);
		});

		it('skips changeset checks when skip_changesets is true', async () => {
			const repos = [create_mock_repo({name: 'package-a'})];

			const git_ops = create_mock_git_ops();

			const npm_ops = create_mock_npm_ops();
			const result = await run_pre_flight_checks(
				repos,
				{skip_changesets: true, check_remote: false},
				git_ops,
				npm_ops,
			);

			expect(result.repos_with_changesets.size).toBe(0);
			expect(result.repos_without_changesets.size).toBe(0);
			// May have npm warnings, but no changeset warnings
			const changeset_warnings = result.warnings.filter((w) => w.includes('changesets'));
			expect(changeset_warnings).toHaveLength(0);
		});
	});

	describe('npm authentication', () => {
		// Note: The actual npm auth check uses spawn_out('npm', ['whoami'])
		// In real tests, this would need to be mocked at the spawn level
		// For now, we test the integration assuming npm commands work

		it('passes with valid npm authentication', async () => {
			const repos = [create_mock_repo({name: 'package-a'})];
			const git_ops = create_mock_git_ops();

			// This test depends on actual npm being logged in
			// In a real test, we'd mock spawn_out
			const npm_ops = create_mock_npm_ops();
			const result = await run_pre_flight_checks(
				repos,
				{skip_changesets: true, check_remote: false},
				git_ops,
				npm_ops,
			);

			// We can't assert npm auth result without mocking spawn
			// but we can check the structure
			expect(result).toHaveProperty('ok');
			expect(result).toHaveProperty('errors');
		});
	});

	describe('multiple validation failures', () => {
		it('reports all types of failures together', async () => {
			const repos = [
				create_mock_repo({name: 'dirty-wrong-branch'}),
				create_mock_repo({name: 'clean-wrong-branch'}),
			];

			let branch_call = 0;
			let clean_call = 0;

			const git_ops = create_mock_git_ops({
				check_clean_workspace: async () => {
					clean_call++;
					return clean_call !== 1; // First repo is dirty
				},
				get_changed_files: async () => ['src/main.ts'], // Simulate changed files
				current_branch_name: async () => {
					branch_call++;
					return 'develop'; // Both on wrong branch
				},
			});
			const npm_ops = create_mock_npm_ops();

			const result = await run_pre_flight_checks(
				repos,
				{skip_changesets: true, required_branch: 'main', check_remote: false},
				git_ops,
				npm_ops,
			);

			expect(result.ok).toBe(false);
			expect(result.errors.length).toBe(3); // 1 dirty + 2 wrong branches
			expect(clean_call).toBe(2); // Check called for both repos
			expect(branch_call).toBe(2); // Check called for both repos
		});
	});

	describe('empty repo list', () => {
		it('passes with empty repo list', async () => {
			const repos: Array<Local_Repo> = [];
			const git_ops = create_mock_git_ops();

			const npm_ops = create_mock_npm_ops();
			const result = await run_pre_flight_checks(
				repos,
				{skip_changesets: true, check_remote: false},
				git_ops,
				npm_ops,
			);

			expect(result.ok).toBe(true);
			expect(result.errors).toHaveLength(0);
			// May have npm warnings, but that's acceptable for empty list
		});
	});

	describe('result structure', () => {
		it('returns correct result structure', async () => {
			const repos = [create_mock_repo({name: 'package-a'})];
			const git_ops = create_mock_git_ops();

			const npm_ops = create_mock_npm_ops();
			const result = await run_pre_flight_checks(
				repos,
				{skip_changesets: true, check_remote: false},
				git_ops,
				npm_ops,
			);

			expect(result).toHaveProperty('ok');
			expect(result).toHaveProperty('warnings');
			expect(result).toHaveProperty('errors');
			expect(result).toHaveProperty('repos_with_changesets');
			expect(result).toHaveProperty('repos_without_changesets');

			expect(Array.isArray(result.warnings)).toBe(true);
			expect(Array.isArray(result.errors)).toBe(true);
			expect(result.repos_with_changesets instanceof Set).toBe(true);
			expect(result.repos_without_changesets instanceof Set).toBe(true);
		});
	});
});
