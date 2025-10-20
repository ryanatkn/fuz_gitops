import type {Logger} from '@ryanatkn/belt/log.js';
import {Task_Error} from '@ryanatkn/gro';
import {styleText as st} from 'node:util';

import {Dependency_Graph, Dependency_Graph_Builder} from '$lib/dependency_graph.js';
import type {Local_Repo} from '$lib/local_repo.js';

export interface Graph_Validation_Result {
	graph: Dependency_Graph;
	publishing_order: Array<string>;
	production_cycles: Array<Array<string>>;
	dev_cycles: Array<Array<string>>;
	sort_error?: string; // Error message if topological sort failed
}

/**
 * Shared utility for building dependency graph, detecting cycles, and computing publishing order.
 * This centralizes logic that was duplicated across multi_repo_publisher, publishing_preview, and gitops_analyze.
 *
 * @param repos - Array of local repositories to analyze
 * @param log - Optional logger for output
 * @param options - Configuration options
 * @param options.throw_on_prod_cycles - Whether to throw an error if production cycles are detected (default: true)
 * @param options.log_cycles - Whether to log cycle information (default: true)
 * @param options.log_order - Whether to log publishing order (default: true)
 * @returns Graph validation result with graph, publishing order, and detected cycles
 * @throws {Task_Error} If production cycles detected and throw_on_prod_cycles is true
 */
export const validate_dependency_graph = (
	repos: Array<Local_Repo>,
	log?: Logger,
	options: {
		throw_on_prod_cycles?: boolean;
		log_cycles?: boolean;
		log_order?: boolean;
	} = {},
): Graph_Validation_Result => {
	const {
		throw_on_prod_cycles = true,
		log_cycles = true,
		log_order = true,
	} = options;

	// Build dependency graph
	log?.info('📊 Analyzing dependencies...');
	const builder = new Dependency_Graph_Builder();
	const graph = builder.build_from_repos(repos);

	// Check for cycles
	const {production_cycles, dev_cycles} = graph.detect_cycles_by_type();

	// Log production cycles
	if (production_cycles.length > 0 && log_cycles) {
		log?.error(st('red', '❌ Production/peer dependency cycles detected:'));
		for (const cycle of production_cycles) {
			log?.error(`  ${cycle.join(' → ')}`);
		}

		if (throw_on_prod_cycles) {
			throw new Task_Error(
				`Cannot publish with production/peer dependency cycles. ` +
					`These must be resolved before publishing.`,
			);
		}
	}

	// Log dev cycles (informational, not an error)
	if (dev_cycles.length > 0 && log_cycles) {
		log?.info(st('dim', 'ℹ️  Dev dependency cycles detected (this is normal):'));
		for (const cycle of dev_cycles) {
			log?.info(st('dim', `  ${cycle.join(' → ')}`));
		}
	}

	// Compute publishing order
	let publishing_order: Array<string>;
	let sort_error: string | undefined;
	try {
		publishing_order = graph.topological_sort(true); // exclude dev deps to break cycles
		if (log_order && publishing_order.length > 0) {
			log?.info(`  Publishing order: ${publishing_order.join(' → ')}`);
		}
	} catch (error) {
		// Capture the sort error message for callers to report
		sort_error = 'Failed to compute publishing order: ' + error;

		// If topological sort fails (due to cycles), return empty array
		// Only throw if production cycles exist AND throw_on_prod_cycles is true
		if (production_cycles.length > 0 && throw_on_prod_cycles) {
			throw new Task_Error(sort_error);
		}
		// Otherwise, return empty publishing order (let caller handle it)
		publishing_order = [];
	}

	return {
		graph,
		publishing_order,
		production_cycles,
		dev_cycles,
		sort_error,
	};
};
