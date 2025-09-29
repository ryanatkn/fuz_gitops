import {describe, it, expect} from 'vitest';
import {Dependency_Graph, Dependency_Graph_Builder} from './dependency_graph.js';
import type {Local_Repo} from './local_repo.js';

// Helper to create mock repos with dependencies
const create_mock_repo = (
	name: string,
	version = '1.0.0',
	dependencies?: Record<string, string>,
	devDependencies?: Record<string, string>,
	peerDependencies?: Record<string, string>,
	isPrivate?: boolean,
): Local_Repo => ({
	type: 'resolved_local_repo',
	repo_name: name,
	repo_dir: `/mock/${name}`,
	repo_url: `https://github.com/test/${name}`,
	repo_git_ssh_url: `git@github.com:test/${name}.git`,
	repo_config: {repo_url: `https://github.com/test/${name}`} as any,
	pkg: {
		name,
		package_json: {
			name,
			version,
			type: 'module' as const,
			dependencies,
			devDependencies,
			peerDependencies,
			private: isPrivate,
		},
	} as any, // Use any to avoid complex belt/pkg type requirements
});

describe('Dependency_Graph', () => {
	describe('basic functionality', () => {
		it('creates nodes for all repos', () => {
			const repos = [
				create_mock_repo('package-a'),
				create_mock_repo('package-b'),
			];

			const graph = new Dependency_Graph(repos);

			expect(graph.nodes.size).toBe(2);
			expect(graph.get_node('package-a')).toBeDefined();
			expect(graph.get_node('package-b')).toBeDefined();
		});

		it('sets publishable flag based on private field', () => {
			const repos = [
				create_mock_repo('public-pkg', '1.0.0'),
				create_mock_repo('private-pkg', '1.0.0', undefined, undefined, undefined, true),
			];

			const graph = new Dependency_Graph(repos);

			expect(graph.get_node('public-pkg')?.publishable).toBe(true);
			expect(graph.get_node('private-pkg')?.publishable).toBe(false);
		});

		it('extracts dependencies by type', () => {
			const repo = create_mock_repo(
				'main-pkg',
				'1.0.0',
				{dep1: '^1.0.0'},
				{devDep1: '^2.0.0'},
				{peerDep1: '^3.0.0'},
			);

			const graph = new Dependency_Graph([repo]);
			const node = graph.get_node('main-pkg')!;

			expect(node.dependencies.get('dep1')).toEqual({
				type: 'prod',
				version: '^1.0.0',
			});
			expect(node.dependencies.get('devDep1')).toEqual({
				type: 'dev',
				version: '^2.0.0',
			});
			expect(node.dependencies.get('peerDep1')).toEqual({
				type: 'peer',
				version: '^3.0.0',
			});
		});
	});

	describe('dependency relationships', () => {
		it('builds internal dependency relationships', () => {
			const repos = [
				create_mock_repo('lib', '1.0.0'),
				create_mock_repo('app', '1.0.0', {lib: '^1.0.0'}),
			];

			const graph = new Dependency_Graph(repos);

			const lib_node = graph.get_node('lib')!;
			const app_node = graph.get_node('app')!;

			expect(lib_node.dependents.has('app')).toBe(true);
			expect(app_node.dependencies.get('lib')).toEqual({
				type: 'prod',
				version: '^1.0.0',
			});
		});

		it('ignores external dependencies for relationships', () => {
			const repo = create_mock_repo('pkg', '1.0.0', {
				'internal-dep': '^1.0.0',
				'external-dep': '^1.0.0',
			});

			const internal_dep_repo = create_mock_repo('internal-dep', '1.0.0');

			const graph = new Dependency_Graph([repo, internal_dep_repo]);

			const pkg_node = graph.get_node('pkg')!;
			const internal_node = graph.get_node('internal-dep')!;

			// Internal dependency creates relationship
			expect(internal_node.dependents.has('pkg')).toBe(true);

			// Both dependencies are in the node's dependencies map
			expect(pkg_node.dependencies.has('internal-dep')).toBe(true);
			expect(pkg_node.dependencies.has('external-dep')).toBe(true);
		});
	});

	describe('topological_sort', () => {
		it('sorts simple dependency chain', () => {
			const repos = [
				create_mock_repo('lib', '1.0.0'),
				create_mock_repo('middleware', '1.0.0', {lib: '^1.0.0'}),
				create_mock_repo('app', '1.0.0', {middleware: '^1.0.0'}),
			];

			const graph = new Dependency_Graph(repos);
			const order = graph.topological_sort();

			expect(order).toEqual(['lib', 'middleware', 'app']);
		});

		it('handles multiple independent packages', () => {
			const repos = [
				create_mock_repo('independent-a', '1.0.0'),
				create_mock_repo('independent-b', '1.0.0'),
				create_mock_repo('uses-both', '1.0.0', {
					'independent-a': '^1.0.0',
					'independent-b': '^1.0.0',
				}),
			];

			const graph = new Dependency_Graph(repos);
			const order = graph.topological_sort();

			// Independent packages should come first
			expect(order.indexOf('independent-a')).toBeLessThan(order.indexOf('uses-both'));
			expect(order.indexOf('independent-b')).toBeLessThan(order.indexOf('uses-both'));
		});

		it('excludes dev dependencies when requested', () => {
			const repos = [
				create_mock_repo('lib', '1.0.0'),
				create_mock_repo('app', '1.0.0', undefined, {lib: '^1.0.0'}), // dev dependency
			];

			const graph = new Dependency_Graph(repos);

			// With dev dependencies (would create order constraint)
			const order_with_dev = graph.topological_sort(false);
			expect(order_with_dev).toEqual(['lib', 'app']);

			// Without dev dependencies (no constraints)
			const order_without_dev = graph.topological_sort(true);
			expect(order_without_dev.length).toBe(2);
			// Order can be either way since no prod dependencies
		});

		it('throws on circular dependencies', () => {
			const repos = [
				create_mock_repo('pkg-a', '1.0.0', {'pkg-b': '^1.0.0'}),
				create_mock_repo('pkg-b', '1.0.0', {'pkg-a': '^1.0.0'}),
			];

			const graph = new Dependency_Graph(repos);

			expect(() => graph.topological_sort()).toThrow(/Circular dependency/);
		});

		it('handles complex dependency chains', () => {
			// Create a diamond dependency pattern: app -> [lib-a, lib-b] -> shared
			const repos = [
				create_mock_repo('shared', '1.0.0'),
				create_mock_repo('lib-a', '1.0.0', {shared: '^1.0.0'}),
				create_mock_repo('lib-b', '1.0.0', {shared: '^1.0.0'}),
				create_mock_repo('app', '1.0.0', {'lib-a': '^1.0.0', 'lib-b': '^1.0.0'}),
			];

			const graph = new Dependency_Graph(repos);
			const order = graph.topological_sort();

			// shared must come before lib-a and lib-b
			expect(order.indexOf('shared')).toBeLessThan(order.indexOf('lib-a'));
			expect(order.indexOf('shared')).toBeLessThan(order.indexOf('lib-b'));
			// lib-a and lib-b must come before app
			expect(order.indexOf('lib-a')).toBeLessThan(order.indexOf('app'));
			expect(order.indexOf('lib-b')).toBeLessThan(order.indexOf('app'));
		});

		it('handles single package with no dependencies', () => {
			const repos = [create_mock_repo('standalone', '1.0.0')];

			const graph = new Dependency_Graph(repos);
			const order = graph.topological_sort();

			expect(order).toEqual(['standalone']);
		});

		it('handles packages with only external dependencies', () => {
			const repos = [
				create_mock_repo('pkg-a', '1.0.0', {lodash: '^4.0.0', react: '^18.0.0'}),
				create_mock_repo('pkg-b', '1.0.0', {express: '^4.0.0'}),
			];

			const graph = new Dependency_Graph(repos);
			const order = graph.topological_sort();

			// Both packages can be published in any order since no internal deps
			expect(order).toHaveLength(2);
			expect(order).toContain('pkg-a');
			expect(order).toContain('pkg-b');
		});
	});

	describe('detect_cycles', () => {
		it('detects simple cycle', () => {
			const repos = [
				create_mock_repo('pkg-a', '1.0.0', {'pkg-b': '^1.0.0'}),
				create_mock_repo('pkg-b', '1.0.0', {'pkg-a': '^1.0.0'}),
			];

			const graph = new Dependency_Graph(repos);
			const cycles = graph.detect_cycles();

			expect(cycles.length).toBe(1);
			expect(cycles[0]).toContain('pkg-a');
			expect(cycles[0]).toContain('pkg-b');
		});

		it('detects no cycles in acyclic graph', () => {
			const repos = [
				create_mock_repo('lib', '1.0.0'),
				create_mock_repo('app', '1.0.0', {lib: '^1.0.0'}),
			];

			const graph = new Dependency_Graph(repos);
			const cycles = graph.detect_cycles();

			expect(cycles).toEqual([]);
		});

		it('detects multiple cycles', () => {
			const repos = [
				// Cycle 1: a ↔ b
				create_mock_repo('pkg-a', '1.0.0', {'pkg-b': '^1.0.0'}),
				create_mock_repo('pkg-b', '1.0.0', {'pkg-a': '^1.0.0'}),
				// Cycle 2: c ↔ d
				create_mock_repo('pkg-c', '1.0.0', {'pkg-d': '^1.0.0'}),
				create_mock_repo('pkg-d', '1.0.0', {'pkg-c': '^1.0.0'}),
			];

			const graph = new Dependency_Graph(repos);
			const cycles = graph.detect_cycles();

			expect(cycles.length).toBe(2);
		});

		it('detects longer cycles (3+ packages)', () => {
			const repos = [
				create_mock_repo('pkg-a', '1.0.0', {'pkg-b': '^1.0.0'}),
				create_mock_repo('pkg-b', '1.0.0', {'pkg-c': '^1.0.0'}),
				create_mock_repo('pkg-c', '1.0.0', {'pkg-a': '^1.0.0'}), // completes cycle
			];

			const graph = new Dependency_Graph(repos);
			const cycles = graph.detect_cycles();

			expect(cycles.length).toBe(1);
			expect(cycles[0]).toHaveLength(4); // a -> b -> c -> a (includes duplicate)
		});

		it('handles self-dependency (pathological case)', () => {
			const repos = [
				create_mock_repo('self-dep', '1.0.0', {'self-dep': '^1.0.0'}),
			];

			const graph = new Dependency_Graph(repos);
			const cycles = graph.detect_cycles();

			expect(cycles.length).toBe(1);
			expect(cycles[0]).toContain('self-dep');
		});
	});

	describe('detect_cycles_by_type', () => {
		it('separates production and dev cycles', () => {
			const repos = [
				// Production cycle
				create_mock_repo('prod-a', '1.0.0', {'prod-b': '^1.0.0'}),
				create_mock_repo('prod-b', '1.0.0', {'prod-a': '^1.0.0'}),
				// Dev cycle
				create_mock_repo('dev-a', '1.0.0', undefined, {'dev-b': '^1.0.0'}),
				create_mock_repo('dev-b', '1.0.0', undefined, {'dev-a': '^1.0.0'}),
			];

			const graph = new Dependency_Graph(repos);
			const {production_cycles, dev_cycles} = graph.detect_cycles_by_type();

			expect(production_cycles.length).toBe(1);
			expect(production_cycles[0]).toContain('prod-a');
			expect(production_cycles[0]).toContain('prod-b');

			expect(dev_cycles.length).toBe(1);
			expect(dev_cycles[0]).toContain('dev-a');
			expect(dev_cycles[0]).toContain('dev-b');
		});

		it('treats peer dependencies as production', () => {
			const repos = [
				create_mock_repo('peer-a', '1.0.0', undefined, undefined, {'peer-b': '^1.0.0'}),
				create_mock_repo('peer-b', '1.0.0', undefined, undefined, {'peer-a': '^1.0.0'}),
			];

			const graph = new Dependency_Graph(repos);
			const {production_cycles, dev_cycles} = graph.detect_cycles_by_type();

			expect(production_cycles.length).toBe(1);
			expect(dev_cycles.length).toBe(0);
		});

		it('handles mixed dependency types (no cycles)', () => {
			// a -> b (prod), b -> a (dev) - this is NOT a cycle in either analysis
			const repos = [
				create_mock_repo('mixed-a', '1.0.0', {'mixed-b': '^1.0.0'}), // prod dep
				create_mock_repo('mixed-b', '1.0.0', undefined, {'mixed-a': '^1.0.0'}), // dev dep back
			];

			const graph = new Dependency_Graph(repos);
			const {production_cycles, dev_cycles} = graph.detect_cycles_by_type();

			// No production cycle (dev deps excluded) and no dev cycle (prod deps excluded)
			expect(production_cycles.length).toBe(0);
			expect(dev_cycles.length).toBe(0);
		});

		it('handles complex mixed scenarios (no cycles)', () => {
			// a -> b (prod), b -> c (peer), a -> c (dev) - no cycles in either analysis
			const repos = [
				create_mock_repo('complex-a', '1.0.0', {'complex-b': '^1.0.0'}, {'complex-c': '^1.0.0'}),
				create_mock_repo('complex-b', '1.0.0', undefined, undefined, {'complex-c': '^1.0.0'}),
				create_mock_repo('complex-c', '1.0.0'),
			];

			const graph = new Dependency_Graph(repos);
			const {production_cycles, dev_cycles} = graph.detect_cycles_by_type();

			// No complete cycles in either analysis
			expect(production_cycles.length).toBe(0);
			expect(dev_cycles.length).toBe(0);
		});

		it('detects actual dev cycles', () => {
			// Real dev cycle: a -> b (dev), b -> a (dev)
			const repos = [
				create_mock_repo('dev-cycle-a', '1.0.0', undefined, {'dev-cycle-b': '^1.0.0'}),
				create_mock_repo('dev-cycle-b', '1.0.0', undefined, {'dev-cycle-a': '^1.0.0'}),
			];

			const graph = new Dependency_Graph(repos);
			const {production_cycles, dev_cycles} = graph.detect_cycles_by_type();

			expect(production_cycles.length).toBe(0);
			expect(dev_cycles.length).toBe(1);
			expect(dev_cycles[0]).toContain('dev-cycle-a');
			expect(dev_cycles[0]).toContain('dev-cycle-b');
		});
	});

	describe('helper methods', () => {
		it('get_dependents returns correct set', () => {
			const repos = [
				create_mock_repo('lib', '1.0.0'),
				create_mock_repo('app-1', '1.0.0', {lib: '^1.0.0'}),
				create_mock_repo('app-2', '1.0.0', {lib: '^1.0.0'}),
			];

			const graph = new Dependency_Graph(repos);
			const dependents = graph.get_dependents('lib');

			expect(dependents).toEqual(new Set(['app-1', 'app-2']));
		});

		it('get_dependencies returns correct map', () => {
			const repo = create_mock_repo('pkg', '1.0.0', {dep1: '^1.0.0'}, {dep2: '^2.0.0'});
			const graph = new Dependency_Graph([repo]);
			const dependencies = graph.get_dependencies('pkg');

			expect(dependencies.size).toBe(2);
			expect(dependencies.get('dep1')?.type).toBe('prod');
			expect(dependencies.get('dep2')?.type).toBe('dev');
		});
	});
});

