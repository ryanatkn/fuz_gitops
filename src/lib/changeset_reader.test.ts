import {describe, it, expect} from 'vitest';
import {
	parse_changeset_content,
	determine_bump_from_changesets,
	compare_bump_types,
	calculate_next_version,
	type Changeset_Info,
} from './changeset_reader.js';
import type {Bump_Type} from './semver.js';

describe('changeset_reader', () => {
	describe('parse_changeset_content', () => {
		it('parses valid changeset with single package', () => {
			const content = `---
"test-package": patch
---

Fix a small bug in the parser.`;

			const result = parse_changeset_content(content, 'test.md');

			expect(result).toEqual({
				filename: 'test.md',
				packages: [{name: 'test-package', bump_type: 'patch'}],
				summary: 'Fix a small bug in the parser.',
			});
		});

		it('parses changeset with multiple packages', () => {
			const content = `---
"package-a": minor
"@scope/package-b": patch
---

Add new feature to package-a and fix bug in package-b.`;

			const result = parse_changeset_content(content);

			expect(result).toEqual({
				filename: 'changeset.md',
				packages: [
					{name: 'package-a', bump_type: 'minor'},
					{name: '@scope/package-b', bump_type: 'patch'},
				],
				summary: 'Add new feature to package-a and fix bug in package-b.',
			});
		});

		it('handles major version bumps', () => {
			const content = `---
"api-package": major
---

BREAKING: Complete API redesign.`;

			const result = parse_changeset_content(content);

			expect(result?.packages[0]).toEqual({
				name: 'api-package',
				bump_type: 'major',
			});
			expect(result?.summary).toBe('BREAKING: Complete API redesign.');
		});

		it('handles single quotes in package names', () => {
			const content = `---
'single-quoted': patch
---

Test single quotes.`;

			const result = parse_changeset_content(content);

			expect(result?.packages[0].name).toBe('single-quoted');
		});

		it('ignores whitespace variations', () => {
			const content = `---
   "package-a"   :    minor
"package-b":patch
---

   Multiline summary
   with extra whitespace.   `;

			const result = parse_changeset_content(content);

			expect(result?.packages).toEqual([
				{name: 'package-a', bump_type: 'minor'},
				{name: 'package-b', bump_type: 'patch'},
			]);
			expect(result?.summary).toBe('Multiline summary\n   with extra whitespace.');
		});

		it('returns null for invalid frontmatter format', () => {
			const content = `No frontmatter here
Just plain text.`;

			expect(parse_changeset_content(content)).toBeNull();
		});

		it('returns null for empty frontmatter', () => {
			const content = `---
---

Empty changeset with no packages.`;

			expect(parse_changeset_content(content)).toBeNull();
		});

		it('returns null for invalid package format', () => {
			const content = `---
invalid-line-without-colon
---

Invalid format.`;

			expect(parse_changeset_content(content)).toBeNull();
		});

		it('ignores invalid bump types', () => {
			const content = `---
"valid-package": patch
"invalid-package": invalid-bump
"another-valid": minor
---

Mixed valid and invalid.`;

			const result = parse_changeset_content(content);

			expect(result?.packages).toEqual([
				{name: 'valid-package', bump_type: 'patch'},
				{name: 'another-valid', bump_type: 'minor'},
			]);
		});

		it('handles complex package names', () => {
			const content = `---
"@scope/package-name": patch
"org.example.package": minor
"_underscore-package": major
---

Complex package names.`;

			const result = parse_changeset_content(content);

			expect(result?.packages).toEqual([
				{name: '@scope/package-name', bump_type: 'patch'},
				{name: 'org.example.package', bump_type: 'minor'},
				{name: '_underscore-package', bump_type: 'major'},
			]);
		});

		it('handles extra frontmatter fields gracefully', () => {
			const content = `---
"valid-package": patch
author: "John Doe"
# This is a comment
created: 2023-01-01
"another-valid": minor
---

Changeset with extra frontmatter fields.`;

			const result = parse_changeset_content(content);

			expect(result?.packages).toEqual([
				{name: 'valid-package', bump_type: 'patch'},
				{name: 'another-valid', bump_type: 'minor'},
			]);
		});

		it('handles mixed quote styles', () => {
			const content = `---
"double-quoted": patch
'single-quoted': minor
---

Mixed quote styles.`;

			const result = parse_changeset_content(content);

			expect(result?.packages).toEqual([
				{name: 'double-quoted', bump_type: 'patch'},
				{name: 'single-quoted', bump_type: 'minor'},
			]);
		});

		it('handles empty summary', () => {
			const content = `---
"package-name": patch
---
`;

			const result = parse_changeset_content(content);

			expect(result?.packages).toHaveLength(1);
			expect(result?.summary).toBe('');
		});

		it('ignores malformed frontmatter lines', () => {
			const content = `---
"valid-package": patch
malformed-line-without-quotes: patch
"package-with-invalid-bump": invalid-bump-type
"another-valid": minor
missing-colon patch
---

Mix of valid and invalid lines.`;

			const result = parse_changeset_content(content);

			expect(result?.packages).toEqual([
				{name: 'valid-package', bump_type: 'patch'},
				{name: 'another-valid', bump_type: 'minor'},
			]);
		});
	});

	describe('determine_bump_from_changesets', () => {
		const create_changeset = (packages: Array<{name: string; bump_type: Bump_Type}>): Changeset_Info => ({
			filename: 'test.md',
			packages,
			summary: 'Test changeset',
		});

		it('finds bump type for specific package', () => {
			const changesets = [
				create_changeset([{name: 'package-a', bump_type: 'patch'}]),
				create_changeset([{name: 'package-b', bump_type: 'minor'}]),
			];

			expect(determine_bump_from_changesets(changesets, 'package-a')).toBe('patch');
			expect(determine_bump_from_changesets(changesets, 'package-b')).toBe('minor');
		});

		it('returns highest bump type when package appears multiple times', () => {
			const changesets = [
				create_changeset([{name: 'package-a', bump_type: 'patch'}]),
				create_changeset([{name: 'package-a', bump_type: 'minor'}]),
				create_changeset([{name: 'package-a', bump_type: 'patch'}]), // lower bump
			];

			expect(determine_bump_from_changesets(changesets, 'package-a')).toBe('minor');
		});

		it('returns major when it appears anywhere', () => {
			const changesets = [
				create_changeset([{name: 'package-a', bump_type: 'patch'}]),
				create_changeset([{name: 'package-a', bump_type: 'major'}]),
				create_changeset([{name: 'package-a', bump_type: 'minor'}]),
			];

			expect(determine_bump_from_changesets(changesets, 'package-a')).toBe('major');
		});

		it('returns null for non-existent package', () => {
			const changesets = [
				create_changeset([{name: 'package-a', bump_type: 'patch'}]),
			];

			expect(determine_bump_from_changesets(changesets, 'non-existent')).toBeNull();
		});

		it('handles empty changesets array', () => {
			expect(determine_bump_from_changesets([], 'any-package')).toBeNull();
		});
	});

	describe('compare_bump_types', () => {
		it('orders bump types correctly', () => {
			// Major > Minor > Patch
			expect(compare_bump_types('major', 'minor')).toBeGreaterThan(0);
			expect(compare_bump_types('major', 'patch')).toBeGreaterThan(0);
			expect(compare_bump_types('minor', 'patch')).toBeGreaterThan(0);

			// Reverse comparisons
			expect(compare_bump_types('minor', 'major')).toBeLessThan(0);
			expect(compare_bump_types('patch', 'major')).toBeLessThan(0);
			expect(compare_bump_types('patch', 'minor')).toBeLessThan(0);

			// Equal comparisons
			expect(compare_bump_types('major', 'major')).toBe(0);
			expect(compare_bump_types('minor', 'minor')).toBe(0);
			expect(compare_bump_types('patch', 'patch')).toBe(0);
		});
	});

	describe('calculate_next_version', () => {
		describe('patch bumps', () => {
			it('increments patch version', () => {
				expect(calculate_next_version('1.2.3', 'patch')).toBe('1.2.4');
				expect(calculate_next_version('0.5.10', 'patch')).toBe('0.5.11');
				expect(calculate_next_version('10.20.99', 'patch')).toBe('10.20.100');
			});
		});

		describe('minor bumps', () => {
			it('increments minor version and resets patch', () => {
				expect(calculate_next_version('1.2.3', 'minor')).toBe('1.3.0');
				expect(calculate_next_version('0.5.10', 'minor')).toBe('0.6.0');
				expect(calculate_next_version('10.20.99', 'minor')).toBe('10.21.0');
			});
		});

		describe('major bumps', () => {
			it('increments major version and resets minor and patch', () => {
				expect(calculate_next_version('1.2.3', 'major')).toBe('2.0.0');
				expect(calculate_next_version('0.5.10', 'major')).toBe('1.0.0');
				expect(calculate_next_version('10.20.99', 'major')).toBe('11.0.0');
			});
		});

		describe('edge cases', () => {
			it('handles zero versions', () => {
				expect(calculate_next_version('0.0.0', 'patch')).toBe('0.0.1');
				expect(calculate_next_version('0.0.0', 'minor')).toBe('0.1.0');
				expect(calculate_next_version('0.0.0', 'major')).toBe('1.0.0');
			});

			it('throws on invalid version format', () => {
				expect(() => calculate_next_version('invalid', 'patch')).toThrow();
				expect(() => calculate_next_version('1.2', 'patch')).toThrow();
				expect(() => calculate_next_version('1.2.3.4', 'patch')).toThrow();
			});
		});
	});
});