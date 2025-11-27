/**
 * Verbose logging functions for publishing plan diagnostic output.
 */

import type {Logger} from '@ryanatkn/belt/log.js';
import {styleText as st} from 'node:util';

import type {
	VerboseData,
	VerboseChangesetDetail,
	VerboseIteration,
	VerbosePropagationChain,
	VerboseGraphSummary,
} from './publishing_plan.js';

const SEPARATOR = '────────────────────────────────────────';

/**
 * Logs all verbose sections in order.
 */
export const log_verbose = (data: VerboseData, log: Logger): void => {
	log.info(''); // Blank line before verbose sections

	log_verbose_changeset_details(data.changeset_details, log);
	log_verbose_iteration_details(data.iterations, data.total_iterations, log);
	log_verbose_propagation_chains(data.propagation_chains, log);
	log_verbose_graph_summary(data.graph_summary, log);
};

/**
 * Logs changeset file details per package.
 */
export const log_verbose_changeset_details = (
	details: Array<VerboseChangesetDetail>,
	log: Logger,
): void => {
	if (details.length === 0) return;

	log.info(st('dim', SEPARATOR));
	log.info(st('dim', 'Changeset Details'));
	log.info(st('dim', SEPARATOR));

	for (const pkg of details) {
		log.info(st('dim', `${pkg.package_name}:`));
		for (const file of pkg.files) {
			const summary_text = file.summary ? `: "${file.summary}"` : '';
			log.info(st('dim', `  .changeset/${file.filename} (${file.bump_type})${summary_text}`));
		}
	}
	log.info('');
};

/**
 * Logs fixed-point iteration details.
 */
export const log_verbose_iteration_details = (
	iterations: Array<VerboseIteration>,
	total: number,
	log: Logger,
): void => {
	if (iterations.length === 0) return;

	log.info(st('dim', SEPARATOR));
	log.info(st('dim', 'Fixed-Point Iteration'));
	log.info(st('dim', SEPARATOR));

	for (const iter of iterations) {
		if (iter.new_changes === 0 && iter.packages.length === 0) {
			log.info(st('dim', `Iteration ${iter.iteration}:`));
			log.info(st('dim', '  No new changes'));
			continue;
		}

		log.info(st('dim', `Iteration ${iter.iteration}:`));
		for (const pkg of iter.packages) {
			const parts: Array<string> = [];

			// Changeset info
			if (pkg.changeset_count > 0) {
				parts.push(`changesets=${pkg.changeset_count}`);
				if (pkg.bump_from_changesets) {
					parts.push(`bump=${pkg.bump_from_changesets}`);
				}
			} else {
				parts.push('no changesets');
			}

			// Required bump from deps
			if (pkg.required_bump && pkg.triggering_dep) {
				parts.push(`required=${pkg.required_bump} (from ${pkg.triggering_dep})`);
			}

			// Action
			if (pkg.action === 'auto_changeset') {
				parts.push('→ auto-generate');
			} else if (pkg.action === 'escalation') {
				parts.push('→ escalation');
			} else if (pkg.action === 'publish') {
				// Regular publish, no special label needed
			}

			// Version
			if (pkg.version_to) {
				const breaking_label = pkg.is_breaking ? ' (BREAKING)' : '';
				parts.push(`→ ${pkg.version_to}${breaking_label}`);
			}

			log.info(st('dim', `  ${pkg.name}: ${parts.join(', ')}`));
		}

		if (iter.new_changes > 0) {
			log.info(st('dim', `  New changes: ${iter.new_changes}`));
		}
	}

	log.info(st('dim', `Converged after ${total} iteration(s)`));
	log.info('');
};

/**
 * Logs breaking change propagation chains as tree structure.
 */
export const log_verbose_propagation_chains = (
	chains: Array<VerbosePropagationChain>,
	log: Logger,
): void => {
	if (chains.length === 0) return;

	log.info(st('dim', SEPARATOR));
	log.info(st('dim', 'Breaking Change Propagation'));
	log.info(st('dim', SEPARATOR));

	for (const chain of chains) {
		log.info(st('dim', `${chain.source} (source)`));

		for (let i = 0; i < chain.chain.length; i++) {
			const item = chain.chain[i]!;
			const indent = '   '.repeat(i);
			const connector = '└─';
			log.info(
				st('dim', `${indent}${connector} ${item.pkg} (${item.dep_type} dep) → ${item.action}`),
			);
		}
	}
	log.info('');
};

/**
 * Logs dependency graph summary.
 */
export const log_verbose_graph_summary = (summary: VerboseGraphSummary, log: Logger): void => {
	log.info(st('dim', SEPARATOR));
	log.info(st('dim', 'Dependency Graph'));
	log.info(st('dim', SEPARATOR));

	log.info(
		st(
			'dim',
			`${summary.package_count} packages, ${summary.internal_dep_count} internal dependencies`,
		),
	);
	log.info('');

	// Production/Peer edges
	if (summary.prod_peer_edges.length > 0) {
		log.info(st('dim', 'Production/Peer:'));
		for (const edge of summary.prod_peer_edges) {
			log.info(st('dim', `  ${edge.from} → ${edge.to} (${edge.type})`));
		}
	} else {
		log.info(st('dim', 'Production/Peer: (none)'));
	}

	// Dev edges
	if (summary.dev_edges.length > 0) {
		log.info(st('dim', 'Dev:'));
		for (const edge of summary.dev_edges) {
			log.info(st('dim', `  ${edge.from} → ${edge.to}`));
		}
	} else {
		log.info(st('dim', 'Dev: (none)'));
	}

	log.info('');
	log.info(
		st('dim', `Cycles: ${summary.prod_cycle_count} production, ${summary.dev_cycle_count} dev`),
	);
	log.info('');
};
