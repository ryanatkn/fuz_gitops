import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';
import {styleText as st} from 'node:util';

import {get_gitops_ready} from '$lib/gitops_task_helpers.js';
import {Dependency_Graph_Builder} from '$lib/dependency_graph.js';
import {Publishing_Orchestrator, type Publishing_Options} from '$lib/publishing_orchestrator.js';
import {
	format_publishing_plan,
	format_publishing_result,
	format_publishing_status,
} from '$lib/publishing_formatter.js';

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
		dry: z.boolean().meta({description: 'output plan without executing'}).default(false),
		format: z
			.enum(['stdout', 'json', 'markdown'])
			.meta({description: 'output format'})
			.default('stdout'),
		bump: z
			.enum(['major', 'minor', 'patch', 'auto'])
			.meta({description: 'version bump strategy'})
			.default('auto'),
		'continue-on-error': z
			.boolean()
			.meta({description: 'continue if a repo fails to publish'})
			.default(false),
		'update-peers': z
			.boolean()
			.meta({description: 'update peer dependencies to exact versions'})
			.default(true),
		'peer-strategy': z
			.enum(['exact', 'caret', 'tilde'])
			.meta({description: 'peer dependency version strategy'})
			.default('caret'),
	})
	.strict();

export type Args = z.infer<typeof Args>;

export const task: Task<Args> = {
	Args,
	summary: 'publish all repos in dependency order',
	run: async ({args, log}) => {
		const {
			path,
			dir,
			dry,
			format,
			bump,
			'continue-on-error': continue_on_error,
			'update-peers': update_peers,
			'peer-strategy': peer_strategy,
		} = args;

		// Get repos ready (without downloading, but with install for accurate deps)
		log.info('Loading repositories...');
		const {local_repos} = await get_gitops_ready(path, dir, false, true, log);

		// Build dependency graph
		log.info('Building dependency graph...');
		const builder = new Dependency_Graph_Builder();
		const graph = builder.build_from_repos(local_repos);

		// Analyze for issues
		const analysis = builder.analyze(graph);

		// Check for cycles
		if (analysis.cycles.length > 0) {
			log.error(st('red', 'Cannot publish due to circular dependencies:'));
			for (const cycle of analysis.cycles) {
				console.log(`  ${cycle.join(' → ')}`);
			}
			throw new Error('Circular dependencies detected');
		}

		// Warn about wildcards
		if (analysis.wildcard_deps.length > 0 && !dry) {
			log.warn(st('yellow', `\n⚠️  Found ${analysis.wildcard_deps.length} wildcard dependencies:`));
			log.warn('These should be resolved before publishing in production');
			for (const {pkg, dep, version} of analysis.wildcard_deps.slice(0, 5)) {
				console.log(`  ${pkg} → ${dep} ${st('red', version)}`);
			}
			if (analysis.wildcard_deps.length > 5) {
				console.log(`  ... and ${analysis.wildcard_deps.length - 5} more`);
			}
			console.log('');
		}

		// Compute publishing order (excluding dev dependencies to break cycles)
		let order: Array<string>;
		try {
			order = graph.topological_sort(true);
		} catch (error) {
			log.error('Failed to determine publishing order:', error);
			throw error;
		}

		// Create orchestrator
		const orchestrator = new Publishing_Orchestrator(graph, order);

		// In dry mode, just show the plan
		if (dry) {
			const output = format_publishing_plan(orchestrator.state, format);
			if (format === 'json') {
				console.log(output);
			} else if (format === 'markdown') {
				console.log(output);
			} else {
				log.info(output);
			}
			return;
		}

		// Execute publishing
		log.info(st('cyan', `\n🚀 Publishing ${order.length} packages...\n`));

		// Show initial status
		console.log(format_publishing_status(orchestrator.state, null));

		// Publishing options
		const options: Publishing_Options = {
			dry: false,
			bump: bump === 'auto' ? 'patch' : bump, // Default to patch for now
			continue_on_error,
			update_peers,
			peer_dependency_strategy: peer_strategy,
			log,
		};

		// Track progress with status updates
		const original_log_info = log.info;
		let current_package: string | null = null;

		// Override log to update status display
		log.info = (message: string) => {
			// Parse current package from log messages
			const match = message.match(/Publishing ([^.]+)\.\.\./);
			if (match) {
				current_package = match[1];
				// Clear previous status and show updated
				process.stdout.write('\x1B[2J\x1B[0f'); // Clear screen
				console.log(st('cyan', `🚀 Publishing ${order.length} packages...\n`));
				console.log(format_publishing_status(orchestrator.state, current_package));
				console.log('');
			}
			original_log_info.call(log, message);
		};

		// Execute
		const result = await orchestrator.execute(options);

		// Restore original log
		log.info = original_log_info;

		// Clear and show final result
		process.stdout.write('\x1B[2J\x1B[0f');
		const output = format_publishing_result(result, format);
		if (format === 'json') {
			console.log(output);
		} else if (format === 'markdown') {
			console.log(output);
		} else {
			log.info(output);
		}

		// Exit with error if failed
		if (!result.ok) {
			process.exit(1);
		}
	},
};
