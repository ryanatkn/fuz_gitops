import type {Local_Repo} from '$lib/local_repo.js';
import {EMPTY_OBJECT} from '@ryanatkn/belt/object.js';

export const DEPENDENCY_TYPE = {
	PROD: 'prod',
	PEER: 'peer',
	DEV: 'dev',
} as const;

export type Dependency_Type = (typeof DEPENDENCY_TYPE)[keyof typeof DEPENDENCY_TYPE];

export interface Dependency_Spec {
	type: Dependency_Type;
	version: string;
	resolved?: string;
}

export interface Dependency_Graph_Json {
	nodes: Array<{
		name: string;
		version: string;
		dependencies: Array<{name: string; spec: Dependency_Spec}>;
		dependents: Array<string>;
		publishable: boolean;
	}>;
	edges: Array<{from: string; to: string}>;
}

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
				publishable: !!pkg.package_json.private === false, // eslint-disable-line @typescript-eslint/no-unnecessary-boolean-literal-compare
			};

			// Extract dependencies
			const deps = pkg.package_json.dependencies || (EMPTY_OBJECT as Record<string, string>);
			const dev_deps = pkg.package_json.devDependencies || (EMPTY_OBJECT as Record<string, string>);
			const peer_deps =
				pkg.package_json.peerDependencies || (EMPTY_OBJECT as Record<string, string>);

			// Add dependencies, prioritizing prod/peer over dev
			// (if a package appears in multiple dep types, use the stronger constraint)
			for (const [name, version] of Object.entries(deps)) {
				node.dependencies.set(name, {type: DEPENDENCY_TYPE.PROD, version});
			}
			for (const [name, version] of Object.entries(peer_deps)) {
				node.dependencies.set(name, {type: DEPENDENCY_TYPE.PEER, version});
			}
			for (const [name, version] of Object.entries(dev_deps)) {
				// Only add dev deps if not already present as prod/peer
				if (!node.dependencies.has(name)) {
					node.dependencies.set(name, {type: DEPENDENCY_TYPE.DEV, version});
				}
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
	 * @param exclude_dev if true, excludes dev dependencies from the sort
	 */
	topological_sort(exclude_dev = false): Array<string> {
		const visited: Set<string> = new Set();
		const result: Array<string> = [];

		// Count incoming edges for each node
		const in_degree: Map<string, number> = new Map();
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

		// Sort initial queue alphabetically for deterministic ordering within tier
		queue.sort();

		// Process nodes
		while (queue.length > 0) {
			const name = queue.shift()!;
			result.push(name);
			visited.add(name);

			// Reduce in-degree for dependents
			const node = this.nodes.get(name);
			if (node) {
				// Find packages that depend on this one
				// Sort nodes to ensure deterministic iteration order
				const sorted_nodes = Array.from(this.nodes.values()).sort((a, b) =>
					a.name.localeCompare(b.name),
				);
				for (const other_node of sorted_nodes) {
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

	detect_cycles(): Array<Array<string>> {
		const cycles: Array<Array<string>> = [];
		const visited: Set<string> = new Set();
		const rec_stack: Set<string> = new Set();

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
		const visited_prod: Set<string> = new Set();
		const visited_dev: Set<string> = new Set();
		const rec_stack_prod: Set<string> = new Set();
		const rec_stack_dev: Set<string> = new Set();

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
