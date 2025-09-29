import type {Logger} from '@ryanatkn/belt/log.js';
import {styleText as st} from 'node:util';

import type {Local_Repo} from './local_repo.js';
import type {Bump_Type} from './semver.js';
import {predict_next_version, calculate_next_version} from './changeset_reader.js';
import {Dependency_Graph_Builder} from './dependency_graph.js';
import {has_changesets} from './changeset_helpers.js';
import {needs_update, is_breaking_change} from './version_utils.js';

export interface Version_Change {
	package_name: string;
	from: string;
	to: string;
	bump_type: Bump_Type;
	breaking: boolean;
	has_changesets: boolean;
	will_generate_changeset?: boolean; // True if changeset will be auto-generated for dependency updates
}

export interface Dependency_Update {
	dependent_package: string;
	updated_dependency: string;
	new_version: string;
	type: 'dependencies' | 'devDependencies' | 'peerDependencies';
	causes_republish: boolean;
}

export interface Publishing_Preview {
	publishing_order: Array<string>;
	version_changes: Array<Version_Change>;
	dependency_updates: Array<Dependency_Update>;
	breaking_cascades: Map<string, Array<string>>;
	warnings: Array<string>;
	errors: Array<string>;
}

/**
 * Generates a preview of what would happen during publishing.
 * Shows version changes, dependency updates, and breaking change cascades.
 */
export const preview_publishing_plan = async (
	repos: Array<Local_Repo>,
	log?: Logger,
): Promise<Publishing_Preview> => {
	log?.info(st('cyan', '📋 Generating publishing preview...\n'));

	const warnings: Array<string> = [];
	const errors: Array<string> = [];
	const version_changes: Array<Version_Change> = [];
	const dependency_updates: Array<Dependency_Update> = [];
	const breaking_cascades = new Map<string, Array<string>>();

	// Build dependency graph
	const builder = new Dependency_Graph_Builder();
	const graph = builder.build_from_repos(repos);

	// Check for cycles
	const {production_cycles, dev_cycles} = graph.detect_cycles_by_type();

	if (production_cycles.length > 0) {
		for (const cycle of production_cycles) {
			errors.push(`Production dependency cycle: ${cycle.join(' → ')}`);
		}
	}

	if (dev_cycles.length > 0) {
		for (const cycle of dev_cycles) {
			warnings.push(`Dev dependency cycle (will be ignored): ${cycle.join(' → ')}`);
		}
	}

	// Compute publishing order
	let publishing_order: Array<string> = [];
	try {
		publishing_order = graph.topological_sort(true); // exclude dev deps
	} catch (error) {
		errors.push(`Failed to compute publishing order: ${error}`);
		return {
			publishing_order: [],
			version_changes,
			dependency_updates,
			breaking_cascades,
			warnings,
			errors,
		};
	}

	// Predict version changes
	const predicted_versions = new Map<string, string>();
	const breaking_packages = new Set<string>();
	const packages_needing_updates = new Set<string>(); // Track packages that need dependency updates

	for (const pkg_name of publishing_order) {
		const repo = repos.find((r) => r.pkg.name === pkg_name);
		if (!repo) continue;

		// Check for changesets
		const has = await has_changesets(repo);

		if (has) {
			// Predict version from changesets
			const prediction = await predict_next_version(repo, log);

			if (prediction) {
				const old_version = repo.pkg.package_json.version || '0.0.0';
				const is_breaking = is_breaking_change(old_version, prediction.bump_type);

				predicted_versions.set(pkg_name, prediction.version);

				if (is_breaking) {
					breaking_packages.add(pkg_name);
				}

				version_changes.push({
					package_name: pkg_name,
					from: old_version,
					to: prediction.version,
					bump_type: prediction.bump_type,
					breaking: is_breaking,
					has_changesets: true,
				});
			}
		}
	}

	// Calculate dependency updates
	for (const repo of repos) {
		let has_prod_or_peer_updates = false;

		// Check prod dependencies
		if (repo.dependencies) {
			for (const [dep_name, current_version] of repo.dependencies) {
				const new_version = predicted_versions.get(dep_name);
				if (new_version && needs_update(current_version, new_version)) {
					dependency_updates.push({
						dependent_package: repo.pkg.name,
						updated_dependency: dep_name,
						new_version,
						type: 'dependencies',
						causes_republish: true,
					});
					has_prod_or_peer_updates = true;

					// Track breaking cascades
					if (breaking_packages.has(dep_name)) {
						const cascades = breaking_cascades.get(dep_name) || [];
						cascades.push(repo.pkg.name);
						breaking_cascades.set(dep_name, cascades);
					}
				}
			}
		}

		// Check peer dependencies
		if (repo.peer_dependencies) {
			for (const [dep_name, current_version] of repo.peer_dependencies) {
				const new_version = predicted_versions.get(dep_name);
				if (new_version && needs_update(current_version, new_version)) {
					dependency_updates.push({
						dependent_package: repo.pkg.name,
						updated_dependency: dep_name,
						new_version,
						type: 'peerDependencies',
						causes_republish: true,
					});
					has_prod_or_peer_updates = true;

					// Peer dependencies also cascade breaking changes
					if (breaking_packages.has(dep_name)) {
						const cascades = breaking_cascades.get(dep_name) || [];
						cascades.push(repo.pkg.name);
						breaking_cascades.set(dep_name, cascades);
					}
				}
			}
		}

		// Track packages that would get auto-generated changesets
		if (has_prod_or_peer_updates) {
			packages_needing_updates.add(repo.pkg.name);
		}

		// Check dev dependencies
		if (repo.dev_dependencies) {
			for (const [dep_name, current_version] of repo.dev_dependencies) {
				const new_version = predicted_versions.get(dep_name);
				if (new_version && needs_update(current_version, new_version)) {
					dependency_updates.push({
						dependent_package: repo.pkg.name,
						updated_dependency: dep_name,
						new_version,
						type: 'devDependencies',
						causes_republish: false,
					});
				}
			}
		}
	}

	// Add packages that would get auto-generated changesets
	for (const repo of repos) {
		const pkg_name = repo.pkg.name;

		// Skip if already in version_changes (has changesets)
		if (version_changes.some(vc => vc.package_name === pkg_name)) {
			continue;
		}

		// Check if this package would get an auto-generated changeset
		if (packages_needing_updates.has(pkg_name)) {
			const old_version = repo.pkg.package_json.version || '0.0.0';
			// Auto-generated changesets would create patch bumps by default
			// unless there are breaking changes in dependencies
			const has_breaking_deps = Array.from(breaking_packages).some(breaking_pkg => {
				return dependency_updates.some(
					update => update.dependent_package === pkg_name &&
					update.updated_dependency === breaking_pkg &&
					(update.type === 'dependencies' || update.type === 'peerDependencies')
				);
			});

			const bump_type: Bump_Type = has_breaking_deps ? 'minor' : 'patch';
			const new_version = calculate_next_version(old_version, bump_type);

			version_changes.push({
				package_name: pkg_name,
				from: old_version,
				to: new_version,
				bump_type,
				breaking: false,
				has_changesets: false,
				will_generate_changeset: true,
			});
		} else {
			// No changesets and no dependency updates
			const has = await has_changesets(repo);
			if (!has) {
				warnings.push(`${repo.pkg.name} has no changesets and no dependency updates - won't be published`);
			}
		}
	}

	return {
		publishing_order,
		version_changes,
		dependency_updates,
		breaking_cascades,
		warnings,
		errors,
	};
};

