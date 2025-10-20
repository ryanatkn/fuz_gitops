import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';
import {styleText as st} from 'node:util';

import {get_gitops_ready} from '$lib/gitops_task_helpers.js';
import {validate_dependency_graph} from '$lib/graph_validation.js';
import {Dependency_Graph_Builder} from '$lib/dependency_graph.js';
import {generate_publishing_plan} from '$lib/publishing_plan.js';
import {publish_repos, type Publishing_Options} from '$lib/multi_repo_publisher.js';
import {log_dependency_analysis} from '$lib/log_helpers.js';

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
	})
	.strict();

export type Args = z.infer<typeof Args>;

export const task: Task<Args> = {
	Args,
	summary:
		'validate gitops configuration by running all read-only commands and checking for issues',
	run: async ({args, log}) => {
		const {path, dir} = args;

		log.info(st('cyan', '\n🔍 Running Gitops Validation Suite\n'));
		log.info(st('dim', 'This runs all read-only commands and checks for consistency.\n'));

		const results: Array<{
			command: string;
			success: boolean;
			warnings: number;
			errors: number;
			duration: number;
			warning_details?: Array<string>;
			info_details?: Array<string>;
			analysis?: ReturnType<Dependency_Graph_Builder['analyze']>;
		}> = [];

		const start_time = Date.now();

		// Load repos once (shared by all commands)
		log.info(st('dim', '📦 Loading repositories...\n'));
		const {local_repos} = await get_gitops_ready(path, dir, false, false, log);
		log.info(st('dim', `   Found ${local_repos.length} local repos\n`));

		// 1. Run gitops_analyze
		log.info(st('yellow', '📊 Running gitops_analyze...\n'));
		const analyze_start = Date.now();
		try {
			// Build dependency graph and validate (but don't throw on cycles for analyze)
			const {graph} = validate_dependency_graph(local_repos, undefined, {
				throw_on_prod_cycles: false, // Analyze should report, not throw
				log_cycles: false, // We'll collect our own statistics
				log_order: false,
			});

			// Perform additional analysis
			const builder = new Dependency_Graph_Builder();
			const analysis = builder.analyze(graph);

			const analyze_duration = Date.now() - analyze_start;

			// Collect warnings, info, and errors
			const warning_details: Array<string> = [];
			const info_details: Array<string> = [];
			if (analysis.wildcard_deps.length > 0) {
				warning_details.push('wildcard dependencies');
			}
			if (analysis.dev_cycles.length > 0) {
				info_details.push('dev circular dependencies');
			}
			const warnings = warning_details.length;
			const errors = analysis.production_cycles.length > 0 ? 1 : 0;

			results.push({
				command: 'gitops_analyze',
				success: true,
				warnings,
				errors,
				duration: analyze_duration,
				warning_details,
				info_details,
				analysis,
			});

			log.info(st('green', `  ✓ gitops_analyze completed in ${analyze_duration}ms\n`));

			// Print detailed analysis
			log_dependency_analysis(analysis, log, '  ');

			if (errors > 0) {
				log.error(st('red', `  ❌ Found ${errors} error(s)\n`));
			}
		} catch (error) {
			const analyze_duration = Date.now() - analyze_start;
			results.push({
				command: 'gitops_analyze',
				success: false,
				warnings: 0,
				errors: 1,
				duration: analyze_duration,
			});
			log.error(st('red', `  ✗ gitops_analyze failed: ${error}\n`));
		}

		// 2. Run gitops_plan
		log.info(st('yellow', '🔮 Running gitops_plan...\n'));
		const plan_start = Date.now();
		try {
			const plan = await generate_publishing_plan(local_repos, undefined);
			const plan_duration = Date.now() - plan_start;

			const warnings = plan.warnings.length;
			const errors = plan.errors.length;

			results.push({
				command: 'gitops_plan',
				success: true,
				warnings,
				errors,
				duration: plan_duration,
			});

			log.info(st('green', `  ✓ gitops_plan completed in ${plan_duration}ms\n`));
			if (warnings > 0) {
				log.warn(st('yellow', `  ⚠️  Found ${warnings} warning(s)\n`));
			}
			if (errors > 0) {
				log.error(st('red', `  ❌ Found ${errors} error(s)\n`));
			}
		} catch (error) {
			const plan_duration = Date.now() - plan_start;
			results.push({
				command: 'gitops_plan',
				success: false,
				warnings: 0,
				errors: 1,
				duration: plan_duration,
			});
			log.error(st('red', `  ✗ gitops_plan failed: ${error}\n`));
		}

		// 3. Run gitops_publish --dry
		log.info(st('yellow', '🧪 Running gitops_publish --dry...\n'));
		const dry_start = Date.now();
		try {
			const options: Publishing_Options = {
				dry: true,
				bump: 'auto',
				continue_on_error: false,
				update_deps: true,
				log: undefined, // Silent for validation
			};

			const result = await publish_repos(local_repos, options);
			const dry_duration = Date.now() - dry_start;

			// Dry run doesn't have warnings/errors in the same format
			// We'll just check if it succeeded
			const errors = result.ok ? 0 : result.failed.length;

			results.push({
				command: 'gitops_publish --dry',
				success: result.ok,
				warnings: 0,
				errors,
				duration: dry_duration,
			});

			log.info(st('green', `  ✓ gitops_publish --dry completed in ${dry_duration}ms\n`));
			if (errors > 0) {
				log.error(st('red', `  ❌ Found ${errors} error(s)\n`));
			}
		} catch (error) {
			const dry_duration = Date.now() - dry_start;
			results.push({
				command: 'gitops_publish --dry',
				success: false,
				warnings: 0,
				errors: 1,
				duration: dry_duration,
			});
			log.error(st('red', `  ✗ gitops_publish --dry failed: ${error}\n`));
		}

		// Summary
		const total_duration = Date.now() - start_time;
		const all_success = results.every((r) => r.success);
		const total_warnings = results.reduce((sum, r) => sum + r.warnings, 0);
		const total_errors = results.reduce((sum, r) => sum + r.errors, 0);

		log.info(st('cyan', '\n📋 Validation Summary\n'));
		log.info(`  Total duration: ${(total_duration / 1000).toFixed(1)}s`);
		log.info(`  Commands run: ${results.length}`);
		log.info(`  Commands succeeded: ${results.filter((r) => r.success).length}`);
		log.info(`  Commands failed: ${results.filter((r) => !r.success).length}`);
		log.info(`  Total warnings: ${total_warnings}`);
		log.info(`  Total errors: ${total_errors}`);

		// Individual command results
		log.info(st('cyan', '\n📊 Command Results:\n'));
		for (const result of results) {
			const status_icon = result.success ? '✓' : '✗';
			const status_color = result.success ? 'green' : 'red';
			const duration = (result.duration / 1000).toFixed(1);

			log.info(st(status_color, `  ${status_icon} ${result.command} (${duration}s)`));
			if (result.warnings > 0) {
				const details = result.warning_details?.length
					? ` (${result.warning_details.join(', ')})`
					: '';
				log.info(st('yellow', `    ⚠️  ${result.warnings} warning(s)${details}`));
			}
			if (result.info_details && result.info_details.length > 0) {
				log.info(st('dim', `    ℹ️  ${result.info_details.join(', ')}`));
			}
			if (result.errors > 0) {
				log.info(st('red', `    ❌ ${result.errors} error(s)`));
			}
		}

		// Final verdict
		log.info('');
		if (all_success && total_errors === 0) {
			log.info(st('green', '✨ All validation checks passed!\n'));
			if (total_warnings > 0) {
				log.warn(
					st('yellow', `⚠️  Note: ${total_warnings} warning(s) found - review output above.\n`),
				);
			}
		} else if (all_success && total_errors > 0) {
			log.warn(st('yellow', '⚠️  Validation completed but found errors - review output above.\n'));
		} else {
			log.error(st('red', '❌ Validation failed - one or more commands did not complete.\n'));
			throw new Error('Validation failed');
		}
	},
};
