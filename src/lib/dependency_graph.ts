import type {Local_Repo} from '$lib/local_repo.js';

export interface Dependency_Node {
	name: string;
	version: string;
	repo: Local_Repo;
	dependencies: Map<string, Dependency_Spec>;
	dependents: Set<string>;
	publishable: boolean;
}

export interface Dependency_Spec {
	type: 'peer' | 'dev' | 'prod';
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

export class Dependency_Graph {
	nodes: Map<string, Dependency_Node>;
	edges: Map<string, Set<string>>; // pkg -> dependents

	constructor(repos: Array<Local_Repo>) {
		this.nodes = new Map();
		this.edges = new Map();
		this.build_from_repos(repos);
	}

	private build_from_repos(repos: Array<Local_Repo>): void {
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
				node.dependencies.set(name, {type: 'prod', version});
			}
			for (const [name, version] of Object.entries(devDeps)) {
				node.dependencies.set(name, {type: 'dev', version});
			}
			for (const [name, version] of Object.entries(peerDeps)) {
				node.dependencies.set(name, {type: 'peer', version});
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
	 */
	topological_sort(): Array<string> {
		const visited = new Set<string>();
		const result: Array<string> = [];

		// Count incoming edges for each node
		const in_degree = new Map<string, number>();
		for (const name of this.nodes.keys()) {
			in_degree.set(name, 0);
		}
		for (const node of this.nodes.values()) {
			for (const [dep_name] of node.dependencies) {
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
			const dependents = this.get_dependents(name);
			for (const dependent of dependents) {
				const new_degree = in_degree.get(dependent)! - 1;
				in_degree.set(dependent, new_degree);
				if (new_degree === 0) {
					queue.push(dependent);
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

export class Dependency_Graph_Builder {
	build_from_repos(repos: Array<Local_Repo>): Dependency_Graph {
		return new Dependency_Graph(repos);
	}

	/**
	 * Returns the topologically sorted order for publishing.
	 */
	compute_publishing_order(graph: Dependency_Graph): Array<string> {
		return graph.topological_sort();
	}

	/**
	 * Analyzes the graph for potential issues.
	 */
	analyze(graph: Dependency_Graph): {
		cycles: Array<Array<string>>;
		wildcard_deps: Array<{pkg: string; dep: string; version: string}>;
		missing_peers: Array<{pkg: string; dep: string}>;
	} {
		const cycles = graph.detect_cycles();
		const wildcard_deps: Array<{pkg: string; dep: string; version: string}> = [];
		const missing_peers: Array<{pkg: string; dep: string}> = [];

		for (const node of graph.nodes.values()) {
			for (const [dep_name, spec] of node.dependencies) {
				if (spec.version === '*') {
					wildcard_deps.push({pkg: node.name, dep: dep_name, version: spec.version});
				}
				if (spec.type === 'peer' && !graph.nodes.has(dep_name)) {
					// External peer dependency
					missing_peers.push({pkg: node.name, dep: dep_name});
				}
			}
		}

		return {cycles, wildcard_deps, missing_peers};
	}
}
