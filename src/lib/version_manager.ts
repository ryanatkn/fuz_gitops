import type {Local_Repo} from './local_repo.js';
import type {Dependency_Graph} from './dependency_graph.js';

export type Bump_Type = 'major' | 'minor' | 'patch';

export interface Published_Version {
	name: string;
	old_version: string;
	new_version: string;
	commit: string;
	tag: string;
}

export interface Semver {
	major: number;
	minor: number;
	patch: number;
	prerelease?: string;
	build?: string;
}

/**
 * Parses a semver version string.
 */
export const parse_semver = (version: string): Semver => {
	// Remove leading 'v' if present
	const clean = version.replace(/^v/, '');

	// Match semver pattern
	const match = clean.match(/^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.+))?$/);
	if (!match) {
		throw new Error(`Invalid semver: ${version}`);
	}

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
 * Compares two semver versions.
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 */
export const compare_versions = (a: string, b: string): number => {
	const v1 = parse_semver(a);
	const v2 = parse_semver(b);

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

	// Compare prerelease
	if (v1.prerelease && !v2.prerelease) return -1;
	if (!v1.prerelease && v2.prerelease) return 1;
	if (v1.prerelease && v2.prerelease) {
		return v1.prerelease.localeCompare(v2.prerelease);
	}

	return 0;
};

/**
 * Resolves a version range to a specific version.
 */
export const resolve_version_range = (range: string, available: Array<string>): string | null => {
	if (!available.length) return null;

	// Sort versions in descending order
	const sorted = [...available].sort((a, b) => compare_versions(b, a));

	// Handle wildcards
	if (range === '*' || range === 'latest') {
		return sorted[0];
	}

	// Handle exact version
	if (/^\d+\.\d+\.\d+/.test(range)) {
		const exact = range.replace(/^[=v]/, '');
		return available.includes(exact) ? exact : null;
	}

	// Handle caret (^) - compatible with version
	if (range.startsWith('^')) {
		const base = parse_semver(range.substring(1));
		for (const version of sorted) {
			const v = parse_semver(version);
			if (
				v.major === base.major &&
				(v.minor > base.minor || (v.minor === base.minor && v.patch >= base.patch))
			) {
				return version;
			}
		}
	}

	// Handle tilde (~) - patch-level changes
	if (range.startsWith('~')) {
		const base = parse_semver(range.substring(1));
		for (const version of sorted) {
			const v = parse_semver(version);
			if (v.major === base.major && v.minor === base.minor && v.patch >= base.patch) {
				return version;
			}
		}
	}

	// Handle greater than or equal (>=)
	if (range.startsWith('>=')) {
		const min = range.substring(2);
		for (const version of sorted) {
			if (compare_versions(version, min) >= 0) {
				return version;
			}
		}
	}

	// Default to latest
	return sorted[0];
};

export class Version_Manager {
	/**
	 * Resolves a wildcard dependency to a specific version.
	 */
	resolve_wildcard(pkg: string, repos: Array<Local_Repo>): string {
		const repo = repos.find((r) => r.pkg.name === pkg);
		if (!repo) {
			throw new Error(`Cannot resolve wildcard for unknown package: ${pkg}`);
		}
		return repo.pkg.package_json.version || '0.0.0';
	}

	/**
	 * Bumps a version according to the specified type.
	 */
	bump_version(version: string, type: Bump_Type): string {
		const semver = parse_semver(version);

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
	}

	/**
	 * Checks if a version satisfies a constraint.
	 */
	satisfies_constraint(version: string, constraint: string): boolean {
		// Handle wildcards
		if (constraint === '*') return true;

		// Handle exact version
		if (/^\d+\.\d+\.\d+/.test(constraint)) {
			return version === constraint.replace(/^[=v]/, '');
		}

		const v = parse_semver(version);

		// Handle caret (^)
		if (constraint.startsWith('^')) {
			const base = parse_semver(constraint.substring(1));
			return (
				v.major === base.major &&
				(v.minor > base.minor || (v.minor === base.minor && v.patch >= base.patch))
			);
		}

		// Handle tilde (~)
		if (constraint.startsWith('~')) {
			const base = parse_semver(constraint.substring(1));
			return v.major === base.major && v.minor === base.minor && v.patch >= base.patch;
		}

		// Handle greater than or equal (>=)
		if (constraint.startsWith('>=')) {
			return compare_versions(version, constraint.substring(2)) >= 0;
		}

		// Default to false
		return false;
	}

	/**
	 * Resolves peer dependencies after packages have been published.
	 */
	resolve_peer_dependencies(
		graph: Dependency_Graph,
		published: Map<string, Published_Version>,
	): Map<string, Map<string, string>> {
		const resolved = new Map<string, Map<string, string>>();

		for (const node of graph.nodes.values()) {
			const pkg_resolved = new Map<string, string>();

			for (const [dep_name, spec] of node.dependencies) {
				if (spec.type === 'peer') {
					// Check if this dependency was published
					const published_version = published.get(dep_name);
					if (published_version) {
						// Use the newly published version
						pkg_resolved.set(dep_name, published_version.new_version);
					} else if (spec.version === '*') {
						// Try to resolve from graph
						const dep_node = graph.get_node(dep_name);
						if (dep_node) {
							pkg_resolved.set(dep_name, dep_node.version);
						}
					}
				}
			}

			if (pkg_resolved.size > 0) {
				resolved.set(node.name, pkg_resolved);
			}
		}

		return resolved;
	}

	/**
	 * Determines the appropriate version bump based on changes.
	 * For now, returns 'patch' as default. Can be extended to analyze changesets.
	 */
	determine_bump_type(repo: Local_Repo): Bump_Type {
		// TODO: Integrate with changesets to determine bump type
		// For now, default to patch
		return 'patch';
	}

	/**
	 * Updates dependency versions in package.json content.
	 */
	update_dependency_versions(
		package_json: any,
		updates: Map<string, string>,
		strategy: 'exact' | 'caret' | 'tilde' = 'caret',
	): any {
		const updated = structuredClone(package_json);

		const prefix = strategy === 'exact' ? '' : strategy === 'caret' ? '^' : '~';

		// Update dependencies
		if (updated.dependencies) {
			for (const [name, version] of updates) {
				if (name in updated.dependencies) {
					updated.dependencies[name] = prefix + version;
				}
			}
		}

		// Update devDependencies
		if (updated.devDependencies) {
			for (const [name, version] of updates) {
				if (name in updated.devDependencies) {
					updated.devDependencies[name] = prefix + version;
				}
			}
		}

		// Update peerDependencies
		if (updated.peerDependencies) {
			for (const [name, version] of updates) {
				if (name in updated.peerDependencies) {
					updated.peerDependencies[name] = prefix + version;
				}
			}
		}

		return updated;
	}
}
