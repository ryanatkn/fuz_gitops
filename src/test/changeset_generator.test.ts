import {describe, it, expect} from 'vitest';
import {
	generate_changeset_content,
	create_dependency_updates,
	type Dependency_Version_Change,
} from '$lib/changeset_generator.js';
import type {Published_Version} from '$lib/multi_repo_publisher.js';

describe('changeset_generator', () => {
	describe('generate_changeset_content', () => {
		it('generates content for patch updates', () => {
			const updates: Array<Dependency_Version_Change> = [
				{
					package_name: 'lib-a',
					from_version: '1.0.0',
					to_version: '1.0.1',
					bump_type: 'patch',
					breaking: false,
				},
				{
					package_name: 'lib-b',
					from_version: '2.1.0',
					to_version: '2.1.5',
					bump_type: 'patch',
					breaking: false,
				},
			];

			const content = generate_changeset_content('my-package', updates, 'patch');

			expect(content).toContain('"my-package": patch');
			expect(content).toContain('Update dependencies');
			expect(content).toContain('Updated dependencies:');
			expect(content).toContain('- lib-a: 1.0.0 → 1.0.1 (patch)');
			expect(content).toContain('- lib-b: 2.1.0 → 2.1.5 (patch)');
			expect(content).not.toContain('BREAKING');
		});

		it('generates content for breaking changes', () => {
			const updates: Array<Dependency_Version_Change> = [
				{
					package_name: 'lib-breaking',
					from_version: '0.5.0',
					to_version: '0.6.0',
					bump_type: 'minor',
					breaking: true,
				},
			];

			const content = generate_changeset_content('my-package', updates, 'minor');

			expect(content).toContain('"my-package": minor');
			expect(content).toContain('Update dependencies (BREAKING CHANGES)');
			expect(content).toContain('Breaking dependency changes:');
			expect(content).toContain('- lib-breaking: 0.5.0 → 0.6.0 (minor)');
		});

		it('generates content for mixed breaking and regular updates', () => {
			const updates: Array<Dependency_Version_Change> = [
				{
					package_name: 'breaking-lib',
					from_version: '1.0.0',
					to_version: '2.0.0',
					bump_type: 'major',
					breaking: true,
				},
				{
					package_name: 'regular-lib',
					from_version: '1.0.0',
					to_version: '1.0.1',
					bump_type: 'patch',
					breaking: false,
				},
			];

			const content = generate_changeset_content('my-package', updates, 'major');

			expect(content).toContain('"my-package": major');
			expect(content).toContain('Update dependencies (BREAKING CHANGES)');
			expect(content).toContain('Breaking dependency changes:');
			expect(content).toContain('- breaking-lib: 1.0.0 → 2.0.0 (major)');
			expect(content).toContain('Other dependency updates:');
			expect(content).toContain('- regular-lib: 1.0.0 → 1.0.1 (patch)');
		});

		it('handles empty updates array', () => {
			const content = generate_changeset_content('my-package', [], 'patch');

			expect(content).toContain('"my-package": patch');
			expect(content).toContain('Update dependencies');
			expect(content).not.toContain('Updated dependencies:');
			expect(content).not.toContain('Breaking dependency changes:');
		});

		it('generates valid changeset format', () => {
			const updates: Array<Dependency_Version_Change> = [
				{
					package_name: 'lib',
					from_version: '1.0.0',
					to_version: '1.1.0',
					bump_type: 'minor',
					breaking: false,
				},
			];

			const content = generate_changeset_content('test-pkg', updates, 'minor');

			// Should start with frontmatter
			expect(content).toMatch(/^---\n/);
			// Should have package declaration
			expect(content).toContain('"test-pkg": minor');
			// Should close frontmatter
			expect(content).toMatch(/\n---\n/);
			// Should have summary after frontmatter
			expect(content).toMatch(/---\n\nUpdate dependencies/);
		});

		it('escapes package names in frontmatter', () => {
			const updates: Array<Dependency_Version_Change> = [];

			const content = generate_changeset_content('@scope/package-name', updates, 'patch');

			expect(content).toContain('"@scope/package-name": patch');
		});
	});

	describe('create_dependency_updates', () => {
		it('creates updates from published versions', () => {
			const dependencies = new Map([
				['lib-a', '^1.0.0'],
				['lib-b', '~2.0.0'],
				['external-lib', '^3.0.0'], // not published
			]);

			const published_versions: Map<string, Published_Version> = new Map([
				[
					'lib-a',
					{
						name: 'lib-a',
						old_version: '1.0.0',
						new_version: '1.1.0',
						bump_type: 'minor',
						breaking: false,
						commit: 'abc123',
						tag: 'v1.1.0',
					},
				],
				[
					'lib-b',
					{
						name: 'lib-b',
						old_version: '2.0.0',
						new_version: '2.0.1',
						bump_type: 'patch',
						breaking: false,
						commit: 'def456',
						tag: 'v2.0.1',
					},
				],
			]);

			const updates = create_dependency_updates(dependencies, published_versions);

			expect(updates).toHaveLength(2);

			const lib_a_update = updates.find((u) => u.package_name === 'lib-a')!;
			expect(lib_a_update).toEqual({
				package_name: 'lib-a',
				from_version: '1.0.0', // stripped prefix
				to_version: '1.1.0',
				bump_type: 'minor',
				breaking: false,
			});

			const lib_b_update = updates.find((u) => u.package_name === 'lib-b')!;
			expect(lib_b_update).toEqual({
				package_name: 'lib-b',
				from_version: '2.0.0', // stripped prefix
				to_version: '2.0.1',
				bump_type: 'patch',
				breaking: false,
			});

			// Should not include external-lib (not published)
			expect(updates.find((u) => u.package_name === 'external-lib')).toBeUndefined();
		});

		it('handles breaking changes', () => {
			const dependencies = new Map([['breaking-lib', '^0.5.0']]);

			const published_versions: Map<string, Published_Version> = new Map([
				[
					'breaking-lib',
					{
						name: 'breaking-lib',
						old_version: '0.5.0',
						new_version: '0.6.0',
						bump_type: 'minor',
						breaking: true, // Pre-1.0 minor is breaking
						commit: 'abc123',
						tag: 'v0.6.0',
					},
				],
			]);

			const updates = create_dependency_updates(dependencies, published_versions);

			expect(updates).toHaveLength(1);
			expect(updates[0]!.breaking).toBe(true);
		});

		it('strips version prefixes from current versions', () => {
			const dependencies = new Map([
				['caret-lib', '^1.0.0'],
				['tilde-lib', '~1.0.0'],
				['exact-lib', '1.0.0'],
				['gte-lib', '>=1.0.0'],
			]);

			const published_versions: Map<string, Published_Version> = new Map([
				[
					'caret-lib',
					{
						name: 'caret-lib',
						old_version: '1.0.0',
						new_version: '1.1.0',
						bump_type: 'minor',
						breaking: false,
						commit: 'abc123',
						tag: 'v1.1.0',
					},
				],
				[
					'tilde-lib',
					{
						name: 'tilde-lib',
						old_version: '1.0.0',
						new_version: '1.0.1',
						bump_type: 'patch',
						breaking: false,
						commit: 'def456',
						tag: 'v1.0.1',
					},
				],
				[
					'exact-lib',
					{
						name: 'exact-lib',
						old_version: '1.0.0',
						new_version: '1.0.1',
						bump_type: 'patch',
						breaking: false,
						commit: 'ghi789',
						tag: 'v1.0.1',
					},
				],
				[
					'gte-lib',
					{
						name: 'gte-lib',
						old_version: '1.0.0',
						new_version: '1.0.1',
						bump_type: 'patch',
						breaking: false,
						commit: 'jkl012',
						tag: 'v1.0.1',
					},
				],
			]);

			const updates = create_dependency_updates(dependencies, published_versions);

			// All should have stripped version prefixes
			expect(updates.find((u) => u.package_name === 'caret-lib')?.from_version).toBe('1.0.0');
			expect(updates.find((u) => u.package_name === 'tilde-lib')?.from_version).toBe('1.0.0');
			expect(updates.find((u) => u.package_name === 'exact-lib')?.from_version).toBe('1.0.0');
			expect(updates.find((u) => u.package_name === 'gte-lib')?.from_version).toBe('1.0.0'); // >= fully stripped
		});

		it('handles empty inputs', () => {
			const empty_deps = new Map();
			const empty_published = new Map();

			expect(create_dependency_updates(empty_deps, empty_published)).toEqual([]);
		});
	});
});
