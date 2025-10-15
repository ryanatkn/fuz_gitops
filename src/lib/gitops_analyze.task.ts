import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';
import {styleText as st} from 'node:util';
import {writeFile} from 'node:fs/promises';

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
		outfile: z.string().meta({description: 'write output to file instead of logging'}).optional(),
	})
	.strict();

export type Args = z.infer<typeof Args>;

export const task: Task<Args> = {
	Args,
	summary: 'analyze dependency structure and relationships across repos',
	run: async ({args, log}) => {
		const {path, dir, format, outfile} = args;

		// Get repos ready (without downloading or installing)
		const {local_repos} = await get_gitops_ready(path, dir, false, false, log);

		// Build dependency graph
		const builder = new Dependency_Graph_Builder();
		const graph = builder.build_from_repos(local_repos);

		// Perform analysis
		const analysis = builder.analyze(graph);

		// Get publishing order
		let publishing_order: Array<string> | null = null;
		try {
			// Exclude dev dependencies to break cycles
			publishing_order = graph.topological_sort(true);
		} catch (_error) {
			// Cycles prevent topological sort (should only happen with prod/peer cycles)
			if (analysis.production_cycles.length > 0) {
				log.error(
					'Cannot determine publishing order due to circular dependencies in prod/peer deps',
				);
			}
		}

		// Get formatted output
		const output = get_output(format, {
			repos: local_repos,
			graph,
			analysis,
			publishing_order,
		});

		// Output to file or log
		const content = output.join('\n');
		if (outfile) {
			// Write clean output to file
			await writeFile(outfile, content);
			log.info(`Output written to ${outfile}`);
		} else {
			// Log to console as before
			for (const line of output) {
				log.info(line);
			}
		}
	},
};

// Main output function that delegates to format-specific functions
const get_output = (
	format: 'json' | 'markdown' | 'stdout',
	data: {
		repos: Array<Local_Repo>;
		graph: Dependency_Graph;
		analysis: ReturnType<Dependency_Graph_Builder['analyze']>;
		publishing_order: Array<string> | null;
	},
): Array<string> => {
	switch (format) {
		case 'json':
			return format_json(data.graph, data.analysis, data.publishing_order);
		case 'markdown':
			return format_markdown(data.repos, data.graph, data.analysis, data.publishing_order);
		default:
			return format_stdout(data.repos, data.graph, data.analysis, data.publishing_order);
	}
};

// Helper to calculate common statistics
const calculate_stats = (graph: Dependency_Graph) => {
	const total_deps = Array.from(graph.nodes.values()).reduce(
		(sum, node) => sum + node.dependencies.size,
		0,
	);
	const internal_deps = Array.from(graph.nodes.values()).reduce(
		(sum, node) =>
			sum + Array.from(node.dependencies.keys()).filter((name) => graph.nodes.has(name)).length,
		0,
	);
	return {total_deps, internal_deps};
};

const format_json = (
	graph: Dependency_Graph,
	analysis: ReturnType<Dependency_Graph_Builder['analyze']>,
	publishing_order: Array<string> | null,
): Array<string> => {
	const output = {
		graph: graph.toJSON(),
		analysis,
		publishing_order,
	};
	// Split JSON into lines for consistent handling
	return JSON.stringify(output, null, 2).split('\n');
};

const format_markdown = (
	repos: Array<Local_Repo>,
	graph: Dependency_Graph,
	analysis: ReturnType<Dependency_Graph_Builder['analyze']>,
	publishing_order: Array<string> | null,
): Array<string> => {
	const lines: Array<string> = ['# Dependency Analysis'];

	// Summary stats
	const {total_deps, internal_deps} = calculate_stats(graph);

	lines.push('', '## Summary', '');
	lines.push(`- **Total packages**: ${repos.length}`);
	lines.push(`- **Total dependencies**: ${total_deps}`);
	lines.push(`- **Internal dependencies**: ${internal_deps}`);
	lines.push(`- **Wildcard dependencies**: ${analysis.wildcard_deps.length}`);
	lines.push(`- **Production/peer cycles**: ${analysis.production_cycles.length}`);
	lines.push(`- **Dev cycles**: ${analysis.dev_cycles.length}`);

	// Publishing order
	if (publishing_order) {
		lines.push('', '## Publishing Order', '');
		publishing_order.forEach((name, i) => {
			const node = graph.get_node(name);
			const version = node ? `v${node.version}` : '';
			lines.push(`${i + 1}. \`${name}\` ${version}`);
		});
	}

	// Cycles (show problems first)
	if (analysis.production_cycles.length > 0) {
		lines.push('', '## ❌ Production/Peer Circular Dependencies', '');
		lines.push('> **These block publishing and must be resolved!**');
		lines.push('');
		for (const cycle of analysis.production_cycles) {
			lines.push(`- ${cycle.map((n) => `\`${n}\``).join(' → ')}`);
		}
	}

	if (analysis.dev_cycles.length > 0) {
		lines.push('', '## ⚠️ Dev Circular Dependencies', '');
		lines.push('> These are normal and do not block publishing.');
		lines.push('');
		for (const cycle of analysis.dev_cycles) {
			lines.push(`- ${cycle.map((n) => `\`${n}\``).join(' → ')}`);
		}
	}

	// Wildcard dependencies
	if (analysis.wildcard_deps.length > 0) {
		lines.push('', '## ⚠️ Wildcard Dependencies', '');
		lines.push('| Package | Dependency | Version |');
		lines.push('|---------|------------|---------|');
		for (const {pkg, dep, version} of analysis.wildcard_deps) {
			lines.push(`| \`${pkg}\` | \`${dep}\` | \`${version}\` |`);
		}
	}

	// Dependency graph (simplified)
	lines.push('', '## Internal Dependencies', '');
	for (const node of graph.nodes.values()) {
		const internal_deps = Array.from(node.dependencies.entries()).filter(([name]) =>
			graph.nodes.has(name),
		);
		if (internal_deps.length > 0) {
			lines.push(`- **${node.name}**`);
			for (const [dep_name, spec] of internal_deps) {
				const badge = spec.type === 'peer' ? '(peer)' : spec.type === 'dev' ? '(dev)' : '';
				lines.push(`  - ${dep_name} ${badge}`);
			}
		}
	}

	return lines;
};

