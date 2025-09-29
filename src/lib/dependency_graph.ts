import type {Local_Repo} from '$lib/local_repo.js';
import {
	DEPENDENCY_TYPE,
	type Dependency_Spec,
	type Dependency_Graph_Json,
} from '$lib/dependency_types.js';

export interface Dependency_Node {
	name: string;
	version: string;
	repo?: Local_Repo;
	dependencies: Map<string, Dependency_Spec>;
	dependents: Set<string>;
	publishable: boolean;
}

export class Dependency_Graph {
	nodes: Map<string, Dependency_Node>;
	edges: Map<string, Set<string>>; // pkg -> dependents

	constructor() {
		this.nodes = new Map();
		this.edges = new Map();
	}

	/**
	 * Initializes the graph from a list of repos.
	 * This is now a public method to be called by the builder.
	 */
	public init_from_repos(repos: Array<Local_Repo>): void {
		// First pass: create nodes
		for (const repo of repos) {
			const {pkg} = repo;
			const node: Dependency_Node = {
				name: pkg.name,
				version: pkg.package_json.version || '0.0.0',
				repo,
				dependencies: new Map(),
				dependents: new Set(),
				publishable: !!pkg.package_json.private === false,
			};

			// Extract dependencies
			const deps = pkg.package_json.dependencies || {};
			const devDeps = pkg.package_json.devDependencies || {};
			const peerDeps = pkg.package_json.peerDependencies || {};

			for (const [name, version] of Object.entries(deps)) {
				node.dependencies.set(name, {type: DEPENDENCY_TYPE.PROD, version});
			}
			for (const [name, version] of Object.entries(devDeps)) {
				node.dependencies.set(name, {type: DEPENDENCY_TYPE.DEV, version});
			}
			for (const [name, version] of Object.entries(peerDeps)) {
				node.dependencies.set(name, {type: DEPENDENCY_TYPE.PEER, version});
			}

			this.nodes.set(pkg.name, node);
			this.edges.set(pkg.name, new Set());
		}

		// Second pass: build edges (dependents)
		for (const node of this.nodes.values()) {
			for (const [dep_name] of node.dependencies) {
				if (this.nodes.has(dep_name)) {
					// Internal dependency
					const dep_node = this.nodes.get(dep_name)!;
					dep_node.dependents.add(node.name);
					this.edges.get(dep_name)!.add(node.name);
				}
			}
		}
	}

	get_node(name: string): Dependency_Node | undefined {
		return this.nodes.get(name);
	}

	get_dependents(name: string): Set<string> {
		return this.edges.get(name) || new Set();
	}

	get_dependencies(name: string): Map<string, Dependency_Spec> {
		const node = this.nodes.get(name);
		return node ? node.dependencies : new Map();
	}

	/**
	 * Performs topological sort to determine publishing order.
	 * Returns array of package names in the order they should be published.
	 * @param exclude_dev - If true, excludes dev dependencies from the sort
	 */
	topological_sort(exclude_dev = false): Array<string> {
		const visited = new Set<string>();
		const result: Array<string> = [];

		// Count incoming edges for each node
		const in_degree = new Map<string, number>();
		for (const name of this.nodes.keys()) {
			in_degree.set(name, 0);
		}
		for (const node of this.nodes.values()) {
			for (const [dep_name, spec] of node.dependencies) {
				// Skip dev dependencies if requested
				if (exclude_dev && spec.type === DEPENDENCY_TYPE.DEV) continue;

				if (this.nodes.has(dep_name)) {
					in_degree.set(node.name, in_degree.get(node.name)! + 1);
				}
			}
		}

		// Start with nodes that have no dependencies
		const queue: Array<string> = [];
		for (const [name, degree] of in_degree) {
			if (degree === 0) {
				queue.push(name);
			}
		}

		// Process nodes
		while (queue.length > 0) {
			const name = queue.shift()!;
			result.push(name);
			visited.add(name);

			// Reduce in-degree for dependents
			const node = this.nodes.get(name);
			if (node) {
				// Find packages that depend on this one
				for (const other_node of this.nodes.values()) {
					for (const [dep_name, spec] of other_node.dependencies) {
						// Skip dev dependencies if requested
						if (exclude_dev && spec.type === DEPENDENCY_TYPE.DEV) continue;

						if (dep_name === name) {
							const new_degree = in_degree.get(other_node.name)! - 1;
							in_degree.set(other_node.name, new_degree);
							if (new_degree === 0) {
								queue.push(other_node.name);
							}
						}
					}
				}
			}
		}

		// Check for cycles
		if (result.length !== this.nodes.size) {
			const unvisited = Array.from(this.nodes.keys()).filter((n) => !visited.has(n));
			throw new Error(`Circular dependency detected involving: ${unvisited.join(', ')}`);
		}

		return result;
	}

	/**
	 * Detects cycles in the dependency graph.
	 * Returns array of cycles, where each cycle is an array of package names.
	 */
	detect_cycles(): Array<Array<string>> {
		const cycles: Array<Array<string>> = [];
		const visited = new Set<string>();
		const rec_stack = new Set<string>();

		const dfs = (name: string, path: Array<string>): void => {
			visited.add(name);
			rec_stack.add(name);
			path.push(name);

			const node = this.nodes.get(name);
			if (node) {
				for (const [dep_name] of node.dependencies) {
					if (this.nodes.has(dep_name)) {
						if (!visited.has(dep_name)) {
							dfs(dep_name, [...path]);
						} else if (rec_stack.has(dep_name)) {
							// Found a cycle
							const cycle_start = path.indexOf(dep_name);
							cycles.push(path.slice(cycle_start).concat(dep_name));
						}
					}
				}
			}

			rec_stack.delete(name);
		};

		for (const name of this.nodes.keys()) {
			if (!visited.has(name)) {
				dfs(name, []);
			}
		}

		return cycles;
	}

