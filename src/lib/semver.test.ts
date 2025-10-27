import {test, describe, expect} from 'vitest';
import {semver_compare_versions, semver_bump_version} from '$lib/semver.js';

describe('semver_compare_versions', () => {
	describe('basic version comparison', () => {
		test('compares major versions', () => {
			expect(semver_compare_versions('2.0.0', '1.0.0')).toBe(1);
			expect(semver_compare_versions('1.0.0', '2.0.0')).toBe(-1);
			expect(semver_compare_versions('1.0.0', '1.0.0')).toBe(0);
		});

		test('compares minor versions', () => {
			expect(semver_compare_versions('1.2.0', '1.1.0')).toBe(1);
			expect(semver_compare_versions('1.1.0', '1.2.0')).toBe(-1);
			expect(semver_compare_versions('1.1.0', '1.1.0')).toBe(0);
		});

		test('compares patch versions', () => {
			expect(semver_compare_versions('1.1.2', '1.1.1')).toBe(1);
			expect(semver_compare_versions('1.1.1', '1.1.2')).toBe(-1);
			expect(semver_compare_versions('1.1.1', '1.1.1')).toBe(0);
		});
	});

	describe('prerelease comparison', () => {
		test('normal version has higher precedence than prerelease', () => {
			expect(semver_compare_versions('1.0.0', '1.0.0-alpha')).toBe(1);
			expect(semver_compare_versions('1.0.0-alpha', '1.0.0')).toBe(-1);
		});

		test('compares prerelease versions per spec example', () => {
			// Example from spec: 1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-alpha.beta < 1.0.0-beta < 1.0.0-beta.2 < 1.0.0-beta.11 < 1.0.0-rc.1 < 1.0.0
			const ordered = [
				'1.0.0-alpha',
				'1.0.0-alpha.1',
				'1.0.0-alpha.beta',
				'1.0.0-beta',
				'1.0.0-beta.2',
				'1.0.0-beta.11',
				'1.0.0-rc.1',
				'1.0.0',
			];

			for (let i = 0; i < ordered.length - 1; i++) {
				expect(semver_compare_versions(ordered[i]!, ordered[i + 1]!)).toBe(-1);
				expect(semver_compare_versions(ordered[i + 1]!, ordered[i]!)).toBe(1);
			}
		});

		test('numeric identifiers have lower precedence than non-numeric', () => {
			// Per spec: numeric identifiers always have lower precedence than non-numeric
			expect(semver_compare_versions('1.0.0-1', '1.0.0-alpha')).toBe(-1);
			expect(semver_compare_versions('1.0.0-alpha', '1.0.0-1')).toBe(1);
		});

		test('compares numeric prerelease identifiers numerically', () => {
			expect(semver_compare_versions('1.0.0-beta.2', '1.0.0-beta.11')).toBe(-1);
			expect(semver_compare_versions('1.0.0-beta.11', '1.0.0-beta.2')).toBe(1);
		});

		test('larger set of prerelease fields has higher precedence', () => {
			expect(semver_compare_versions('1.0.0-alpha', '1.0.0-alpha.1')).toBe(-1);
			expect(semver_compare_versions('1.0.0-alpha.1', '1.0.0-alpha')).toBe(1);
		});
	});

	describe('build metadata', () => {
		test('ignores build metadata in comparison', () => {
			expect(semver_compare_versions('1.0.0+build1', '1.0.0+build2')).toBe(0);
			expect(semver_compare_versions('1.0.0-alpha+build1', '1.0.0-alpha+build2')).toBe(0);
		});
	});
});

describe('semver_bump_version', () => {
	test('bumps major version', () => {
		expect(semver_bump_version('1.2.3', 'major')).toBe('2.0.0');
		expect(semver_bump_version('0.1.2', 'major')).toBe('1.0.0');
	});

	test('bumps minor version', () => {
		expect(semver_bump_version('1.2.3', 'minor')).toBe('1.3.0');
		expect(semver_bump_version('0.1.2', 'minor')).toBe('0.2.0');
	});

	test('bumps patch version', () => {
		expect(semver_bump_version('1.2.3', 'patch')).toBe('1.2.4');
		expect(semver_bump_version('0.1.2', 'patch')).toBe('0.1.3');
	});

	test('removes prerelease and build metadata', () => {
		expect(semver_bump_version('1.2.3-alpha', 'patch')).toBe('1.2.4');
		expect(semver_bump_version('1.2.3+build', 'patch')).toBe('1.2.4');
		expect(semver_bump_version('1.2.3-alpha+build', 'minor')).toBe('1.3.0');
	});
});
