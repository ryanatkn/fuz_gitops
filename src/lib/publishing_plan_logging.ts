/**
 * Logging and formatting functions for publishing plans.
 *
 * Extracted from publishing_plan.ts to reduce file size.
 */

import type {Logger} from '@ryanatkn/belt/log.js';
import {styleText as st} from 'node:util';

import type {PublishingPlan, VersionChange, DependencyUpdate} from './publishing_plan.js';
import {log_verbose} from './log_verbose.js';

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

/**
 * Logs a complete publishing plan to the console.
 *
 * Displays errors, publishing order, version changes grouped by scenario,
 * dependency-only updates, warnings, and a summary.
 */
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

	// Verbose output
	if (options.verbose && plan.verbose_data) {
		log_verbose(plan.verbose_data, log);
	}
};
