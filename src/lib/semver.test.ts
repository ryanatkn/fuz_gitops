import {test, describe, expect} from 'vitest';
import {
	semver_parse,
	semver_to_string,
	semver_validate,
	semver_compare_versions,
	semver_bump_version,
	semver_satisfies_range,
	semver_resolve_version_range,
	semver_max_satisfying,
	semver_gt,
	semver_gte,
	semver_lt,
	semver_lte,
	semver_eq,
	semver_sort_versions,
	semver_min_version,
	semver_max_version,
	type Semver,
} from '$lib/semver.js';

// Test helpers
const version = (
	major: number,
	minor: number,
	patch: number,
	prerelease?: string,
	build?: string,
): Semver => ({
	major,
	minor,
	patch,
	prerelease,
	build,
});

const versions = {
	// Basic versions
	'1.0.0': version(1, 0, 0),
	'1.2.3': version(1, 2, 3),
	'2.0.0': version(2, 0, 0),
	// Prerelease versions
	'1.0.0-alpha': version(1, 0, 0, 'alpha'),
	'1.0.0-alpha.1': version(1, 0, 0, 'alpha.1'),
	'1.0.0-alpha.beta': version(1, 0, 0, 'alpha.beta'),
	'1.0.0-beta': version(1, 0, 0, 'beta'),
	'1.0.0-beta.2': version(1, 0, 0, 'beta.2'),
	'1.0.0-beta.11': version(1, 0, 0, 'beta.11'),
	'1.0.0-rc.1': version(1, 0, 0, 'rc.1'),
	// Build metadata
	'1.0.0+20130313144700': version(1, 0, 0, undefined, '20130313144700'),
	'1.0.0-beta+exp.sha.5114f85': version(1, 0, 0, 'beta', 'exp.sha.5114f85'),
};

describe('semver_validate', () => {
	test('validates correct semver strings', () => {
		expect(semver_validate('1.2.3')).toBe(true);
		expect(semver_validate('0.0.0')).toBe(true);
		expect(semver_validate('1.0.0-alpha')).toBe(true);
		expect(semver_validate('1.0.0-alpha.1')).toBe(true);
		expect(semver_validate('1.0.0-0.3.7')).toBe(true);
		expect(semver_validate('1.0.0-x.7.z.92')).toBe(true);
		expect(semver_validate('1.0.0+20130313144700')).toBe(true);
		expect(semver_validate('1.0.0-beta+exp.sha.5114f85')).toBe(true);
	});

	test('rejects invalid semver strings', () => {
		expect(semver_validate('1')).toBe(false);
		expect(semver_validate('1.2')).toBe(false);
		expect(semver_validate('1.2.3.4')).toBe(false);
		expect(semver_validate('01.2.3')).toBe(false); // Leading zero
		expect(semver_validate('1.02.3')).toBe(false); // Leading zero
		expect(semver_validate('1.2.03')).toBe(false); // Leading zero
		expect(semver_validate('1.2.3-')).toBe(false); // Empty prerelease
		expect(semver_validate('1.2.3+')).toBe(false); // Empty build
		expect(semver_validate('1.2.3-01')).toBe(false); // Leading zero in numeric prerelease
	});

	test('does not validate v-prefixed versions', () => {
		expect(semver_validate('v1.2.3')).toBe(false);
	});
});

describe('semver_parse', () => {
	test('parses basic versions', () => {
		expect(semver_parse('1.2.3')).toEqual(versions['1.2.3']);
		expect(semver_parse('0.0.0')).toEqual(version(0, 0, 0));
		expect(semver_parse('10.20.30')).toEqual(version(10, 20, 30));
	});

	test('parses versions with v prefix', () => {
		expect(semver_parse('v1.2.3')).toEqual(versions['1.2.3']);
		expect(semver_parse('v0.0.0')).toEqual(version(0, 0, 0));
	});

	test('parses prerelease versions', () => {
		expect(semver_parse('1.0.0-alpha')).toEqual(versions['1.0.0-alpha']);
		expect(semver_parse('1.0.0-alpha.1')).toEqual(versions['1.0.0-alpha.1']);
		expect(semver_parse('1.0.0-0.3.7')).toEqual(version(1, 0, 0, '0.3.7'));
	});

	test('parses build metadata', () => {
		expect(semver_parse('1.0.0+20130313144700')).toEqual(versions['1.0.0+20130313144700']);
		expect(semver_parse('1.0.0-beta+exp.sha.5114f85')).toEqual(
			versions['1.0.0-beta+exp.sha.5114f85'],
		);
	});

	test('throws on invalid versions', () => {
		expect(() => semver_parse('1.2')).toThrow('Invalid semver');
		expect(() => semver_parse('not.a.version')).toThrow('Invalid semver');
		expect(() => semver_parse('')).toThrow('Invalid semver');
	});
});