	/**
	 * Detects cycles by dependency type.
	 * Separates production/peer cycles (errors) from dev cycles (normal).
	 */
	detect_cycles_by_type(): {
		production_cycles: Array<Array<string>>;
		dev_cycles: Array<Array<string>>;
	} {
		const production_cycles: Array<Array<string>> = [];
		const dev_cycles: Array<Array<string>> = [];
		const visited_prod = new Set<string>();
		const visited_dev = new Set<string>();
		const rec_stack_prod = new Set<string>();
		const rec_stack_dev = new Set<string>();

		// DFS for production/peer dependencies only
		const dfs_prod = (name: string, path: Array<string>): void => {
			visited_prod.add(name);
			rec_stack_prod.add(name);
			path.push(name);

			const node = this.nodes.get(name);
			if (node) {
				for (const [dep_name, spec] of node.dependencies) {
					// Skip dev dependencies
					if (spec.type === DEPENDENCY_TYPE.DEV) continue;

					if (this.nodes.has(dep_name)) {
						if (!visited_prod.has(dep_name)) {
							dfs_prod(dep_name, [...path]);
						} else if (rec_stack_prod.has(dep_name)) {
							// Found a production cycle
							const cycle_start = path.indexOf(dep_name);
							const cycle = path.slice(cycle_start).concat(dep_name);
							// Check if this cycle is unique
							const cycle_key = [...cycle].sort().join(',');
							const exists = production_cycles.some((c) => [...c].sort().join(',') === cycle_key);
							if (!exists) {
								production_cycles.push(cycle);
							}
						}
					}
				}
			}

			rec_stack_prod.delete(name);
		};

		// DFS for dev dependencies only
		const dfs_dev = (name: string, path: Array<string>): void => {
			visited_dev.add(name);
			rec_stack_dev.add(name);
			path.push(name);

			const node = this.nodes.get(name);
			if (node) {
				for (const [dep_name, spec] of node.dependencies) {
					// Only check dev dependencies
					if (spec.type !== DEPENDENCY_TYPE.DEV) continue;

					if (this.nodes.has(dep_name)) {
						if (!visited_dev.has(dep_name)) {
							dfs_dev(dep_name, [...path]);
						} else if (rec_stack_dev.has(dep_name)) {
							// Found a dev cycle
							const cycle_start = path.indexOf(dep_name);
							const cycle = path.slice(cycle_start).concat(dep_name);
							// Check if this cycle is unique
							const cycle_key = [...cycle].sort().join(',');
							const exists = dev_cycles.some((c) => [...c].sort().join(',') === cycle_key);
							if (!exists) {
								dev_cycles.push(cycle);
							}
						}
					}
				}
			}

			rec_stack_dev.delete(name);
		};

		// Check for production/peer cycles
		for (const name of this.nodes.keys()) {
			if (!visited_prod.has(name)) {
				dfs_prod(name, []);
			}
		}

		// Check for dev cycles
		for (const name of this.nodes.keys()) {
			if (!visited_dev.has(name)) {
				dfs_dev(name, []);
			}
		}

		return {production_cycles, dev_cycles};
	}

	toJSON(): Dependency_Graph_Json {
		const nodes = Array.from(this.nodes.values()).map((node) => ({
			name: node.name,
			version: node.version,
			dependencies: Array.from(node.dependencies.entries()).map(([name, spec]) => ({
				name,
				spec,
			})),
			dependents: Array.from(node.dependents),
			publishable: node.publishable,
		}));

		const edges: Array<{from: string; to: string}> = [];
		for (const [from, tos] of this.edges) {
			for (const to of tos) {
				edges.push({from, to});
			}
		}

		return {nodes, edges};
	}
}

/**
 * Builder for creating and analyzing dependency graphs.
 * This is now the single entry point for building graphs.
 */
export class Dependency_Graph_Builder {
	build_from_repos(repos: Array<Local_Repo>): Dependency_Graph {
		const graph = new Dependency_Graph();
		graph.init_from_repos(repos);
		return graph;
	}

	/**
	 * Returns the topologically sorted order for publishing.
	 * Excludes dev dependencies to avoid cycles.
	 */
	compute_publishing_order(graph: Dependency_Graph): Array<string> {
		return graph.topological_sort(true); // Exclude dev dependencies
	}

	/**
	 * Analyzes the graph for potential issues.
	 */
	analyze(graph: Dependency_Graph): {
		production_cycles: Array<Array<string>>;
		dev_cycles: Array<Array<string>>;
		wildcard_deps: Array<{pkg: string; dep: string; version: string}>;
		missing_peers: Array<{pkg: string; dep: string}>;
	} {
		const {production_cycles, dev_cycles} = graph.detect_cycles_by_type();
		const wildcard_deps: Array<{pkg: string; dep: string; version: string}> = [];
		const missing_peers: Array<{pkg: string; dep: string}> = [];

		for (const node of graph.nodes.values()) {
			for (const [dep_name, spec] of node.dependencies) {
				if (spec.version === '*') {
					wildcard_deps.push({pkg: node.name, dep: dep_name, version: spec.version});
				}
				if (spec.type === DEPENDENCY_TYPE.PEER && !graph.nodes.has(dep_name)) {
					// External peer dependency
					missing_peers.push({pkg: node.name, dep: dep_name});
				}
			}
		}

		return {production_cycles, dev_cycles, wildcard_deps, missing_peers};
	}
}