describe('Dependency_Graph_Builder', () => {
	it('builds graph from repos', () => {
		const builder = new Dependency_Graph_Builder();
		const repos = [create_mock_repo('test', '1.0.0')];

		const graph = builder.build_from_repos(repos);

		expect(graph.nodes.size).toBe(1);
	});

	it('computes publishing order excluding dev deps', () => {
		const builder = new Dependency_Graph_Builder();
		const repos = [
			create_mock_repo('lib', '1.0.0'),
			create_mock_repo('app', '1.0.0', {lib: '^1.0.0'}),
		];

		const graph = builder.build_from_repos(repos);
		const order = builder.compute_publishing_order(graph);

		expect(order).toEqual(['lib', 'app']);
	});

	describe('analyze', () => {
		it('finds wildcard dependencies', () => {
			const builder = new Dependency_Graph_Builder();
			const repos = [
				create_mock_repo('pkg', '1.0.0', {dep: '*'}),
			];

			const graph = builder.build_from_repos(repos);
			const analysis = builder.analyze(graph);

			expect(analysis.wildcard_deps).toEqual([
				{pkg: 'pkg', dep: 'dep', version: '*'},
			]);
		});

		it('finds missing peer dependencies', () => {
			const builder = new Dependency_Graph_Builder();
			const repos = [
				create_mock_repo('pkg', '1.0.0', undefined, undefined, {
					'external-peer': '^1.0.0',
				}),
			];

			const graph = builder.build_from_repos(repos);
			const analysis = builder.analyze(graph);

			expect(analysis.missing_peers).toEqual([
				{pkg: 'pkg', dep: 'external-peer'},
			]);
		});

		it('separates cycles by type in analysis', () => {
			const builder = new Dependency_Graph_Builder();
			const repos = [
				create_mock_repo('prod-a', '1.0.0', {'prod-b': '^1.0.0'}),
				create_mock_repo('prod-b', '1.0.0', {'prod-a': '^1.0.0'}),
				create_mock_repo('dev-a', '1.0.0', undefined, {'dev-b': '^1.0.0'}),
				create_mock_repo('dev-b', '1.0.0', undefined, {'dev-a': '^1.0.0'}),
			];

			const graph = builder.build_from_repos(repos);
			const analysis = builder.analyze(graph);

			expect(analysis.production_cycles.length).toBe(1);
			expect(analysis.dev_cycles.length).toBe(1);
		});
	});
});