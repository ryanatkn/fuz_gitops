import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';
import {styleText as st} from 'node:util';

import {get_gitops_ready} from '$lib/gitops_task_helpers.js';
import {Dependency_Graph, Dependency_Graph_Builder} from '$lib/dependency_graph.js';
import type {Local_Repo} from '$lib/local_repo.js';

export const Args = z
	.object({
		path: z
			.string()
			.meta({description: 'path to the gitops config file, absolute or relative to the cwd'})
			.default('gitops.config.ts'),
		dir: z
			.string()
			.meta({description: 'path containing the repos, defaults to the parent of the `path` dir'})
			.optional(),
		format: z
			.enum(['stdout', 'json', 'markdown'])
			.meta({description: 'output format'})
			.default('stdout'),
		wildcards: z.boolean().meta({description: 'analyze wildcard dependencies'}).default(true),
		cycles: z.boolean().meta({description: 'detect dependency cycles'}).default(true),
		order: z.boolean().meta({description: 'show publishing order'}).default(true),
	})
	.strict();

export type Args = z.infer<typeof Args>;

export const task: Task<Args> = {
	Args,
	summary: 'analyze dependencies across repos',
	run: async ({args, log}) => {
		const {path, dir, format, wildcards, cycles, order} = args;

		// Get repos ready (without downloading or installing)
		const {local_repos} = await get_gitops_ready(path, dir, false, false, log);

		// Build dependency graph
		const builder = new Dependency_Graph_Builder();
		const graph = builder.build_from_repos(local_repos);

		// Perform analysis
		const analysis = builder.analyze(graph);

		// Get publishing order if requested
		let publishing_order: Array<string> | null = null;
		if (order) {
			try {
				publishing_order = graph.topological_sort();
			} catch (error) {
				// Cycles prevent topological sort
				if (analysis.cycles.length > 0) {
					log.error('Cannot determine publishing order due to circular dependencies');
				}
			}
		}

		// Format output
		switch (format) {
			case 'json':
				output_json(graph, analysis, publishing_order);
				break;
			case 'markdown':
				output_markdown(local_repos, graph, analysis, publishing_order);
				break;
			default:
				output_stdout(local_repos, graph, analysis, publishing_order, log, {
					wildcards,
					cycles,
					order,
				});
		}
	},
};

const output_json = (
	graph: Dependency_Graph,
	analysis: ReturnType<Dependency_Graph_Builder['analyze']>,
	publishing_order: Array<string> | null,
): void => {
	const output = {
		graph: graph.toJSON(),
		analysis,
		publishing_order,
	};
	console.log(JSON.stringify(output, null, 2));
};

const output_markdown = (
	repos: Array<Local_Repo>,
	graph: Dependency_Graph,
	analysis: ReturnType<Dependency_Graph_Builder['analyze']>,
	publishing_order: Array<string> | null,
): void => {
	const lines: Array<string> = ['# Dependency Analysis'];

	// Repos summary
	lines.push('', '## Repositories', '');
	lines.push(`Total: ${repos.length}`);
	lines.push('');
	for (const repo of repos) {
		lines.push(`- ${repo.pkg.name} (${repo.pkg.package_json.version})`);
	}

	// Publishing order
	if (publishing_order) {
		lines.push('', '## Publishing Order', '');
		publishing_order.forEach((name, i) => {
			lines.push(`${i + 1}. ${name}`);
		});
	}

	// Dependency graph
	lines.push('', '## Dependencies', '');
	for (const node of graph.nodes.values()) {
		if (node.dependents.size > 0) {
			lines.push(`- **${node.name}** is used by:`);
			for (const dep of node.dependents) {
				lines.push(`  - ${dep}`);
			}
		}
	}

	// Wildcard dependencies
	if (analysis.wildcard_deps.length > 0) {
		lines.push('', '## Wildcard Dependencies', '');
		lines.push('| Package | Dependency | Version |');
		lines.push('|---------|------------|---------|');
		for (const {pkg, dep, version} of analysis.wildcard_deps) {
			lines.push(`| ${pkg} | ${dep} | ${version} |`);
		}
	}

	// Cycles
	if (analysis.cycles.length > 0) {
		lines.push('', '## ⚠️ Circular Dependencies', '');
		for (const cycle of analysis.cycles) {
			lines.push(`- ${cycle.join(' → ')}`);
		}
	}

	console.log(lines.join('\n'));
};

