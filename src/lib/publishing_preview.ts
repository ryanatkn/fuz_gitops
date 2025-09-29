import type {Logger} from '@ryanatkn/belt/log.js';
import {styleText as st} from 'node:util';

import type {Local_Repo} from '$lib/local_repo.js';
import type {Bump_Type} from '$lib/semver.js';
import {Dependency_Graph_Builder} from '$lib/dependency_graph.js';
import {
	needs_update,
	is_breaking_change,
	compare_bump_types,
	calculate_next_version,
} from '$lib/version_utils.js';
import type {Changeset_Operations} from '$lib/operations.js';
import {default_changeset_operations} from '$lib/default_operations.js';

export interface Version_Change {
	package_name: string;
	from: string;
	to: string;
	bump_type: Bump_Type;
	breaking: boolean;
	has_changesets: boolean;
	will_generate_changeset?: boolean; // True if changeset will be auto-generated for dependency updates
	needs_bump_escalation?: boolean; // True if existing changesets need escalation for dependencies
	existing_bump?: Bump_Type; // The bump type from existing changesets
	required_bump?: Bump_Type; // The required bump type from dependencies
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
	info: Array<string>; // Informational status (not warnings)
	errors: Array<string>;
}

/**
 * Determines the required bump type based on dependency updates.
 * Returns null if no bump is required, or the bump type needed.
 */
const get_required_bump_for_dependencies = (
	repo: Local_Repo,
	dependency_updates: Array<Dependency_Update>,
	breaking_packages: Set<string>,
): Bump_Type | null => {
	// Check if this repo has any prod/peer dependency updates
	const relevant_updates = dependency_updates.filter(
		(update) =>
			update.dependent_package === repo.pkg.name &&
			(update.type === 'dependencies' || update.type === 'peerDependencies'),
	);

	if (relevant_updates.length === 0) {
		return null;
	}

	// Check if any of these dependencies have breaking changes
	const has_breaking_deps = relevant_updates.some((update) =>
		breaking_packages.has(update.updated_dependency),
	);

	const current_version = repo.pkg.package_json.version || '0.0.0';
	const [major] = current_version.split('.').map(Number);
	const is_pre_1_0 = major === 0;

	if (has_breaking_deps) {
		// Breaking changes propagate
		// Pre-1.0: use minor for breaking changes
		// 1.0+: use major for breaking changes
		return is_pre_1_0 ? 'minor' : 'major';
	}

	// For non-breaking dependency updates, use patch
	return 'patch';
};

/**
 * Generates a preview of what would happen during publishing.
 * Shows version changes, dependency updates, and breaking change cascades.
 */
