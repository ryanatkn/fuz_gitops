import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';
import {writeFile} from 'node:fs/promises';
import {createInterface} from 'node:readline/promises';

import {get_gitops_ready} from '$lib/gitops_task_helpers.js';
import {
	publish_repos,
	type Publishing_Options,
	type Publishing_Result,
} from '$lib/multi_repo_publisher.js';
import type {Bump_Type} from '$lib/semver.js';
import {generate_publishing_plan, log_publishing_plan} from '$lib/publishing_plan.js';
import {styleText as st} from 'node:util';

export const Args = z.strictObject({
	path: z.string().describe('path to the gitops config file').default('gitops.config.ts'),
	dir: z.string().describe('path containing the repos').optional(),
	branch: z.string().describe('git branch to publish from').default('main'),
	bump: z.enum(['major', 'minor', 'patch', 'auto']).describe('version bump type').default('auto'),
	continue_on_error: z.boolean().describe('continue publishing if a package fails').default(false),
	update_peers: z.boolean().describe('update peer dependencies after publishing').default(true),
	peer_strategy: z
		.enum(['exact', 'caret', 'tilde'])
		.describe('version strategy for peer dependencies')
		.default('caret' as const),
	dry: z.boolean().describe('perform a dry run without actually publishing').default(false),
	resume: z.boolean().describe('resume from previous failed publishing state').default(false),
	format: z.enum(['stdout', 'json', 'markdown']).describe('output format').default('stdout'),
	deploy: z.boolean().describe('deploy all repos after publishing').default(false),
	plan: z.boolean().describe('show plan before publishing').default(true),
	outfile: z.string().describe('write output to file instead of logging').optional(),
});
export type Args = z.infer<typeof Args>;

export const task: Task<Args> = {
	summary: 'publish all repos in dependency order',
	Args,
	run: async ({args, log}): Promise<void> => {
		const {
			path,
			dir,
			bump,
			continue_on_error,
			update_peers,
			peer_strategy,
			dry,
			resume,
			format,
			deploy,
			plan,
			outfile,
		} = args;

		// Load repos
		const {local_repos: repos} = await get_gitops_ready(
			path,
			dir,
			false, // Don't download if missing
			false, // Don't install
			log,
		);

		// Show plan if requested (and not resuming)
		if (plan && !resume && !dry) {
			log.info(st('cyan', 'Publishing Plan'));
			const plan_result = await generate_publishing_plan(repos, log);
			log_publishing_plan(plan_result, log);

			if (plan_result.errors.length > 0) {
				throw new Error('Cannot proceed with publishing due to errors');
			}

			// Ask for confirmation
			log.info(st('yellow', '⚠️  This will publish the packages shown above.'));
			process.stdout.write('Continue with publishing? (y/n): ');
			const confirmed = await prompt_for_confirmation();
			if (!confirmed) {
				log.info('Publishing cancelled');
				process.exit(0);
			}
		}

		// Publishing options
		const options: Publishing_Options = {
			dry,
			bump: bump as Bump_Type | 'auto',
			continue_on_error,
			update_deps: update_peers,
			version_strategy: peer_strategy,
			deploy,
			resume,
			max_wait: 300000, // 5 minutes
			log,
		};

		// Execute publishing (may throw on fatal errors like circular dependencies)
		let result: Publishing_Result;
		let fatal_error: Error | null = null;

		try {
			result = await publish_repos(repos, options);
		} catch (error) {
			// Construct a failure result for fatal errors so output can still be generated
			fatal_error = error instanceof Error ? error : new Error(String(error));
			result = {
				ok: false,
				published: [],
				// Note: FATAL_ERROR is a placeholder - only fatal_error.message is displayed in output
				failed: [{name: 'FATAL_ERROR', error: fatal_error}],
				duration: 0,
			};
		}

		// Format and output result (always runs, even on fatal errors)
		if (format !== 'stdout') {
			const output = format_result(result, format, fatal_error);
			const content = output.join('\n');

			// Write to file if specified
			if (outfile) {
				await writeFile(outfile, content);
				log.info(`Output written to ${outfile}`);
			} else {
				// Log line by line
				for (const line of output) {
					log.info(line);
				}
			}
		} else if (outfile) {
			// stdout format with outfile is not supported
			throw new Error('--outfile is not supported with stdout format, use json or markdown');
		}
		// stdout format is handled by the publish_repos function's logging

		// Exit with error if failed
		if (!result.ok || fatal_error) {
			process.exit(1);
		}
	},
};

// Format the publishing result for different output formats
const format_result = (
	result: Publishing_Result,
	format: 'json' | 'markdown',
	fatal_error?: Error | null,
): Array<string> => {
	if (format === 'json') {
		return JSON.stringify(result, null, 2).split('\n');
	}

	// Markdown format
	const lines: Array<string> = [];

	lines.push('# Publishing Result');
	lines.push('');

	// Show fatal error prominently if present
	if (fatal_error) {
		lines.push('## ❌ Fatal Error');
		lines.push('');
		lines.push(`**Error**: ${fatal_error.message}`);
		lines.push('');
		lines.push('Publishing could not proceed due to the error above.');
		lines.push('');
		return lines;
	}

	lines.push(`**Status**: ${result.ok ? '✅ Success' : '❌ Failed'}`);
	lines.push(`**Duration**: ${(result.duration / 1000).toFixed(1)}s`);
	lines.push(`**Published**: ${result.published.length} packages`);

	if (result.failed.length > 0) {
		lines.push(`**Failed**: ${result.failed.length} packages`);
	}

	if (result.published.length > 0) {
		lines.push('');
		lines.push('## Published Packages');
		lines.push('');
		for (const pkg of result.published) {
			lines.push(`- \`${pkg.name}\`: ${pkg.old_version} → ${pkg.new_version}`);
		}
	}

	if (result.failed.length > 0) {
		lines.push('');
		lines.push('## Failed Packages');
		lines.push('');
		for (const {name, error} of result.failed) {
			lines.push(`- \`${name}\`: ${error.message}`);
		}
	}

	return lines;
};

/**
 * Prompts user for y/n confirmation.
 * Returns true if user enters 'y', false otherwise.
 */
const prompt_for_confirmation = async (): Promise<boolean> => {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const answer = await rl.question('');
	rl.close();

	return answer.toLowerCase() === 'y';
};
