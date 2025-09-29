/**
 * Shared types and constants for dependency management
 */

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

export interface Dependency_Node {
	name: string;
	version: string;
	dependencies: Map<string, Dependency_Spec>;
	dependents: Set<string>;
	publishable: boolean;
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