const format_stdout = (
	repos: Array<Local_Repo>,
	graph: Dependency_Graph,
	analysis: ReturnType<Dependency_Graph_Builder['analyze']>,
	publishing_order: Array<string> | null,
): Array<string> => {
	const lines: Array<string> = [];

	lines.push(st('cyan', `\n📊 Analyzing ${repos.length} repositories\n`));

	// Publishing order
	if (publishing_order) {
		lines.push(st('yellow', 'Publishing order:'));
		publishing_order.forEach((name, i) => {
			const node = graph.get_node(name);
			const version = node ? node.version : 'unknown';
			lines.push(`  ${st('dim', `${i + 1}.`)} ${name} ${st('dim', `(${version})`)}`);
		});
		lines.push('');
	}

	// Dependencies summary
	lines.push(st('yellow', 'Dependency relationships:'));
	for (const node of graph.nodes.values()) {
		const internal_deps = Array.from(node.dependencies.entries()).filter(([name]) =>
			graph.nodes.has(name),
		);
		if (internal_deps.length > 0) {
			lines.push(`  ${st('cyan', node.name)}`);
			for (const [dep_name, spec] of internal_deps) {
				const type_color = spec.type === 'peer' ? 'magenta' : spec.type === 'dev' ? 'dim' : 'white';
				lines.push(
					`    ${st(type_color, '→')} ${dep_name} ${st('dim', `(${spec.type}: ${spec.version})`)}`,
				);
			}
		}
	}
	lines.push('');

	// Wildcard analysis
	if (analysis.wildcard_deps.length > 0) {
		lines.push(st('yellow', `\n⚠️  Found ${analysis.wildcard_deps.length} wildcard dependencies:`));
		for (const {pkg, dep, version} of analysis.wildcard_deps) {
			lines.push(`  ${pkg} → ${dep} ${st('red', version)}`);
		}
		lines.push('');
	}

	// Cycle detection
	const has_prod_cycles = analysis.production_cycles.length > 0;
	const has_dev_cycles = analysis.dev_cycles.length > 0;

	if (has_prod_cycles) {
		lines.push(
			st(
				'red',
				`\n❌ Found ${analysis.production_cycles.length} production/peer circular dependencies (blocks publishing):`,
			),
		);
		for (const cycle of analysis.production_cycles) {
			lines.push(`  ${st('red', cycle.join(' → '))}`);
		}
	}

	if (has_dev_cycles) {
		lines.push(
			st(
				'yellow',
				`\n⚠️  Found ${analysis.dev_cycles.length} dev circular dependencies (normal, non-blocking):`,
			),
		);
		for (const cycle of analysis.dev_cycles) {
			lines.push(`  ${st('dim', cycle.join(' → '))}`);
		}
	}

	if (!has_prod_cycles && !has_dev_cycles) {
		lines.push(st('green', '✅ No circular dependencies detected'));
	} else if (!has_prod_cycles) {
		lines.push(st('green', '✓ Publishing order computed successfully (dev deps excluded)'));
	}

	// Summary
	const {total_deps, internal_deps} = calculate_stats(graph);

	lines.push('');
	lines.push(st('cyan', 'Summary:'));
	lines.push(`  Total packages: ${repos.length}`);
	lines.push(`  Total dependencies: ${total_deps}`);
	lines.push(`  Internal dependencies: ${internal_deps}`);
	lines.push(`  Wildcard dependencies: ${analysis.wildcard_deps.length}`);
	lines.push(`  Production/peer circular dependencies: ${analysis.production_cycles.length}`);
	lines.push(`  Dev circular dependencies: ${analysis.dev_cycles.length}`);

	return lines;
};