describe('semver_to_string', () => {
	test('converts basic versions', () => {
		expect(semver_to_string(versions['1.2.3'])).toBe('1.2.3');
		expect(semver_to_string(version(0, 0, 0))).toBe('0.0.0');
	});

	test('converts prerelease versions', () => {
		expect(semver_to_string(versions['1.0.0-alpha'])).toBe('1.0.0-alpha');
		expect(semver_to_string(versions['1.0.0-alpha.1'])).toBe('1.0.0-alpha.1');
	});

	test('converts build metadata', () => {
		expect(semver_to_string(versions['1.0.0+20130313144700'])).toBe('1.0.0+20130313144700');
		expect(semver_to_string(versions['1.0.0-beta+exp.sha.5114f85'])).toBe(
			'1.0.0-beta+exp.sha.5114f85',
		);
	});
});

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
				expect(semver_compare_versions(ordered[i], ordered[i + 1])).toBe(-1);
				expect(semver_compare_versions(ordered[i + 1], ordered[i])).toBe(1);
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

describe('semver_satisfies_range', () => {
	describe('wildcards', () => {
		test('* matches any version', () => {
			expect(semver_satisfies_range('1.2.3', '*')).toBe(true);
			expect(semver_satisfies_range('0.0.0', '*')).toBe(true);
		});

		test('latest matches any version', () => {
			expect(semver_satisfies_range('1.2.3', 'latest')).toBe(true);
		});
	});

	describe('exact versions', () => {
		test('matches exact versions', () => {
			expect(semver_satisfies_range('1.2.3', '1.2.3')).toBe(true);
			expect(semver_satisfies_range('1.2.3', '1.2.4')).toBe(false);
		});

		test('handles = prefix', () => {
			expect(semver_satisfies_range('1.2.3', '=1.2.3')).toBe(true);
		});

		test('handles v prefix in range', () => {
			expect(semver_satisfies_range('1.2.3', 'v1.2.3')).toBe(true);
		});
	});

	describe('caret ranges (^)', () => {
		test('allows compatible updates for version >= 1.0.0', () => {
			expect(semver_satisfies_range('1.2.3', '^1.2.3')).toBe(true);
			expect(semver_satisfies_range('1.2.4', '^1.2.3')).toBe(true);
			expect(semver_satisfies_range('1.3.0', '^1.2.3')).toBe(true);
			expect(semver_satisfies_range('2.0.0', '^1.2.3')).toBe(false);
		});

		test('handles 0.x versions correctly', () => {
			// ^0.2.3 := >=0.2.3 <0.3.0 (reasonably close to the specified version)
			expect(semver_satisfies_range('0.2.3', '^0.2.3')).toBe(true);
			expect(semver_satisfies_range('0.2.4', '^0.2.3')).toBe(true);
			expect(semver_satisfies_range('0.3.0', '^0.2.3')).toBe(false);
		});

		test('handles 0.0.x versions correctly', () => {
			// ^0.0.3 := >=0.0.3 <0.0.4 (only patch updates)
			expect(semver_satisfies_range('0.0.3', '^0.0.3')).toBe(true);
			expect(semver_satisfies_range('0.0.4', '^0.0.3')).toBe(false);
		});
	});

	describe('tilde ranges (~)', () => {
		test('allows patch updates', () => {
			expect(semver_satisfies_range('1.2.3', '~1.2.3')).toBe(true);
			expect(semver_satisfies_range('1.2.4', '~1.2.3')).toBe(true);
			expect(semver_satisfies_range('1.3.0', '~1.2.3')).toBe(false);
		});
	});

	describe('comparison operators', () => {
		test('>= operator', () => {
			expect(semver_satisfies_range('1.2.3', '>=1.2.3')).toBe(true);
			expect(semver_satisfies_range('1.2.4', '>=1.2.3')).toBe(true);
			expect(semver_satisfies_range('1.2.2', '>=1.2.3')).toBe(false);
		});

		test('> operator', () => {
			expect(semver_satisfies_range('1.2.3', '>1.2.3')).toBe(false);
			expect(semver_satisfies_range('1.2.4', '>1.2.3')).toBe(true);
		});

		test('<= operator', () => {
			expect(semver_satisfies_range('1.2.3', '<=1.2.3')).toBe(true);
			expect(semver_satisfies_range('1.2.2', '<=1.2.3')).toBe(true);
			expect(semver_satisfies_range('1.2.4', '<=1.2.3')).toBe(false);
		});

		test('< operator', () => {
			expect(semver_satisfies_range('1.2.3', '<1.2.3')).toBe(false);
			expect(semver_satisfies_range('1.2.2', '<1.2.3')).toBe(true);
		});
	});
});

