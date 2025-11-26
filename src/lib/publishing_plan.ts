import type {Logger} from '@ryanatkn/belt/log.js';
import {styleText as st} from 'node:util';

import type {LocalRepo} from './local_repo.js';
import type {BumpType} from './semver.js';
import {validate_dependency_graph} from './graph_validation.js';
import {
	needs_update,
	is_breaking_change,
	compare_bump_types,
	calculate_next_version,
} from './version_utils.js';
import type {ChangesetOperations} from './operations.js';
import {default_changeset_operations} from './operations_defaults.js';
import {MAX_ITERATIONS} from './constants.js';

export interface VersionChange {
	package_name: string;
	from: string;
	to: string;
	bump_type: BumpType;
	breaking: boolean;
	has_changesets: boolean;
	will_generate_changeset?: boolean; // True if changeset will be auto-generated for dependency updates
	needs_bump_escalation?: boolean; // True if existing changesets need escalation for dependencies
	existing_bump?: BumpType; // The bump type from existing changesets
	required_bump?: BumpType; // The required bump type from dependencies
}

export interface DependencyUpdate {
	dependent_package: string;
	updated_dependency: string;
	current_version: string;
	new_version: string;
	type: 'dependencies' | 'devDependencies' | 'peerDependencies';
	causes_republish: boolean;
}

export interface PublishingPlan {
	publishing_order: Array<string>;
	version_changes: Array<VersionChange>;
	dependency_updates: Array<DependencyUpdate>;
	breaking_cascades: Map<string, Array<string>>;
	warnings: Array<string>;
	info: Array<string>; // Informational status (not warnings)
	errors: Array<string>;
}

const calculate_dependency_updates = (
	repos: Array<LocalRepo>,
	predicted_versions: Map<string, string>,
	breaking_packages: Set<string>,
): {
	dependency_updates: Array<DependencyUpdate>;
	breaking_cascades: Map<string, Array<string>>;
} => {
	const dependency_updates: Array<DependencyUpdate> = [];
	const breaking_cascades: Map<string, Array<string>> = new Map();

	for (const repo of repos) {
		// Check prod dependencies
		if (repo.dependencies) {
			for (const [dep_name, current_version] of repo.dependencies) {
				const new_version = predicted_versions.get(dep_name);
				if (new_version && needs_update(current_version, new_version)) {
					dependency_updates.push({
						dependent_package: repo.library.name,
						updated_dependency: dep_name,
						current_version,
						new_version,
						type: 'dependencies',
						causes_republish: true,
					});

					if (breaking_packages.has(dep_name)) {
						const cascades = breaking_cascades.get(dep_name) || [];
						if (!cascades.includes(repo.library.name)) {
							cascades.push(repo.library.name);
						}
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
						dependent_package: repo.library.name,
						updated_dependency: dep_name,
						current_version,
						new_version,
						type: 'peerDependencies',
						causes_republish: true,
					});

					if (breaking_packages.has(dep_name)) {
						const cascades = breaking_cascades.get(dep_name) || [];
						if (!cascades.includes(repo.library.name)) {
							cascades.push(repo.library.name);
						}
						breaking_cascades.set(dep_name, cascades);
					}
				}
			}
		}

		// Check dev dependencies
		if (repo.dev_dependencies) {
			for (const [dep_name, current_version] of repo.dev_dependencies) {
				const new_version = predicted_versions.get(dep_name);
				if (new_version && needs_update(current_version, new_version)) {
					dependency_updates.push({
						dependent_package: repo.library.name,
						updated_dependency: dep_name,
						current_version,
						new_version,
						type: 'devDependencies',
						causes_republish: false,
					});
				}
			}
		}
	}

	return {dependency_updates, breaking_cascades};
};

