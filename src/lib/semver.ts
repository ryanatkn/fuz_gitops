/**
 * Semantic Versioning 2.0.0 utilities
 * @see https://semver.org/
 */

export type Bump_Type = 'major' | 'minor' | 'patch';

export interface Semver {
	major: number;
	minor: number;
	patch: number;
	prerelease?: string;
	build?: string;
}

/**
 * SemVer 2.0.0 validation regex.
 * @see https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
 */
const SEMVER_REGEX =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Validates if a string is a valid semver.
 */
export const semver_validate = (version: string): boolean => SEMVER_REGEX.test(version);

/**
 * Parses a semver version string.
 * Accepts optional 'v' prefix for convenience.
 */
export const semver_parse = (version: string): Semver => {
	// Remove leading 'v' if present (common in git tags)
	const clean = version.replace(/^v/, '');

	// Validate the cleaned version
	if (!SEMVER_REGEX.test(clean)) {
		throw new Error(`Invalid semver: ${version}`);
	}

	const match = clean.match(SEMVER_REGEX)!;
	return {
		major: parseInt(match[1], 10),
		minor: parseInt(match[2], 10),
		patch: parseInt(match[3], 10),
		prerelease: match[4],
		build: match[5],
	};
};

/**
 * Converts a semver object back to string.
 */
export const semver_to_string = (semver: Semver): string => {
	let version = `${semver.major}.${semver.minor}.${semver.patch}`;
	if (semver.prerelease) {
		version += `-${semver.prerelease}`;
	}
	if (semver.build) {
		version += `+${semver.build}`;
	}
	return version;
};

/**
 * Compares two prerelease versions according to SemVer 2.0.0 spec.
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 */
const semver_compare_prerelease = (a: string | undefined, b: string | undefined): number => {
	// Handle missing prereleases
	if (!a && !b) return 0;
	if (!a) return 1; // normal version > prerelease
	if (!b) return -1; // prerelease < normal version

	// Split into identifiers
	const a_parts = a.split('.');
	const b_parts = b.split('.');

	// Compare each identifier
	const min_length = Math.min(a_parts.length, b_parts.length);
	for (let i = 0; i < min_length; i++) {
		const a_part = a_parts[i];
		const b_part = b_parts[i];

		// Check if numeric
		const a_is_numeric = /^\d+$/.test(a_part);
		const b_is_numeric = /^\d+$/.test(b_part);

		if (a_is_numeric && b_is_numeric) {
			// Both numeric - compare numerically
			const a_num = parseInt(a_part, 10);
			const b_num = parseInt(b_part, 10);
			if (a_num !== b_num) {
				return a_num < b_num ? -1 : 1;
			}
		} else if (a_is_numeric && !b_is_numeric) {
			// Numeric identifiers always have lower precedence
			return -1;
		} else if (!a_is_numeric && b_is_numeric) {
			// Numeric identifiers always have lower precedence
			return 1;
		} else {
			// Both alphanumeric - compare lexically
			const cmp = a_part.localeCompare(b_part);
			if (cmp !== 0) {
				return cmp < 0 ? -1 : 1;
			}
		}
	}

	// All identifiers equal - larger set has higher precedence
	if (a_parts.length !== b_parts.length) {
		return a_parts.length < b_parts.length ? -1 : 1;
	}

	return 0;
};

/**
 * Compares two semver versions according to SemVer 2.0.0 spec.
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 * Build metadata is ignored in precedence comparison.
 */
export const semver_compare_versions = (a: string, b: string): number => {
	const v1 = semver_parse(a);
	const v2 = semver_parse(b);

	// Compare major
	if (v1.major !== v2.major) {
		return v1.major < v2.major ? -1 : 1;
	}

	// Compare minor
	if (v1.minor !== v2.minor) {
		return v1.minor < v2.minor ? -1 : 1;
	}

	// Compare patch
	if (v1.patch !== v2.patch) {
		return v1.patch < v2.patch ? -1 : 1;
	}

	// Compare prerelease (build metadata is ignored)
	return semver_compare_prerelease(v1.prerelease, v2.prerelease);
};

/**
 * Bumps a version according to the specified type.
 * Resets lower version numbers per SemVer spec.
 */
export const semver_bump_version = (version: string, type: Bump_Type): string => {
	const semver = semver_parse(version);

	switch (type) {
		case 'major':
			semver.major++;
			semver.minor = 0;
			semver.patch = 0;
			break;
		case 'minor':
			semver.minor++;
			semver.patch = 0;
			break;
		case 'patch':
			semver.patch++;
			break;
	}

	// Remove prerelease and build when bumping
	semver.prerelease = undefined;
	semver.build = undefined;

	return semver_to_string(semver);
};

