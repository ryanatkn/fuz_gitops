import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';

import {get_gitops_ready} from '$lib/gitops_task_helpers.js';
import {
	publish_repos,
	type Publishing_Options,
	type Publishing_Result,
} from '$lib/multi_repo_publisher.js';
import type {Bump_Type} from '$lib/semver.js';
import {preview_publishing_plan, log_publishing_preview} from '$lib/publishing_preview.js';
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
	preview: z.boolean().describe('show preview before publishing').default(true),
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
			preview,
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

		// Show preview if requested (and not resuming)
		if (preview && !resume && !dry) {
			log.info(st('cyan', '\n📋 Publishing Preview\n'));
			const preview_result = await preview_publishing_plan(repos, log);
			log_publishing_preview(preview_result, log);

			if (preview_result.errors.length > 0) {
				throw new Error('Cannot proceed with publishing due to errors');
			}

			// Ask for confirmation
			log.info(st('yellow', '\n⚠️  This will publish the packages shown above.'));
			log.info('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
			await new Promise((resolve) => setTimeout(resolve, 5000));
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

		// Execute publishing
		const result = await publish_repos(repos, options);

		// Format and output result
		if (format !== 'stdout') {
			const output = format_result(result, format);
			const content = output.join('\n');

			// Write to file if specified
			if (outfile) {
				const {writeFile} = await import('node:fs/promises');
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
		if (!result.ok) {
			process.exit(1);
		}
	},
};

// Format the publishing result for different output formats
const format_result = (result: Publishing_Result, format: 'json' | 'markdown'): Array<string> => {
	if (format === 'json') {
		return JSON.stringify(result, null, 2).split('\n');
	}

	// Markdown format
	const lines: Array<string> = [];

	lines.push('# Publishing Result');
	lines.push('');
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
