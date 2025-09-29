import type {Dependency_Graph} from '$lib/dependency_graph.js';

export interface Serialized_Node {
	name: string;
	version: string;
	dependencies: Array<{
		name: string;
		type: string;
		version: string;
	}>;
	dependents: Array<string>;
	publishable: boolean;
}

export interface Serialized_Graph {
	nodes: Array<Serialized_Node>;
	edges: Array<[string, string]>;
}

export interface Serialized_Publishing_Preview {
	publishing_order: Array<string>;
	version_changes: Array<{
		package_name: string;
		from: string;
		to: string;
		bump_type: string;
		breaking: boolean;
		has_changesets: boolean;
		will_generate_changeset?: boolean;
		needs_bump_escalation?: boolean;
		existing_bump?: string;
		required_bump?: string;
	}>;
	dependency_updates: Array<{
		dependent_package: string;
		updated_dependency: string;
		new_version: string;
		type: string;
		causes_republish: boolean;
	}>;
	breaking_cascades: Record<string, Array<string>>;
	warnings: Array<string>;
	errors: Array<string>;
}

/**
 * Serializes a dependency graph to a JSON-safe format.
 */
export const serialize_graph = (graph: Dependency_Graph): Serialized_Graph => {
	const nodes: Array<Serialized_Node> = [];
	const edges: Array<[string, string]> = [];

	// Serialize nodes
	for (const node of graph.nodes.values()) {
		const dependencies = Array.from(node.dependencies, ([dep_name, spec]) => ({
			name: dep_name,
			type: spec.type,
			version: spec.version,
		}));

		nodes.push({
			name: node.name,
			version: node.version,
			dependencies,
			dependents: Array.from(node.dependents),
			publishable: node.publishable,
		});
	}

	// Serialize edges
	for (const [from, tos] of graph.edges) {
		for (const to of tos) {
			edges.push([from, to]);
		}
	}

	return {nodes, edges};
};
