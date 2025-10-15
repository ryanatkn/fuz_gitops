import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';
import {styleText as st} from 'node:util';
import {spawn_out} from '@ryanatkn/belt/process.js';

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
		}> = [];

		const start_time = Date.now();

		// Build common args
		const common_args = ['--path', path];
		if (dir) {
			common_args.push('--dir', dir);
		}

		// 1. Run gitops_analyze
		log.info(st('yellow', '📊 Running gitops_analyze...\n'));
		const analyze_start = Date.now();
		try {
			const analyze_result = await spawn_out('gro', ['gitops_analyze', ...common_args]);
			const analyze_duration = Date.now() - analyze_start;

			const analyze_output = analyze_result.stdout || '';
			// Count warning sections (wildcard deps, dev cycles)
			const warning_details: Array<string> = [];
			if (/⚠️\s+Found \d+ wildcard dependencies/.test(analyze_output)) {
				warning_details.push('wildcard dependencies');
			}
			if (/⚠️\s+Found \d+ dev circular dependencies/.test(analyze_output)) {
				warning_details.push('dev circular dependencies');
			}
			const warnings = warning_details.length;
			// Count error sections (production cycles)
			const has_prod_cycles = /❌ Found \d+ production\/peer circular dependencies/.test(
				analyze_output,
			);
			const errors = has_prod_cycles ? 1 : 0;

			results.push({
				command: 'gitops_analyze',
				success: true,
				warnings,
				errors,
				duration: analyze_duration,
				warning_details,
			});

			log.info(st('green', `  ✓ gitops_analyze completed in ${analyze_duration}ms\n`));
			if (warnings > 0) {
				log.warn(st('yellow', `  ⚠️  Found ${warnings} warning(s)\n`));
			}
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

		// 2. Run gitops_preview
		log.info(st('yellow', '🔮 Running gitops_preview...\n'));
		const preview_start = Date.now();
		try {
			const preview_result = await spawn_out('gro', ['gitops_preview', ...common_args]);
			const preview_duration = Date.now() - preview_start;

			const preview_output = preview_result.stdout || '';
			// Count actual warning lines in the Warnings section
			const warnings_section = preview_output.match(/⚠️\s+Warnings:\s+([\s\S]*?)(?=\n\nℹ️|$)/);
			const warnings = warnings_section ? (warnings_section[1].match(/•/g) || []).length : 0;
			// Count error lines in the Errors section
			const errors_section = preview_output.match(/❌ Errors found:\s+([\s\S]*?)(?=\n\n|$)/);
			const errors = errors_section ? (errors_section[1].match(/•/g) || []).length : 0;

			results.push({
				command: 'gitops_preview',
				success: true,
				warnings,
				errors,
				duration: preview_duration,
			});

			log.info(st('green', `  ✓ gitops_preview completed in ${preview_duration}ms\n`));
			if (warnings > 0) {
				log.warn(st('yellow', `  ⚠️  Found ${warnings} warning(s)\n`));
			}
			if (errors > 0) {
				log.error(st('red', `  ❌ Found ${errors} error(s)\n`));
			}
		} catch (error) {
			const preview_duration = Date.now() - preview_start;
			results.push({
				command: 'gitops_preview',
				success: false,
				warnings: 0,
				errors: 1,
				duration: preview_duration,
			});
			log.error(st('red', `  ✗ gitops_preview failed: ${error}\n`));
		}

		// 3. Run gitops_publish --dry
		log.info(st('yellow', '🧪 Running gitops_publish --dry...\n'));
		const dry_start = Date.now();
		try {
			const dry_result = await spawn_out('gro', [
				'gitops_publish',
				'--dry',
				'--no-preview',
				...common_args,
			]);
			const dry_duration = Date.now() - dry_start;

			const dry_output = dry_result.stdout || '';
			// Count actual warning lines in the Warnings section
			const warnings_section = dry_output.match(/⚠️\s+Warnings:\s+([\s\S]*?)(?=\n\n|$)/);
			const warnings = warnings_section ? (warnings_section[1].match(/•/g) || []).length : 0;
			// Count error lines in the Errors section
			const errors_section = dry_output.match(/❌ Errors found:\s+([\s\S]*?)(?=\n\n|$)/);
			const errors = errors_section ? (errors_section[1].match(/•/g) || []).length : 0;

			results.push({
				command: 'gitops_publish --dry',
				success: true,
				warnings,
				errors,
				duration: dry_duration,
			});

			log.info(st('green', `  ✓ gitops_publish --dry completed in ${dry_duration}ms\n`));
			if (warnings > 0) {
				log.warn(st('yellow', `  ⚠️  Found ${warnings} warning(s)\n`));
			}
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