const output_stdout = (
	repos: Array<Local_Repo>,
	graph: Dependency_Graph,
	analysis: ReturnType<Dependency_Graph_Builder['analyze']>,
	publishing_order: Array<string> | null,
	log: any,
	options: {wildcards: boolean; cycles: boolean; order: boolean},
): void => {
	log.info(st('cyan', `\n📊 Analyzing ${repos.length} repositories\n`));

	// Publishing order
	if (options.order && publishing_order) {
		log.info(st('yellow', 'Publishing order:'));
		publishing_order.forEach((name, i) => {
			const node = graph.get_node(name);
			const version = node ? node.version : 'unknown';
			console.log(`  ${st('dim', `${i + 1}.`)} ${name} ${st('dim', `(${version})`)}`);
		});
		console.log('');
	}

	// Dependencies summary
	log.info(st('yellow', 'Dependency relationships:'));
	for (const node of graph.nodes.values()) {
		const internal_deps = Array.from(node.dependencies.entries()).filter(([name]) =>
			graph.nodes.has(name),
		);
		if (internal_deps.length > 0) {
			console.log(`  ${st('cyan', node.name)}`);
			for (const [dep_name, spec] of internal_deps) {
				const type_color = spec.type === 'peer' ? 'magenta' : spec.type === 'dev' ? 'dim' : 'white';
				console.log(
					`    ${st(type_color, '→')} ${dep_name} ${st('dim', `(${spec.type}: ${spec.version})`)}`,
				);
			}
		}
	}
	console.log('');

	// Wildcard analysis
	if (options.wildcards && analysis.wildcard_deps.length > 0) {
		log.warn(st('yellow', `\n⚠️  Found ${analysis.wildcard_deps.length} wildcard dependencies:`));
		for (const {pkg, dep, version} of analysis.wildcard_deps) {
			console.log(`  ${pkg} → ${dep} ${st('red', version)}`);
		}
		console.log('');
	}

	// Cycle detection
	if (options.cycles) {
		if (analysis.cycles.length > 0) {
			log.error(st('red', `\n❌ Found ${analysis.cycles.length} circular dependencies:`));
			for (const cycle of analysis.cycles) {
				console.log(`  ${cycle.join(' → ')}`);
			}
		} else {
			log.info(st('green', '✅ No circular dependencies detected'));
		}
	}

	// Summary
	const total_deps = Array.from(graph.nodes.values()).reduce(
		(sum, node) => sum + node.dependencies.size,
		0,
	);
	const internal_deps = Array.from(graph.nodes.values()).reduce(
		(sum, node) =>
			sum + Array.from(node.dependencies.keys()).filter((name) => graph.nodes.has(name)).length,
		0,
	);

	console.log('');
	log.info(st('cyan', 'Summary:'));
	console.log(`  Total packages: ${repos.length}`);
	console.log(`  Total dependencies: ${total_deps}`);
	console.log(`  Internal dependencies: ${internal_deps}`);
	console.log(`  Wildcard dependencies: ${analysis.wildcard_deps.length}`);
	console.log(`  Circular dependencies: ${analysis.cycles.length}`);
};

/**
 * Analyzes repos for wildcard dependencies.
 */
export const analyze_wildcards = (
	repos: Array<Local_Repo>,
): Array<{pkg: string; dep: string; version: string; type: 'peer' | 'dev' | 'prod'}> => {
	const wildcards: Array<{
		pkg: string;
		dep: string;
		version: string;
		type: 'peer' | 'dev' | 'prod';
	}> = [];

	for (const repo of repos) {
		// Check dependencies
		if (repo.dependencies) {
			for (const [name, version] of repo.dependencies) {
				if (version === '*') {
					wildcards.push({pkg: repo.pkg.name, dep: name, version, type: 'prod'});
				}
			}
		}

		// Check devDependencies
		if (repo.dev_dependencies) {
			for (const [name, version] of repo.dev_dependencies) {
				if (version === '*') {
					wildcards.push({pkg: repo.pkg.name, dep: name, version, type: 'dev'});
				}
			}
		}

		// Check peerDependencies
		if (repo.peer_dependencies) {
			for (const [name, version] of repo.peer_dependencies) {
				if (version === '*') {
					wildcards.push({pkg: repo.pkg.name, dep: name, version, type: 'peer'});
				}
			}
		}
	}

	return wildcards;
};
