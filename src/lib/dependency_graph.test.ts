import {describe, it, expect} from 'vitest';
import {Dependency_Graph, Dependency_Graph_Builder} from '$lib/dependency_graph.js';
import {create_mock_repo} from '$lib/test_helpers.js';

describe('Dependency_Graph', () => {
	describe('basic functionality', () => {
		it('creates nodes for all repos', () => {
			const repos = [create_mock_repo({name: 'package-a'}), create_mock_repo({name: 'package-b'})];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);

			expect(graph.nodes.size).toBe(2);
			expect(graph.get_node('package-a')).toBeDefined();
			expect(graph.get_node('package-b')).toBeDefined();
		});

		it('sets publishable flag based on private field', () => {
			const repos = [
				create_mock_repo({name: 'public-pkg', version: '1.0.0'}),
				create_mock_repo({name: 'private-pkg', version: '1.0.0', isPrivate: true}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);

			expect(graph.get_node('public-pkg')?.publishable).toBe(true);
			expect(graph.get_node('private-pkg')?.publishable).toBe(false);
		});

		it('extracts dependencies by type', () => {
			const repo = create_mock_repo({
				name: 'main-pkg',
				version: '1.0.0',
				deps: {dep1: '^1.0.0'},
				devDeps: {devDep1: '^2.0.0'},
				peerDeps: {peerDep1: '^3.0.0'},
			});

			const graph = new Dependency_Graph();
			graph.init_from_repos([repo]);
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
				create_mock_repo({name: 'lib', version: '1.0.0'}),
				create_mock_repo({name: 'app', version: '1.0.0', deps: {lib: '^1.0.0'}}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);

			const lib_node = graph.get_node('lib')!;
			const app_node = graph.get_node('app')!;

			expect(lib_node.dependents.has('app')).toBe(true);
			expect(app_node.dependencies.get('lib')).toEqual({
				type: 'prod',
				version: '^1.0.0',
			});
		});

		it('ignores external dependencies for relationships', () => {
			const repo = create_mock_repo({
				name: 'pkg',
				version: '1.0.0',
				deps: {
					'internal-dep': '^1.0.0',
					'external-dep': '^1.0.0',
				},
			});

			const internal_dep_repo = create_mock_repo({name: 'internal-dep', version: '1.0.0'});

			const graph = new Dependency_Graph();
			graph.init_from_repos([repo, internal_dep_repo]);

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
				create_mock_repo({name: 'lib', version: '1.0.0'}),
				create_mock_repo({name: 'middleware', version: '1.0.0', deps: {lib: '^1.0.0'}}),
				create_mock_repo({name: 'app', version: '1.0.0', deps: {middleware: '^1.0.0'}}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
			const order = graph.topological_sort();

			expect(order).toEqual(['lib', 'middleware', 'app']);
		});

		it('handles multiple independent packages', () => {
			const repos = [
				create_mock_repo({name: 'independent-a', version: '1.0.0'}),
				create_mock_repo({name: 'independent-b', version: '1.0.0'}),
				create_mock_repo({
					name: 'uses-both',
					version: '1.0.0',
					deps: {
						'independent-a': '^1.0.0',
						'independent-b': '^1.0.0',
					},
				}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
			const order = graph.topological_sort();

			// Independent packages should come first
			expect(order.indexOf('independent-a')).toBeLessThan(order.indexOf('uses-both'));
			expect(order.indexOf('independent-b')).toBeLessThan(order.indexOf('uses-both'));
		});

		it('excludes dev dependencies when requested', () => {
			const repos = [
				create_mock_repo({name: 'lib', version: '1.0.0'}),
				create_mock_repo({name: 'app', version: '1.0.0', devDeps: {lib: '^1.0.0'}}), // dev dependency
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);

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
				create_mock_repo({name: 'pkg-a', version: '1.0.0', deps: {'pkg-b': '^1.0.0'}}),
				create_mock_repo({name: 'pkg-b', version: '1.0.0', deps: {'pkg-a': '^1.0.0'}}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);

			expect(() => graph.topological_sort()).toThrow(/Circular dependency/);
		});

		it('handles complex dependency chains', () => {
			// Create a diamond dependency pattern: app -> [lib-a, lib-b] -> shared
			const repos = [
				create_mock_repo({name: 'shared', version: '1.0.0'}),
				create_mock_repo({name: 'lib-a', version: '1.0.0', deps: {shared: '^1.0.0'}}),
				create_mock_repo({name: 'lib-b', version: '1.0.0', deps: {shared: '^1.0.0'}}),
				create_mock_repo({
					name: 'app',
					version: '1.0.0',
					deps: {'lib-a': '^1.0.0', 'lib-b': '^1.0.0'},
				}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
			const order = graph.topological_sort();

			// shared must come before lib-a and lib-b
			expect(order.indexOf('shared')).toBeLessThan(order.indexOf('lib-a'));
			expect(order.indexOf('shared')).toBeLessThan(order.indexOf('lib-b'));
			// lib-a and lib-b must come before app
			expect(order.indexOf('lib-a')).toBeLessThan(order.indexOf('app'));
			expect(order.indexOf('lib-b')).toBeLessThan(order.indexOf('app'));
		});

		it('handles single package with no dependencies', () => {
			const repos = [create_mock_repo({name: 'standalone', version: '1.0.0'})];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
			const order = graph.topological_sort();

			expect(order).toEqual(['standalone']);
		});

		it('handles packages with only external dependencies', () => {
			const repos = [
				create_mock_repo({
					name: 'pkg-a',
					version: '1.0.0',
					deps: {lodash: '^4.0.0', react: '^18.0.0'},
				}),
				create_mock_repo({name: 'pkg-b', version: '1.0.0', deps: {express: '^4.0.0'}}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
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
				create_mock_repo({name: 'pkg-a', version: '1.0.0', deps: {'pkg-b': '^1.0.0'}}),
				create_mock_repo({name: 'pkg-b', version: '1.0.0', deps: {'pkg-a': '^1.0.0'}}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
			const cycles = graph.detect_cycles();

			expect(cycles.length).toBe(1);
			expect(cycles[0]).toContain('pkg-a');
			expect(cycles[0]).toContain('pkg-b');
		});

		it('detects no cycles in acyclic graph', () => {
			const repos = [
				create_mock_repo({name: 'lib', version: '1.0.0'}),
				create_mock_repo({name: 'app', version: '1.0.0', deps: {lib: '^1.0.0'}}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
			const cycles = graph.detect_cycles();

			expect(cycles).toEqual([]);
		});

		it('detects multiple cycles', () => {
			const repos = [
				// Cycle 1: a ↔ b
				create_mock_repo({name: 'pkg-a', version: '1.0.0', deps: {'pkg-b': '^1.0.0'}}),
				create_mock_repo({name: 'pkg-b', version: '1.0.0', deps: {'pkg-a': '^1.0.0'}}),
				// Cycle 2: c ↔ d
				create_mock_repo({name: 'pkg-c', version: '1.0.0', deps: {'pkg-d': '^1.0.0'}}),
				create_mock_repo({name: 'pkg-d', version: '1.0.0', deps: {'pkg-c': '^1.0.0'}}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
			const cycles = graph.detect_cycles();

			expect(cycles.length).toBe(2);
		});

		it('detects longer cycles (3+ packages)', () => {
			const repos = [
				create_mock_repo({name: 'pkg-a', version: '1.0.0', deps: {'pkg-b': '^1.0.0'}}),
				create_mock_repo({name: 'pkg-b', version: '1.0.0', deps: {'pkg-c': '^1.0.0'}}),
				create_mock_repo({name: 'pkg-c', version: '1.0.0', deps: {'pkg-a': '^1.0.0'}}), // completes cycle
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
			const cycles = graph.detect_cycles();

			expect(cycles.length).toBe(1);
			expect(cycles[0]).toHaveLength(4); // a -> b -> c -> a (includes duplicate)
		});

		it('handles self-dependency (pathological case)', () => {
			const repos = [
				create_mock_repo({name: 'self-dep', version: '1.0.0', deps: {'self-dep': '^1.0.0'}}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
			const cycles = graph.detect_cycles();

			expect(cycles.length).toBe(1);
			expect(cycles[0]).toContain('self-dep');
		});
	});

	describe('detect_cycles_by_type', () => {
		it('separates production and dev cycles', () => {
			const repos = [
				// Production cycle
				create_mock_repo({name: 'prod-a', version: '1.0.0', deps: {'prod-b': '^1.0.0'}}),
				create_mock_repo({name: 'prod-b', version: '1.0.0', deps: {'prod-a': '^1.0.0'}}),
				// Dev cycle
				create_mock_repo({name: 'dev-a', version: '1.0.0', devDeps: {'dev-b': '^1.0.0'}}),
				create_mock_repo({name: 'dev-b', version: '1.0.0', devDeps: {'dev-a': '^1.0.0'}}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
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
				create_mock_repo({name: 'peer-a', version: '1.0.0', peerDeps: {'peer-b': '^1.0.0'}}),
				create_mock_repo({name: 'peer-b', version: '1.0.0', peerDeps: {'peer-a': '^1.0.0'}}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
			const {production_cycles, dev_cycles} = graph.detect_cycles_by_type();

			expect(production_cycles.length).toBe(1);
			expect(dev_cycles.length).toBe(0);
		});

		it('handles mixed dependency types (no cycles)', () => {
			// a -> b (prod), b -> a (dev) - this is NOT a cycle in either analysis
			const repos = [
				create_mock_repo({name: 'mixed-a', version: '1.0.0', deps: {'mixed-b': '^1.0.0'}}), // prod dep
				create_mock_repo({name: 'mixed-b', version: '1.0.0', devDeps: {'mixed-a': '^1.0.0'}}), // dev dep back
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
			const {production_cycles, dev_cycles} = graph.detect_cycles_by_type();

			// No production cycle (dev deps excluded) and no dev cycle (prod deps excluded)
			expect(production_cycles.length).toBe(0);
			expect(dev_cycles.length).toBe(0);
		});

		it('handles complex mixed scenarios (no cycles)', () => {
			// a -> b (prod), b -> c (peer), a -> c (dev) - no cycles in either analysis
			const repos = [
				create_mock_repo({
					name: 'complex-a',
					version: '1.0.0',
					deps: {'complex-b': '^1.0.0'},
					devDeps: {'complex-c': '^1.0.0'},
				}),
				create_mock_repo({name: 'complex-b', version: '1.0.0', peerDeps: {'complex-c': '^1.0.0'}}),
				create_mock_repo({name: 'complex-c', version: '1.0.0'}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
			const {production_cycles, dev_cycles} = graph.detect_cycles_by_type();

			// No complete cycles in either analysis
			expect(production_cycles.length).toBe(0);
			expect(dev_cycles.length).toBe(0);
		});

		it('detects actual dev cycles', () => {
			// Real dev cycle: a -> b (dev), b -> a (dev)
			const repos = [
				create_mock_repo({
					name: 'dev-cycle-a',
					version: '1.0.0',
					devDeps: {'dev-cycle-b': '^1.0.0'},
				}),
				create_mock_repo({
					name: 'dev-cycle-b',
					version: '1.0.0',
					devDeps: {'dev-cycle-a': '^1.0.0'},
				}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
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
				create_mock_repo({name: 'lib', version: '1.0.0'}),
				create_mock_repo({name: 'app-1', version: '1.0.0', deps: {lib: '^1.0.0'}}),
				create_mock_repo({name: 'app-2', version: '1.0.0', deps: {lib: '^1.0.0'}}),
			];

			const graph = new Dependency_Graph();
			graph.init_from_repos(repos);
			const dependents = graph.get_dependents('lib');

			expect(dependents).toEqual(new Set(['app-1', 'app-2']));
		});

		it('get_dependencies returns correct map', () => {
			const repo = create_mock_repo({
				name: 'pkg',
				version: '1.0.0',
				deps: {dep1: '^1.0.0'},
				devDeps: {dep2: '^2.0.0'},
			});
			const graph = new Dependency_Graph();
			graph.init_from_repos([repo]);
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
		const repos = [create_mock_repo({name: 'test', version: '1.0.0'})];

		const graph = builder.build_from_repos(repos);

		expect(graph.nodes.size).toBe(1);
	});

	it('computes publishing order excluding dev deps', () => {
		const builder = new Dependency_Graph_Builder();
		const repos = [
			create_mock_repo({name: 'lib', version: '1.0.0'}),
			create_mock_repo({name: 'app', version: '1.0.0', deps: {lib: '^1.0.0'}}),
		];

		const graph = builder.build_from_repos(repos);
		const order = builder.compute_publishing_order(graph);

		expect(order).toEqual(['lib', 'app']);
	});

	describe('analyze', () => {
		it('finds wildcard dependencies', () => {
			const builder = new Dependency_Graph_Builder();
			const repos = [create_mock_repo({name: 'pkg', version: '1.0.0', deps: {dep: '*'}})];

			const graph = builder.build_from_repos(repos);
			const analysis = builder.analyze(graph);

			expect(analysis.wildcard_deps).toEqual([{pkg: 'pkg', dep: 'dep', version: '*'}]);
		});

		it('finds missing peer dependencies', () => {
			const builder = new Dependency_Graph_Builder();
			const repos = [
				create_mock_repo({
					name: 'pkg',
					version: '1.0.0',
					peerDeps: {
						'external-peer': '^1.0.0',
					},
				}),
			];

			const graph = builder.build_from_repos(repos);
			const analysis = builder.analyze(graph);

			expect(analysis.missing_peers).toEqual([{pkg: 'pkg', dep: 'external-peer'}]);
		});

		it('separates cycles by type in analysis', () => {
			const builder = new Dependency_Graph_Builder();
			const repos = [
				create_mock_repo({name: 'prod-a', version: '1.0.0', deps: {'prod-b': '^1.0.0'}}),
				create_mock_repo({name: 'prod-b', version: '1.0.0', deps: {'prod-a': '^1.0.0'}}),
				create_mock_repo({name: 'dev-a', version: '1.0.0', devDeps: {'dev-b': '^1.0.0'}}),
				create_mock_repo({name: 'dev-b', version: '1.0.0', devDeps: {'dev-a': '^1.0.0'}}),
			];

			const graph = builder.build_from_repos(repos);
			const analysis = builder.analyze(graph);

			expect(analysis.production_cycles.length).toBe(1);
			expect(analysis.dev_cycles.length).toBe(1);
		});
	});
});
