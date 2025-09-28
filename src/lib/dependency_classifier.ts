import type {Dependency_Graph, Dependency_Spec} from './dependency_graph.js';

export interface Classified_Dependencies {
	/**
	 * Dependencies that affect publishing order (prod and peer).
	 */
	publishing_deps: Set<string>;

	/**
	 * Dependencies that need immediate updates (peer and prod).
	 */
	propagation_deps: Set<string>;

	/**
	 * Dependencies that can wait until all packages are published (dev).
	 */
	reconciliation_deps: Set<string>;

	/**
	 * Edges that cause cycles (typically dev dependencies).
	 */
	cycle_causing_edges: Array<{from: string; to: string; type: Dependency_Spec['type']}>;
}

export interface Dependency_Update_Plan {
	package: string;
	from_version: string;
	to_version: string;
	type: 'peer' | 'prod' | 'dev';
	required_by: Set<string>;
	blocking: boolean;
}

export class Dependency_Classifier {
	/**
	 * Classifies dependencies by their update phase.
	 */
	classify(graph: Dependency_Graph): Classified_Dependencies {
		const publishing_deps = new Set<string>();
		const propagation_deps = new Set<string>();
		const reconciliation_deps = new Set<string>();
		const cycle_causing_edges: Array<{from: string; to: string; type: Dependency_Spec['type']}> =
			[];

		// Analyze each node's dependencies
		for (const node of graph.nodes.values()) {
			for (const [dep_name, spec] of node.dependencies) {
				// Only consider internal dependencies
				if (!graph.nodes.has(dep_name)) continue;

				const edge_key = `${node.name}->${dep_name}`;

				switch (spec.type) {
					case 'peer':
					case 'prod':
						// Peer and prod dependencies affect publishing order and need immediate updates
						publishing_deps.add(edge_key);
						propagation_deps.add(edge_key);
						break;
					case 'dev':
						// Dev dependencies only need updates after everything is published
						reconciliation_deps.add(edge_key);
						// Check if this edge participates in a cycle
						if (this.is_in_cycle(graph, node.name, dep_name)) {
							cycle_causing_edges.push({
								from: node.name,
								to: dep_name,
								type: spec.type,
							});
						}
						break;
				}
			}
		}

		return {
			publishing_deps,
			propagation_deps,
			reconciliation_deps,
			cycle_causing_edges,
		};
	}

	/**
	 * Checks if an edge participates in a cycle.
	 */
	private is_in_cycle(graph: Dependency_Graph, from: string, to: string): boolean {
		// Simple DFS to check if we can reach 'from' starting from 'to'
		const visited = new Set<string>();
		const stack: Array<string> = [to];

		while (stack.length > 0) {
			const current = stack.pop()!;

			if (current === from) {
				return true; // Found a cycle
			}

			if (visited.has(current)) continue;
			visited.add(current);

			const node = graph.nodes.get(current);
			if (node) {
				for (const [dep_name] of node.dependencies) {
					if (graph.nodes.has(dep_name)) {
						stack.push(dep_name);
					}
				}
			}
		}

		return false;
	}


	/**
	 * Plans dependency updates for a specific phase.
	 */
	plan_updates(
		graph: Dependency_Graph,
		published: Map<string, {version: string}>,
		phase: 'propagation' | 'reconciliation',
	): Array<Dependency_Update_Plan> {
		const updates: Array<Dependency_Update_Plan> = [];

		for (const node of graph.nodes.values()) {
			for (const [dep_name, spec] of node.dependencies) {
				const published_info = published.get(dep_name);
				if (!published_info) continue;

				// Check if this update belongs to the current phase
				const should_update =
					(phase === 'propagation' && (spec.type === 'peer' || spec.type === 'prod')) ||
					(phase === 'reconciliation' && spec.type === 'dev');

				if (should_update) {
					// Check if update is needed
					if (spec.version !== published_info.version && spec.version !== '*') {
						updates.push({
							package: node.name,
							from_version: spec.version,
							to_version: published_info.version,
							type: spec.type as 'peer' | 'prod' | 'dev',
							required_by: new Set([node.name]),
							blocking: spec.type !== 'dev', // Dev deps are never blocking
						});
					}
				}
			}
		}

		// Consolidate updates by package
		const consolidated = new Map<string, Dependency_Update_Plan>();

		for (const update of updates) {
			const key = `${update.package}:${update.type}`;
			const existing = consolidated.get(key);

			if (existing) {
				// Merge required_by sets
				for (const req of update.required_by) {
					existing.required_by.add(req);
				}
				// Use most conservative blocking status
				existing.blocking = existing.blocking || update.blocking;
			} else {
				consolidated.set(key, update);
			}
		}

		return Array.from(consolidated.values());
	}

	/**
	 * Identifies which packages can be published in parallel.
	 */
	identify_parallel_groups(order: Array<string>, graph: Dependency_Graph): Array<Array<string>> {
		const groups: Array<Array<string>> = [];
		const published = new Set<string>();

		for (const pkg_name of order) {
			const node = graph.get_node(pkg_name);
			if (!node) continue;

			// Check if all dependencies are already published
			const deps_satisfied = Array.from(node.dependencies.keys())
				.filter((dep) => graph.nodes.has(dep))
				.every((dep) => published.has(dep));

			if (deps_satisfied) {
				// Can be published in current group
				if (groups.length === 0 || !deps_satisfied) {
					groups.push([]);
				}
				groups[groups.length - 1].push(pkg_name);
			} else {
				// Need to wait for dependencies
				if (groups[groups.length - 1].length > 0) {
					groups.push([]);
				}
				groups[groups.length - 1].push(pkg_name);
			}

			published.add(pkg_name);
		}

		return groups.filter((g) => g.length > 0);
	}
}

/**
 * Creates a dependency classifier.
 */
export const create_dependency_classifier = (): Dependency_Classifier => {
	return new Dependency_Classifier();
};