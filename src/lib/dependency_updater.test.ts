import {describe, it, expect} from 'vitest';
import {join} from 'node:path';

import {
	update_package_json,
	update_all_repos,
	find_updates_needed,
} from '$lib/dependency_updater.js';
import {create_mock_repo, create_mock_git_ops, create_mock_fs_ops} from '$lib/test_helpers.js';
import type {Git_Operations} from '$lib/operations.js';

/**
 * Creates mock git operations that track calls
 */
const create_trackable_git_ops = (): Git_Operations & {
	added_files: Array<string>;
	commits: Array<string>;
} => {
	const added_files: Array<string> = [];
	const commits: Array<string> = [];

	const git_ops = create_mock_git_ops({
		add: async (files) => {
			if (Array.isArray(files)) {
				added_files.push(...files);
			} else {
				added_files.push(files);
			}
		},
		commit: async (message) => {
			commits.push(message);
		},
		add_and_commit: async (files, message) => {
			if (Array.isArray(files)) {
				added_files.push(...files);
			} else {
				added_files.push(files);
			}
			commits.push(message);
		},
	});

	return {
		...git_ops,
		added_files,
		commits,
	};
};

describe('dependency_updater', () => {
	describe('update_package_json', () => {
		it('updates production dependencies with caret prefix', async () => {
			const fs = create_mock_fs_ops();
			const repo = create_mock_repo({
				name: 'test-pkg',
				deps: {
					'dep-a': '^1.0.0',
					'dep-b': '^2.0.0',
				},
			});

			const package_json_path = join(repo.repo_dir, 'package.json');
			fs.set(
				package_json_path,
				JSON.stringify(
					{
						name: 'test-pkg',
						version: '1.0.0',
						dependencies: {
							'dep-a': '^1.0.0',
							'dep-b': '^2.0.0',
						},
					},
					null,
					'\t',
				),
			);

			const updates = new Map([['dep-a', '1.1.0']]);
			const git_ops = create_trackable_git_ops();

			await update_package_json(repo, updates, 'caret', undefined, undefined, git_ops, fs);

			const updated = fs.get(package_json_path);
			expect(updated).toBeDefined();

			const parsed = JSON.parse(updated!);
			expect(parsed.dependencies['dep-a']).toBe('^1.1.0');
			expect(parsed.dependencies['dep-b']).toBe('^2.0.0'); // unchanged
		});

		it('updates devDependencies', async () => {
			const fs = create_mock_fs_ops();
			const repo = create_mock_repo({
				name: 'test-pkg',
				devDeps: {
					'dev-a': '^1.0.0',
				},
			});

			const package_json_path = join(repo.repo_dir, 'package.json');
			fs.set(
				package_json_path,
				JSON.stringify(
					{
						name: 'test-pkg',
						version: '1.0.0',
						devDependencies: {
							'dev-a': '^1.0.0',
						},
					},
					null,
					'\t',
				),
			);

			const updates = new Map([['dev-a', '2.0.0']]);
			const git_ops = create_trackable_git_ops();

			await update_package_json(repo, updates, 'caret', undefined, undefined, git_ops, fs);

			const updated = fs.get(package_json_path);
			const parsed = JSON.parse(updated!);
			expect(parsed.devDependencies['dev-a']).toBe('^2.0.0');
		});

		it('updates peerDependencies', async () => {
			const fs = create_mock_fs_ops();
			const repo = create_mock_repo({
				name: 'test-pkg',
				peerDeps: {
					'peer-a': '^3.0.0',
				},
			});

			const package_json_path = join(repo.repo_dir, 'package.json');
			fs.set(
				package_json_path,
				JSON.stringify(
					{
						name: 'test-pkg',
						version: '1.0.0',
						peerDependencies: {
							'peer-a': '^3.0.0',
						},
					},
					null,
					'\t',
				),
			);

			const updates = new Map([['peer-a', '3.1.0']]);
			const git_ops = create_trackable_git_ops();

			await update_package_json(repo, updates, 'caret', undefined, undefined, git_ops, fs);

			const updated = fs.get(package_json_path);
			const parsed = JSON.parse(updated!);
			expect(parsed.peerDependencies['peer-a']).toBe('^3.1.0');
		});

		it('preserves tilde prefix when using tilde strategy', async () => {
			const fs = create_mock_fs_ops();
			const repo = create_mock_repo({
				name: 'test-pkg',
				deps: {
					'dep-a': '~1.0.0',
				},
			});

			const package_json_path = join(repo.repo_dir, 'package.json');
			fs.set(
				package_json_path,
				JSON.stringify(
					{
						name: 'test-pkg',
						version: '1.0.0',
						dependencies: {
							'dep-a': '~1.0.0',
						},
					},
					null,
					'\t',
				),
			);

			const updates = new Map([['dep-a', '1.1.0']]);
			const git_ops = create_trackable_git_ops();

			await update_package_json(repo, updates, 'tilde', undefined, undefined, git_ops, fs);

			const updated = fs.get(package_json_path);
			const parsed = JSON.parse(updated!);
			expect(parsed.dependencies['dep-a']).toBe('~1.1.0');
		});

		it('uses exact versions with exact strategy', async () => {
			const fs = create_mock_fs_ops();
			const repo = create_mock_repo({
				name: 'test-pkg',
				deps: {
					'dep-a': '1.0.0',
				},
			});

			const package_json_path = join(repo.repo_dir, 'package.json');
			fs.set(
				package_json_path,
				JSON.stringify(
					{
						name: 'test-pkg',
						version: '1.0.0',
						dependencies: {
							'dep-a': '1.0.0',
						},
					},
					null,
					'\t',
				),
			);

			const updates = new Map([['dep-a', '1.1.0']]);
			const git_ops = create_trackable_git_ops();

			await update_package_json(repo, updates, 'exact', undefined, undefined, git_ops, fs);

			const updated = fs.get(package_json_path);
			const parsed = JSON.parse(updated!);
			expect(parsed.dependencies['dep-a']).toBe('1.1.0'); // no prefix
		});

		it('updates multiple dependencies at once', async () => {
			const fs = create_mock_fs_ops();
			const repo = create_mock_repo({
				name: 'test-pkg',
				deps: {
					'dep-a': '^1.0.0',
					'dep-b': '^2.0.0',
				},
				devDeps: {
					'dev-a': '^3.0.0',
				},
			});

			const package_json_path = join(repo.repo_dir, 'package.json');
			fs.set(
				package_json_path,
				JSON.stringify(
					{
						name: 'test-pkg',
						version: '1.0.0',
						dependencies: {
							'dep-a': '^1.0.0',
							'dep-b': '^2.0.0',
						},
						devDependencies: {
							'dev-a': '^3.0.0',
						},
					},
					null,
					'\t',
				),
			);

			const updates = new Map([
				['dep-a', '1.2.0'],
				['dep-b', '2.5.0'],
				['dev-a', '3.1.0'],
			]);
			const git_ops = create_trackable_git_ops();

			await update_package_json(repo, updates, 'caret', undefined, undefined, git_ops, fs);

			const updated = fs.get(package_json_path);
			const parsed = JSON.parse(updated!);
			expect(parsed.dependencies['dep-a']).toBe('^1.2.0');
			expect(parsed.dependencies['dep-b']).toBe('^2.5.0');
			expect(parsed.devDependencies['dev-a']).toBe('^3.1.0');
		});

		it('preserves JSON formatting with tabs', async () => {
			const fs = create_mock_fs_ops();
			const repo = create_mock_repo({
				name: 'test-pkg',
				deps: {'dep-a': '^1.0.0'},
			});

			const package_json_path = join(repo.repo_dir, 'package.json');
			fs.set(
				package_json_path,
				JSON.stringify(
					{
						name: 'test-pkg',
						version: '1.0.0',
						dependencies: {'dep-a': '^1.0.0'},
					},
					null,
					'\t',
				),
			);

			const updates = new Map([['dep-a', '1.1.0']]);
			const git_ops = create_trackable_git_ops();

			await update_package_json(repo, updates, 'caret', undefined, undefined, git_ops, fs);

			const updated = fs.get(package_json_path);
			// Check it has tabs (JSON.stringify uses tabs)
			expect(updated).toContain('\t');
			expect(updated).toMatch(/\n$/); // ends with newline
		});

		it('creates git commit with correct message', async () => {
			const fs = create_mock_fs_ops();
			const repo = create_mock_repo({
				name: 'test-pkg',
				deps: {'dep-a': '^1.0.0'},
			});

			const package_json_path = join(repo.repo_dir, 'package.json');
			fs.set(
				package_json_path,
				JSON.stringify(
					{
						name: 'test-pkg',
						version: '1.0.0',
						dependencies: {'dep-a': '^1.0.0'},
					},
					null,
					'\t',
				),
			);

			const updates = new Map([['dep-a', '1.1.0']]);
			const git_ops = create_trackable_git_ops();

			await update_package_json(repo, updates, 'caret', undefined, undefined, git_ops, fs);

			expect(git_ops.added_files).toContain('package.json');
			expect(git_ops.commits).toHaveLength(1);
			expect(git_ops.commits[0]).toContain('update dependencies after publishing');
		});

		it('does nothing when updates map is empty', async () => {
			const fs = create_mock_fs_ops();
			const repo = create_mock_repo({name: 'test-pkg'});

			const updates = new Map<string, string>();
			const git_ops = create_trackable_git_ops();

			await update_package_json(repo, updates, 'caret', undefined, undefined, git_ops, fs);

			expect(git_ops.added_files).toHaveLength(0);
			expect(git_ops.commits).toHaveLength(0);
		});

		it('does nothing when no matching dependencies found', async () => {
			const fs = create_mock_fs_ops();
			const repo = create_mock_repo({
				name: 'test-pkg',
				deps: {'dep-a': '^1.0.0'},
			});

			const package_json_path = join(repo.repo_dir, 'package.json');
			fs.set(
				package_json_path,
				JSON.stringify(
					{
						name: 'test-pkg',
						version: '1.0.0',
						dependencies: {'dep-a': '^1.0.0'},
					},
					null,
					'\t',
				),
			);

			// Update for a different dependency
			const updates = new Map([['dep-b', '2.0.0']]);
			const git_ops = create_trackable_git_ops();

			await update_package_json(repo, updates, 'caret', undefined, undefined, git_ops, fs);

			expect(git_ops.commits).toHaveLength(0);
		});
	});

	describe('find_updates_needed', () => {
		it('identifies dependencies that need updating', () => {
			const repo = create_mock_repo({
				name: 'test-pkg',
				deps: {
					'dep-a': '^1.0.0',
					'dep-b': '^2.0.0',
				},
			});

			const published = new Map([
				['dep-a', '1.1.0'],
				['dep-b', '2.0.0'], // same version
			]);

			const updates = find_updates_needed(repo, published);

			expect(updates.size).toBe(1);
			expect(updates.get('dep-a')).toEqual({
				current: '^1.0.0',
				new: '1.1.0',
				type: 'dependencies',
			});
		});

		it('identifies devDependencies needing updates', () => {
			const repo = create_mock_repo({
				name: 'test-pkg',
				devDeps: {
					'dev-a': '^3.0.0',
				},
			});

			const published = new Map([['dev-a', '3.5.0']]);

			const updates = find_updates_needed(repo, published);

			expect(updates.size).toBe(1);
			expect(updates.get('dev-a')).toEqual({
				current: '^3.0.0',
				new: '3.5.0',
				type: 'devDependencies',
			});
		});

		it('identifies peerDependencies needing updates', () => {
			const repo = create_mock_repo({
				name: 'test-pkg',
				peerDeps: {
					'peer-a': '^4.0.0',
				},
			});

			const published = new Map([['peer-a', '4.1.0']]);

			const updates = find_updates_needed(repo, published);

			expect(updates.size).toBe(1);
			expect(updates.get('peer-a')).toEqual({
				current: '^4.0.0',
				new: '4.1.0',
				type: 'peerDependencies',
			});
		});

		it('returns empty map when no updates needed', () => {
			const repo = create_mock_repo({
				name: 'test-pkg',
				deps: {
					'dep-a': '^1.0.0',
				},
			});

			const published = new Map([['dep-a', '1.0.0']]);

			const updates = find_updates_needed(repo, published);

			expect(updates.size).toBe(0);
		});

		it('handles multiple dependency types together', () => {
			const repo = create_mock_repo({
				name: 'test-pkg',
				deps: {'dep-a': '^1.0.0'},
				devDeps: {'dev-a': '^2.0.0'},
				peerDeps: {'peer-a': '^3.0.0'},
			});

			const published = new Map([
				['dep-a', '1.1.0'],
				['dev-a', '2.2.0'],
				['peer-a', '3.3.0'],
			]);

			const updates = find_updates_needed(repo, published);

			expect(updates.size).toBe(3);
			expect(updates.get('dep-a')?.type).toBe('dependencies');
			expect(updates.get('dev-a')?.type).toBe('devDependencies');
			expect(updates.get('peer-a')?.type).toBe('peerDependencies');
		});
	});

	describe('update_all_repos', () => {
		it('updates all repos with matching dependencies', async () => {
			const fs = create_mock_fs_ops();

			const repos = [
				create_mock_repo({name: 'pkg-a', deps: {lib: '^1.0.0'}}),
				create_mock_repo({name: 'pkg-b', deps: {lib: '^1.0.0'}}),
			];

			for (const repo of repos) {
				const path = join(repo.repo_dir, 'package.json');
				fs.set(
					path,
					JSON.stringify(
						{
							name: repo.pkg.name,
							version: '1.0.0',
							dependencies: {lib: '^1.0.0'},
						},
						null,
						'\t',
					),
				);
			}

			const published = new Map([['lib', '1.5.0']]);
			const git_ops = create_trackable_git_ops();

			const result = await update_all_repos(repos, published, 'caret', undefined, git_ops, fs);

			expect(result!.updated).toBe(2);
			expect(result!.failed).toHaveLength(0);
		});

		it('skips repos without matching dependencies', async () => {
			const fs = create_mock_fs_ops();

			const repos = [
				create_mock_repo({name: 'pkg-a', deps: {lib: '^1.0.0'}}),
				create_mock_repo({name: 'pkg-b', deps: {other: '^2.0.0'}}),
			];

			for (const repo of repos) {
				const path = join(repo.repo_dir, 'package.json');
				fs.set(
					path,
					JSON.stringify(
						{
							name: repo.pkg.name,
							version: '1.0.0',
							dependencies: repo.pkg.package_json.dependencies,
						},
						null,
						'\t',
					),
				);
			}

			const published = new Map([['lib', '1.5.0']]);
			const git_ops = create_trackable_git_ops();

			const result = await update_all_repos(repos, published, 'caret', undefined, git_ops, fs);

			expect(result!.updated).toBe(1); // only pkg-a
		});

		it('reports failures for problematic repos', async () => {
			const fs = create_mock_fs_ops();

			const repos = [create_mock_repo({name: 'pkg-a', deps: {lib: '^1.0.0'}})];

			// Don't set up the file - will cause read error

			const published = new Map([['lib', '1.5.0']]);
			const git_ops = create_trackable_git_ops();

			const result = await update_all_repos(repos, published, 'caret', undefined, git_ops, fs);

			expect(result!.updated).toBe(0);
			expect(result!.failed).toHaveLength(1);
			expect(result!.failed[0].repo).toBe('pkg-a');
			expect(result!.failed[0].error).toBeInstanceOf(Error);
		});
	});
});