describe('semver_resolve_version_range', () => {
	const available = ['1.0.0', '1.1.0', '1.2.0', '1.2.3', '2.0.0', '2.1.0'];

	test('resolves wildcards to latest', () => {
		expect(semver_resolve_version_range('*', available)).toBe('2.1.0');
		expect(semver_resolve_version_range('latest', available)).toBe('2.1.0');
	});

	test('resolves exact versions', () => {
		expect(semver_resolve_version_range('1.2.3', available)).toBe('1.2.3');
		expect(semver_resolve_version_range('1.2.4', available)).toBe(null);
	});

	test('resolves caret ranges', () => {
		expect(semver_resolve_version_range('^1.1.0', available)).toBe('1.2.3');
		expect(semver_resolve_version_range('^2.0.0', available)).toBe('2.1.0');
	});

	test('resolves tilde ranges', () => {
		expect(semver_resolve_version_range('~1.2.0', available)).toBe('1.2.3');
		expect(semver_resolve_version_range('~1.1.0', available)).toBe('1.1.0');
	});

	test('returns null for empty array', () => {
		expect(semver_resolve_version_range('*', [])).toBe(null);
	});
});

describe('semver_max_satisfying', () => {
	const versions = ['1.0.0', '1.1.0', '1.2.0', '1.2.3', '2.0.0'];

	test('finds max satisfying version', () => {
		expect(semver_max_satisfying(versions, '^1.0.0')).toBe('1.2.3');
		expect(semver_max_satisfying(versions, '~1.2.0')).toBe('1.2.3');
		expect(semver_max_satisfying(versions, '>=1.1.0')).toBe('2.0.0');
	});

	test('returns null when no match', () => {
		expect(semver_max_satisfying(versions, '^3.0.0')).toBe(null);
		expect(semver_max_satisfying([], '*')).toBe(null);
	});
});

describe('comparison utilities', () => {
	test('semver_gt', () => {
		expect(semver_gt('2.0.0', '1.0.0')).toBe(true);
		expect(semver_gt('1.0.0', '2.0.0')).toBe(false);
		expect(semver_gt('1.0.0', '1.0.0')).toBe(false);
	});

	test('semver_gte', () => {
		expect(semver_gte('2.0.0', '1.0.0')).toBe(true);
		expect(semver_gte('1.0.0', '1.0.0')).toBe(true);
		expect(semver_gte('1.0.0', '2.0.0')).toBe(false);
	});

	test('semver_lt', () => {
		expect(semver_lt('1.0.0', '2.0.0')).toBe(true);
		expect(semver_lt('2.0.0', '1.0.0')).toBe(false);
		expect(semver_lt('1.0.0', '1.0.0')).toBe(false);
	});

	test('semver_lte', () => {
		expect(semver_lte('1.0.0', '2.0.0')).toBe(true);
		expect(semver_lte('1.0.0', '1.0.0')).toBe(true);
		expect(semver_lte('2.0.0', '1.0.0')).toBe(false);
	});

	test('semver_eq', () => {
		expect(semver_eq('1.0.0', '1.0.0')).toBe(true);
		expect(semver_eq('1.0.0', '2.0.0')).toBe(false);
		expect(semver_eq('1.0.0+build1', '1.0.0+build2')).toBe(true); // Ignores build metadata
	});
});

describe('version array utilities', () => {
	test('semver_sort_versions', () => {
		const unsorted = ['2.0.0', '1.1.0', '1.0.0', '1.2.0', '1.0.0-alpha'];
		const sorted = semver_sort_versions(unsorted);
		expect(sorted).toEqual(['1.0.0-alpha', '1.0.0', '1.1.0', '1.2.0', '2.0.0']);
	});

	test('semver_min_version', () => {
		expect(semver_min_version(['2.0.0', '1.0.0', '1.5.0'])).toBe('1.0.0');
		expect(semver_min_version([])).toBe(null);
	});

	test('semver_max_version', () => {
		expect(semver_max_version(['2.0.0', '1.0.0', '1.5.0'])).toBe('2.0.0');
		expect(semver_max_version([])).toBe(null);
	});
});