export const preview_publishing_plan = async (
	repos: Array<Local_Repo>,
	log?: Logger,
	ops: Changeset_Operations = default_changeset_operations,
): Promise<Publishing_Preview> => {
	log?.info(st('cyan', '📋 Generating publishing preview...\n'));

	const warnings: Array<string> = [];
	const info: Array<string> = []; // Informational status (not warnings)
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
			info,
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
		const has = await ops.has_changesets(repo);

		if (has) {
			// Predict version from changesets
			const prediction = await ops.predict_next_version(repo, log);

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

	// Process packages to check for bump escalation and auto-generated changesets
	for (const repo of repos) {
		const pkg_name = repo.pkg.name;

		// Get required bump from dependencies
		const required_bump = get_required_bump_for_dependencies(
			repo,
			dependency_updates,
			breaking_packages,
		);

		// Check if already in version_changes (has changesets)
		const existing_entry = version_changes.find((vc) => vc.package_name === pkg_name);

		if (existing_entry) {
			// Package has changesets - check if it needs bump escalation
			if (required_bump && compare_bump_types(required_bump, existing_entry.bump_type) > 0) {
				// Dependencies require a larger bump than existing changesets provide
				existing_entry.needs_bump_escalation = true;
				existing_entry.existing_bump = existing_entry.bump_type;
				existing_entry.required_bump = required_bump;
				// Update the bump type to the required one
				existing_entry.bump_type = required_bump;
				// Recalculate version with the escalated bump
				const old_version = repo.pkg.package_json.version || '0.0.0';
				existing_entry.to = calculate_next_version(old_version, required_bump);
				// Update breaking flag if escalated to major/minor in pre-1.0
				existing_entry.breaking = is_breaking_change(old_version, required_bump);

				if (existing_entry.breaking) {
					breaking_packages.add(pkg_name);
				}
			}
		} else if (required_bump) {
			// No existing changesets but needs changeset for dependency updates
			const old_version = repo.pkg.package_json.version || '0.0.0';
			const new_version = calculate_next_version(old_version, required_bump);
			const is_breaking = is_breaking_change(old_version, required_bump);

			if (is_breaking) {
				breaking_packages.add(pkg_name);
			}

			version_changes.push({
				package_name: pkg_name,
				from: old_version,
				to: new_version,
				bump_type: required_bump,
				breaking: is_breaking,
				has_changesets: false,
				will_generate_changeset: true,
			});

			// Also update predicted versions for cascade analysis
			predicted_versions.set(pkg_name, new_version);
		} else {
			// No changesets and no dependency updates - informational only
			const has = await ops.has_changesets(repo);
			if (!has) {
				info.push(`${repo.pkg.name}`);
			}
		}
	}

	return {
		publishing_order,
		version_changes,
		dependency_updates,
		breaking_cascades,
		warnings,
		info,
		errors,
	};
};

/**
 * Formats and logs the publishing preview for user review.
 */
export const log_publishing_preview = (preview: Publishing_Preview, log: Logger): void => {
	const {
		publishing_order,
		version_changes,
		dependency_updates,
		breaking_cascades,
		warnings,
		info,
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
		const with_changesets = version_changes.filter(
			(vc) => vc.has_changesets && !vc.needs_bump_escalation,
		);
		const with_escalation = version_changes.filter((vc) => vc.needs_bump_escalation);
		const with_auto_changesets = version_changes.filter((vc) => vc.will_generate_changeset);

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

		if (with_escalation.length > 0) {
			log.info(st('yellow', '\n⬆️  Version Changes (bump escalation required):\n'));
			for (const change of with_escalation) {
				const breaking_indicator = change.breaking ? ' 💥' : '';
				log.info(
					`  • ${change.package_name}: ${change.from} → ${st('green', change.to)} ` +
						`(${change.existing_bump} → ${change.required_bump})${breaking_indicator}`,
				);
				log.info(
					st(
						'dim',
						`    Changesets specify ${change.existing_bump}, but dependencies require ${change.required_bump}`,
					),
				);
			}
		}

		if (with_auto_changesets.length > 0) {
			log.info(st('cyan', '\n🔄 Version Changes (auto-generated for dependency updates):\n'));
			for (const change of with_auto_changesets) {
				const breaking_indicator = change.breaking ? ' 💥' : '';
				log.info(
					`  • ${change.package_name}: ${change.from} → ${st('green', change.to)} ` +
						`(${change.bump_type}) [auto-changeset]${breaking_indicator}`,
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
					update.type === 'dependencies' ? '📦' : update.type === 'peerDependencies' ? '👥' : '🛠️';
				// Only show "triggers auto-changeset" for packages that will get auto-generated changesets
				const existing_change = version_changes.find(
					(vc) => vc.package_name === update.dependent_package,
				);
				const needs_auto_changeset =
					update.causes_republish && existing_change?.will_generate_changeset === true;
				const republish = needs_auto_changeset ? ' (triggers auto-changeset)' : '';
				log.info(
					`    ${type_indicator} ${update.updated_dependency} → ${update.new_version}${republish}`,
				);
			}
		}
	}

	// Warnings (actual issues requiring attention)
	if (warnings.length > 0) {
		log.warn(st('yellow', '\n⚠️  Warnings:\n'));
		for (const warning of warnings) {
			log.warn(`  • ${warning}`);
		}
	}

	// Info (packages with no changes to publish - normal status)
	if (info.length > 0) {
		log.info(st('dim', '\nℹ️  No changes to publish:\n'));
		for (const pkg of info) {
			log.info(st('dim', `  • ${pkg}`));
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
