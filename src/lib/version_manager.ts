import type {Local_Repo} from './local_repo.js';
import type {Dependency_Graph} from './dependency_graph.js';
import {determine_bump_from_changesets} from './changeset_helpers.js';
import {semver_bump_version, semver_satisfies_range, type Bump_Type} from './semver.js';

export type {Bump_Type} from './semver.js';

export interface Published_Version {
	name: string;
	old_version: string;
	new_version: string;
	commit: string;
	tag: string;
}

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
		return semver_bump_version(version, type);
	}

	/**
	 * Checks if a version satisfies a constraint.
	 */
	satisfies_constraint(version: string, constraint: string): boolean {
		return semver_satisfies_range(version, constraint);
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
	 * Determines the appropriate version bump based on changesets.
	 * Returns null if no changesets found.
	 */
	async determine_bump_type(repo: Local_Repo): Promise<Bump_Type | null> {
		// Check for changesets first
		const bump = await determine_bump_from_changesets(repo);
		return bump;
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