const get_required_bump_for_dependencies = (
	repo: LocalRepo,
	dependency_updates: Array<DependencyUpdate>,
	breaking_packages: Set<string>,
): BumpType | null => {
	// Check if this repo has any prod/peer dependency updates
	const relevant_updates = dependency_updates.filter(
		(update) =>
			update.dependent_package === repo.library.name &&
			(update.type === 'dependencies' || update.type === 'peerDependencies'),
	);

	if (relevant_updates.length === 0) {
		return null;
	}

	// Check if any of these dependencies have breaking changes
	const has_breaking_deps = relevant_updates.some((update) =>
		breaking_packages.has(update.updated_dependency),
	);

	const current_version = repo.library.package_json.version || '0.0.0';
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
 * Generates a publishing plan showing what would happen during publishing.
 * Shows version changes, dependency updates, and breaking change cascades.
 * Uses fixed-point iteration to resolve transitive cascades.
 */
export const generate_publishing_plan = async (
	repos: Array<LocalRepo>,
	log?: Logger,
	ops: ChangesetOperations = default_changeset_operations,
): Promise<PublishingPlan> => {
	log?.info(st('cyan', 'Generating publishing plan...'));

	const warnings: Array<string> = [];
	const info: Array<string> = []; // Informational status (not warnings)
	const errors: Array<string> = [];

	// Build dependency graph and validate
	let publishing_order: Array<string>;
	let production_cycles: Array<Array<string>>;
	let dev_cycles: Array<Array<string>>;

	try {
		const validation = validate_dependency_graph(repos, undefined, {
			throw_on_prod_cycles: false, // Collect errors instead of throwing
			log_cycles: false, // We'll handle our own error collection
			log_order: false, // Plan generation doesn't need to log order
		});
		publishing_order = validation.publishing_order;
		production_cycles = validation.production_cycles;
		dev_cycles = validation.dev_cycles;

		// Add topological sort error if present
		if (validation.sort_error) {
			errors.push(validation.sort_error);
		}
	} catch (error) {
		errors.push(`Failed to validate dependency graph: ${error}`);
		return {
			publishing_order: [],
			version_changes: [],
			dependency_updates: [],
			breaking_cascades: new Map(),
			warnings,
			info,
			errors,
		};
	}

	// Collect cycle errors
	if (production_cycles.length > 0) {
		for (const cycle of production_cycles) {
			errors.push(`Production dependency cycle: ${cycle.join(' → ')}`);
		}
	}

	// Dev cycles are shown in gitops_analyze, not repeated here
	if (dev_cycles.length > 0) {
		info.push(
			`${dev_cycles.length} dev dependency cycle(s) detected (normal, shown in gitops_analyze)`,
		);
	}

	// Initial pass: get all packages with explicit changesets
	const predicted_versions: Map<string, string> = new Map();
	const breaking_packages: Set<string> = new Set();
	const version_changes: Array<VersionChange> = [];

	for (const pkg_name of publishing_order) {
		const repo = repos.find((r) => r.library.name === pkg_name);
		if (!repo) continue;

		// Check for changesets
		const has_result = await ops.has_changesets({repo}); // eslint-disable-line no-await-in-loop

		if (!has_result.ok) {
			errors.push(`Failed to check changesets for ${pkg_name}: ${has_result.message}`);
			continue;
		}

		if (has_result.value) {
			// Predict version from changesets
			const prediction = await ops.predict_next_version({repo, log}); // eslint-disable-line no-await-in-loop

			if (!prediction) {
				// No changesets found - this shouldn't happen since has_changesets returned true
				continue;
			}

			if (!prediction.ok) {
				errors.push(`Failed to predict version for ${pkg_name}: ${prediction.message}`);
				continue;
			}

			{
				const old_version = repo.library.package_json.version || '0.0.0';
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

	// Fixed-point iteration to resolve transitive cascades
	// Loop until no new version changes are discovered
	let iteration = 0;
	let changed = true;

	while (changed && iteration < MAX_ITERATIONS) {
		changed = false;
		iteration++;

		// Recalculate dependency updates based on current predicted versions
		// (breaking_cascades not needed during iteration, only calculated at the end)
		const {dependency_updates} = calculate_dependency_updates(
			repos,
			predicted_versions,
			breaking_packages,
		);

		// Process packages to check for bump escalation and auto-generated changesets
		for (const repo of repos) {
			const pkg_name = repo.library.name;

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
					const old_version = repo.library.package_json.version || '0.0.0';
					const new_version = calculate_next_version(old_version, required_bump);

					// Only mark as changed if version actually changed
					if (existing_entry.to !== new_version) {
						changed = true;

						existing_entry.needs_bump_escalation = true;
						existing_entry.existing_bump = existing_entry.bump_type;
						existing_entry.required_bump = required_bump;
						existing_entry.bump_type = required_bump;
						existing_entry.to = new_version;
						existing_entry.breaking = is_breaking_change(old_version, required_bump);

						// Update predicted versions
						predicted_versions.set(pkg_name, new_version);

						if (existing_entry.breaking) {
							breaking_packages.add(pkg_name);
						}
					}
				}
			} else if (required_bump) {
				// No existing changesets but needs changeset for dependency updates
				const old_version = repo.library.package_json.version || '0.0.0';
				const new_version = calculate_next_version(old_version, required_bump);

				// Check if this is a new version (not already in version_changes)
				if (!predicted_versions.has(pkg_name)) {
					changed = true;

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

					// Update predicted versions
					predicted_versions.set(pkg_name, new_version);
				}
			}
		}
	}

	// Check if we hit iteration limit without convergence
	if (iteration === MAX_ITERATIONS && changed) {
		// Calculate how many packages still need processing
		const pending_packages: Array<string> = [];

		// Recalculate one more time to see what's pending
		const {dependency_updates: pending_updates} = calculate_dependency_updates(
			repos,
			predicted_versions,
			breaking_packages,
		);

		for (const repo of repos) {
			const pkg_name = repo.library.name;
			const required_bump = get_required_bump_for_dependencies(
				repo,
				pending_updates,
				breaking_packages,
			);

			// Check if this package would need processing
			const existing_entry = version_changes.find((vc) => vc.package_name === pkg_name);
			const needs_escalation =
				existing_entry &&
				required_bump &&
				compare_bump_types(required_bump, existing_entry.bump_type) > 0;
			const needs_auto_changeset = !existing_entry && required_bump;

			if (needs_escalation || needs_auto_changeset) {
				pending_packages.push(pkg_name);
			}
		}

		// Add warning with diagnostics
		const pending_count = pending_packages.length;
		const estimated_iterations = Math.ceil(pending_count / 2); // Rough estimate
		warnings.push(
			`Reached maximum iterations (${MAX_ITERATIONS}) without full convergence - ` +
				`${pending_count} package(s) may still need processing: ${pending_packages.join(', ')}. ` +
				`Estimated ${estimated_iterations} more iteration(s) needed.`,
		);
	}

	// Final dependency updates calculation after convergence
	const {dependency_updates, breaking_cascades} = calculate_dependency_updates(
		repos,
		predicted_versions,
		breaking_packages,
	);

	// Identify packages with no changes
	for (const repo of repos) {
		const has_version_change = version_changes.some((vc) => vc.package_name === repo.library.name);
		if (!has_version_change) {
			const has_result = await ops.has_changesets({repo}); // eslint-disable-line no-await-in-loop
			if (has_result.ok && !has_result.value) {
				info.push(repo.library.name);
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

export interface LogPlanOptions {
	verbose?: boolean;
}

/**
 * Formats a dependency update as diff-style output.
 * Shows - old / + new for the dependency version.
 */
const format_dep_diff = (dep_name: string, current: string, next: string): Array<string> => {
	return [
		st('red', `    - "${dep_name}": "${current}"`),
		st('green', `    + "${dep_name}": "${next}"`),
	];
};

/**
 * Gets dependency updates for a specific package, grouped by dependency name.
 */
const get_updates_for_package = (
	pkg_name: string,
	dependency_updates: Array<DependencyUpdate>,
): Map<string, Array<DependencyUpdate>> => {
	const updates: Map<string, Array<DependencyUpdate>> = new Map();
	for (const update of dependency_updates) {
		if (update.dependent_package === pkg_name) {
			const dep_updates = updates.get(update.updated_dependency) || [];
			dep_updates.push(update);
			updates.set(update.updated_dependency, dep_updates);
		}
	}
	return updates;
};

/**
 * Logs a single version change with diff-style dependency updates.
 */
const log_version_change_with_diffs = (
	change: VersionChange,
	index: number,
	total: number,
	dependency_updates: Array<DependencyUpdate>,
	breaking_cascades: Map<string, Array<string>>,
	log: Logger,
	_options: LogPlanOptions,
): void => {
	const breaking_indicator = change.breaking ? st('red', ' BREAKING') : '';
	const position = st('dim', `[${index + 1}/${total}]`);

	// Determine scenario label
	let scenario_label = '';
	if (change.needs_bump_escalation) {
		scenario_label = st('yellow', ` [${change.existing_bump} → ${change.required_bump}]`);
	} else if (change.will_generate_changeset) {
		scenario_label = st('cyan', ' [auto-changeset]');
	}

	// Main version line
	log.info(
		`${position} ${change.package_name}: ${change.from} → ${st('green', change.to)} ` +
			`(${change.bump_type})${scenario_label}${breaking_indicator}`,
	);

	// Show escalation reason
	if (change.needs_bump_escalation) {
		log.info(
			st(
				'dim',
				`      changesets specify ${change.existing_bump}, dependencies require ${change.required_bump}`,
			),
		);
	}

	// Show trigger reason for auto-changesets
	if (change.will_generate_changeset) {
		// Find what triggered this
		const triggers: Array<string> = [];
		for (const [pkg, affected] of breaking_cascades) {
			if (affected.includes(change.package_name)) {
				triggers.push(`${pkg} (BREAKING)`);
			}
		}
		if (triggers.length > 0) {
			log.info(st('dim', `      triggered by: ${triggers.join(', ')}`));
		}
	}

	// Show dependency diffs for this package
	const pkg_updates = get_updates_for_package(change.package_name, dependency_updates);
	if (pkg_updates.size > 0) {
		for (const [dep_name, updates] of pkg_updates) {
			if (updates.length === 0) continue;
			const update = updates[0]!;
			for (const line of format_dep_diff(dep_name, update.current_version, update.new_version)) {
				log.info(line);
			}
		}
	}
};

export const log_publishing_plan = (
	plan: PublishingPlan,
	log: Logger,
	options: LogPlanOptions = {},
): void => {
	const {
		publishing_order,
		version_changes,
		dependency_updates,
		breaking_cascades,
		warnings,
		info,
		errors,
	} = plan;

	// Errors first (blocking issues)
	if (errors.length > 0) {
		log.error(st('red', 'Errors:'));
		for (const error of errors) {
			log.error(`  ${error}`);
		}
		log.info('');
	}

	// Publishing order
	if (publishing_order.length > 0) {
		log.info(st('cyan', 'Publishing Order:'));
		log.info(`  ${publishing_order.join(' → ')}`);
		log.info('');
	}

	// Version changes with diffs
	if (version_changes.length > 0) {
		// Sort by publishing order
		const ordered_changes = [...version_changes].sort((a, b) => {
			const idx_a = publishing_order.indexOf(a.package_name);
			const idx_b = publishing_order.indexOf(b.package_name);
			return idx_a - idx_b;
		});

		// Separate into groups for headers
		const with_changesets = ordered_changes.filter(
			(vc) => vc.has_changesets && !vc.needs_bump_escalation,
		);
		const with_escalation = ordered_changes.filter((vc) => vc.needs_bump_escalation);
		const with_auto_changesets = ordered_changes.filter((vc) => vc.will_generate_changeset);

		// Log each group with diff-style output
		if (with_changesets.length > 0) {
			log.info(st('cyan', 'Version Changes (from changesets):'));
			for (const change of with_changesets) {
				const idx = ordered_changes.indexOf(change);
				log_version_change_with_diffs(
					change,
					idx,
					ordered_changes.length,
					dependency_updates,
					breaking_cascades,
					log,
					options,
				);
			}
			log.info('');
		}

		if (with_escalation.length > 0) {
			log.info(st('yellow', 'Version Changes (bump escalation):'));
			for (const change of with_escalation) {
				const idx = ordered_changes.indexOf(change);
				log_version_change_with_diffs(
					change,
					idx,
					ordered_changes.length,
					dependency_updates,
					breaking_cascades,
					log,
					options,
				);
			}
			log.info('');
		}

		if (with_auto_changesets.length > 0) {
			log.info(st('cyan', 'Version Changes (auto-generated):'));
			for (const change of with_auto_changesets) {
				const idx = ordered_changes.indexOf(change);
				log_version_change_with_diffs(
					change,
					idx,
					ordered_changes.length,
					dependency_updates,
					breaking_cascades,
					log,
					options,
				);
			}
			log.info('');
		}
	} else {
		log.info(st('dim', 'No packages to publish'));
		log.info('');
	}

	// Dependency-only updates (no republish) - packages getting dep updates but not publishing
	const dep_only_packages: Set<string> = new Set();
	for (const update of dependency_updates) {
		const has_version_change = version_changes.some(
			(vc) => vc.package_name === update.dependent_package,
		);
		if (!has_version_change) {
			dep_only_packages.add(update.dependent_package);
		}
	}

	if (dep_only_packages.size > 0) {
		log.info(st('dim', 'Dependency Updates (no republish):'));
		for (const pkg of dep_only_packages) {
			log.info(st('dim', `  ${pkg}:`));
			const pkg_updates = get_updates_for_package(pkg, dependency_updates);
			for (const [dep_name, updates] of pkg_updates) {
				if (updates.length === 0) continue;
				const update = updates[0]!;
				// Use dim styling for non-publishing packages
				log.info(st('dim', `    - "${dep_name}": "${update.current_version}"`));
				log.info(st('dim', `    + "${dep_name}": "${update.new_version}"`));
			}
		}
		log.info('');
	}

	// Warnings
	if (warnings.length > 0) {
		log.warn(st('yellow', 'Warnings:'));
		for (const warning of warnings) {
			log.warn(`  ${warning}`);
		}
		log.info('');
	}

	// Info (packages with no changes)
	if (info.length > 0) {
		log.info(st('dim', `No changes: ${info.join(', ')}`));
		log.info('');
	}

	// Summary
	const major_count = version_changes.filter((vc) => vc.breaking).length;
	const auto_count = version_changes.filter((vc) => vc.will_generate_changeset).length;
	log.info(st('cyan', 'Summary:'));
	log.info(`  ${version_changes.length} packages to publish`);
	if (auto_count > 0) {
		log.info(`  ${auto_count} auto-generated changesets`);
	}
	if (major_count > 0) {
		log.info(st('yellow', `  ${major_count} breaking changes`));
	}
	log.info(`  ${dep_only_packages.size} packages with dependency-only updates`);
	if (warnings.length > 0) {
		log.info(st('yellow', `  ${warnings.length} warnings`));
	}
	if (errors.length > 0) {
		log.info(st('red', `  ${errors.length} errors`));
	}
};
