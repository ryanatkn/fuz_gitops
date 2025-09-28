import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';

import {get_gitops_ready} from '$lib/gitops_task_helpers.js';
import {publish_repos, type Publishing_Options} from '$lib/multi_repo_publisher.js';
import type {Bump_Type} from '$lib/semver.js';

export const Args = z.strictObject({
	branch: z.string().describe('git branch to publish from').default('main'),
	bump: z
		.enum(['major', 'minor', 'patch', 'auto'])
		.describe('version bump type')
		.default('auto'),
	continue_on_error: z
		.boolean()
		.describe('continue publishing if a package fails')
		.default(false),
	update_peers: z
		.boolean()
		.describe('update peer dependencies after publishing')
		.default(true),
	peer_strategy: z
		.enum(['exact', 'caret', 'tilde'])
		.describe('version strategy for peer dependencies')
		.default('caret' as const),
	dry: z
		.boolean()
		.describe('perform a dry run without actually publishing')
		.default(false),
	format: z
		.enum(['stdout', 'json', 'markdown'])
		.describe('output format')
		.default('stdout'),
	deploy: z
		.boolean()
		.describe('deploy all repos after publishing')
		.default(false),
});
export type Args = z.infer<typeof Args>;

export const task: Task<Args> = {
	summary: 'publish all repos in dependency order',
	Args,
	run: async ({args, log}): Promise<void> => {
		const {
			bump,
			continue_on_error,
			update_peers,
			peer_strategy,
			dry,
			format,
			deploy,
		} = args;

		// Load repos
		const {local_repos: repos} = await get_gitops_ready(
			'gitops.config.ts', // Default config path
			undefined, // Use default repos dir
			false, // Don't download if missing
			false, // Don't install
			log,
		);

		// Publishing options
		const options: Publishing_Options = {
			dry,
			bump: bump as Bump_Type | 'auto',
			continue_on_error,
			update_deps: update_peers,
			version_strategy: peer_strategy,
			deploy,
			max_wait: 300000, // 5 minutes
			log,
		};

		// Execute publishing
		const result = await publish_repos(repos, options);

		// Output result based on format
		if (format === 'json') {
			console.log(JSON.stringify(result, null, 2));
		} else if (format === 'markdown') {
			console.log('# Publishing Result\n');
			console.log(`**Status**: ${result.ok ? '✅ Success' : '❌ Failed'}`);
			console.log(`**Duration**: ${(result.duration / 1000).toFixed(1)}s`);
			console.log(`**Published**: ${result.published.length} packages`);
			if (result.failed.length > 0) {
				console.log(`**Failed**: ${result.failed.length} packages`);
			}
			console.log('\n## Published Packages\n');
			for (const pkg of result.published) {
				console.log(`- ${pkg.name}: ${pkg.old_version} → ${pkg.new_version}`);
			}
			if (result.failed.length > 0) {
				console.log('\n## Failed Packages\n');
				for (const {name, error} of result.failed) {
					console.log(`- ${name}: ${error.message}`);
				}
			}
		}
		// stdout format is handled by the publish_repos function's logging

		// Exit with error if failed
		if (!result.ok) {
			process.exit(1);
		}
	},
};