/**
 * Formats and logs the publishing preview for user review.
 */
export const log_publishing_preview = (
	preview: Publishing_Preview,
	log: Logger,
): void => {
	const {
		publishing_order,
		version_changes,
		dependency_updates,
		breaking_cascades,
		warnings,
		errors,
	} = preview;

	// Errors
	if (errors.length > 0) {
		log.error(st('red', '\n❌ Errors found:\n'));
		for (const error of errors) {
			log.error(`  • ${error}`);
		}
	}

	// Publishing order
	if (publishing_order.length > 0) {
		log.info(st('cyan', '\n📦 Publishing Order:\n'));
		log.info(`  ${publishing_order.join(' → ')}`);
	}

	// Version changes
	if (version_changes.length > 0) {
		// Separate packages by how they will be published
		const with_changesets = version_changes.filter(vc => vc.has_changesets);
		const with_auto_changesets = version_changes.filter(vc => vc.will_generate_changeset);

		if (with_changesets.length > 0) {
			log.info(st('cyan', '\n🔢 Version Changes (from changesets):\n'));
			for (const change of with_changesets) {
				const breaking_indicator = change.breaking ? ' 💥' : '';
				log.info(
					`  • ${change.package_name}: ${change.from} → ${st('green', change.to)} ` +
					`(${change.bump_type})${breaking_indicator}`,
				);
			}
		}

		if (with_auto_changesets.length > 0) {
			log.info(st('cyan', '\n🔄 Version Changes (auto-generated for dependency updates):\n'));
			for (const change of with_auto_changesets) {
				log.info(
					`  • ${change.package_name}: ${change.from} → ${st('green', change.to)} ` +
					`(${change.bump_type}) [auto-changeset]`,
				);
			}
		}
	} else {
		log.info(st('yellow', '\n⚠️  No packages to publish'));
	}

	// Breaking cascades
	if (breaking_cascades.size > 0) {
		log.info(st('red', '\n💥 Breaking Change Cascades:\n'));
		for (const [pkg, affected] of breaking_cascades) {
			log.info(`  • ${pkg} affects: ${affected.join(', ')}`);
		}
	}

	// Dependency updates
	if (dependency_updates.length > 0) {
		// Group by package
		const updates_by_package = new Map<string, Array<Dependency_Update>>();
		for (const update of dependency_updates) {
			const updates = updates_by_package.get(update.dependent_package) || [];
			updates.push(update);
			updates_by_package.set(update.dependent_package, updates);
		}

		log.info(st('cyan', '\n🔄 Dependency Updates:\n'));
		for (const [pkg, updates] of updates_by_package) {
			log.info(`  ${pkg}:`);
			for (const update of updates) {
				const type_indicator =
					update.type === 'dependencies' ? '📦' :
					update.type === 'peerDependencies' ? '👥' : '🛠️';
				const republish = update.causes_republish ? ' (triggers auto-changeset)' : '';
				log.info(
					`    ${type_indicator} ${update.updated_dependency} → ${update.new_version}${republish}`,
				);
			}
		}
	}

	// Warnings
	if (warnings.length > 0) {
		log.warn(st('yellow', '\n⚠️  Warnings:\n'));
		for (const warning of warnings) {
			log.warn(`  • ${warning}`);
		}
	}

	// Summary
	log.info(st('cyan', '\n📊 Summary:\n'));
	log.info(`  • ${version_changes.length} packages to publish`);
	log.info(`  • ${dependency_updates.length} dependency updates`);
	log.info(`  • ${breaking_cascades.size} packages with breaking changes`);
	log.info(`  • ${warnings.length} warnings`);
	log.info(`  • ${errors.length} errors`);
};