/**
 * Checks if a version satisfies a range constraint.
 */
export const semver_satisfies_range = (version: string, range: string): boolean => {
	// Handle wildcards
	if (range === '*' || range === 'latest') return true;

	// Handle exact version (with optional = or v prefix)
	const clean_range = range.replace(/^[=v]/, '');
	if (/^\d+\.\d+\.\d+/.test(clean_range)) {
		return version === clean_range;
	}

	const v = semver_parse(version);

	// Handle caret (^) - compatible with version
	if (range.startsWith('^')) {
		const base = semver_parse(range.substring(1));
		if (v.major !== base.major) return false;
		if (v.major === 0) {
			if (v.minor !== base.minor) return false;
			if (base.minor === 0) {
				// 0.0.x - only exact patch matches
				return v.patch === base.patch;
			}
			// 0.x.y where x > 0 - patch can be greater
			return v.patch >= base.patch;
		}
		// Major > 0 - minor and patch can be greater
		return v.minor > base.minor || (v.minor === base.minor && v.patch >= base.patch);
	}

	// Handle tilde (~) - patch-level changes
	if (range.startsWith('~')) {
		const base = semver_parse(range.substring(1));
		return v.major === base.major && v.minor === base.minor && v.patch >= base.patch;
	}

	// Handle greater than or equal (>=)
	if (range.startsWith('>=')) {
		return semver_compare_versions(version, range.substring(2)) >= 0;
	}

	// Handle greater than (>)
	if (range.startsWith('>')) {
		return semver_compare_versions(version, range.substring(1)) > 0;
	}

	// Handle less than or equal (<=)
	if (range.startsWith('<=')) {
		return semver_compare_versions(version, range.substring(2)) <= 0;
	}

	// Handle less than (<)
	if (range.startsWith('<')) {
		return semver_compare_versions(version, range.substring(1)) < 0;
	}

	// Default to false for unrecognized ranges
	return false;
};

/**
 * Resolves a version range to the best matching version from available versions.
 */
export const semver_resolve_version_range = (
	range: string,
	available: Array<string>,
): string | null => {
	if (!available.length) return null;

	// Sort versions in descending order
	const sorted = [...available].sort((a, b) => semver_compare_versions(b, a));

	// Handle wildcards
	if (range === '*' || range === 'latest') {
		return sorted[0];
	}

	// Handle exact version (with optional = or v prefix)
	const clean_range = range.replace(/^[=v]/, '');
	if (/^\d+\.\d+\.\d+/.test(clean_range)) {
		return available.includes(clean_range) ? clean_range : null;
	}

	// Find best matching version
	for (const version of sorted) {
		if (semver_satisfies_range(version, range)) {
			return version;
		}
	}

	// No matching version found
	return null;
};

/**
 * Gets the maximum satisfying version for a range.
 * Similar to resolve_version_range but guarantees the highest matching version.
 */
export const semver_max_satisfying = (versions: Array<string>, range: string): string | null => {
	const satisfying = versions.filter((v) => semver_satisfies_range(v, range));
	if (satisfying.length === 0) return null;
	return satisfying.sort((a, b) => semver_compare_versions(b, a))[0];
};

/**
 * Checks if version is greater than another.
 */
export const semver_gt = (v1: string, v2: string): boolean => semver_compare_versions(v1, v2) > 0;

/**
 * Checks if version is greater than or equal to another.
 */
export const semver_gte = (v1: string, v2: string): boolean => semver_compare_versions(v1, v2) >= 0;

/**
 * Checks if version is less than another.
 */
export const semver_lt = (v1: string, v2: string): boolean => semver_compare_versions(v1, v2) < 0;

/**
 * Checks if version is less than or equal to another.
 */
export const semver_lte = (v1: string, v2: string): boolean => semver_compare_versions(v1, v2) <= 0;

/**
 * Checks if two versions are equal (ignoring build metadata).
 */
export const semver_eq = (v1: string, v2: string): boolean => semver_compare_versions(v1, v2) === 0;

/**
 * Sorts an array of versions in ascending order.
 */
export const semver_sort_versions = (versions: Array<string>): Array<string> => {
	return [...versions].sort(semver_compare_versions);
};

/**
 * Gets the minimum version from an array.
 */
export const semver_min_version = (versions: Array<string>): string | null => {
	if (versions.length === 0) return null;
	return semver_sort_versions(versions)[0];
};

/**
 * Gets the maximum version from an array.
 */
export const semver_max_version = (versions: Array<string>): string | null => {
	if (versions.length === 0) return null;
	return semver_sort_versions(versions)[versions.length - 1];
};
