import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';
import {writeFile} from 'node:fs/promises';
import {format_file} from '@ryanatkn/gro/format_file.js';
import {exists} from '@ryanatkn/gro/fs.js';
import {join} from 'node:path';
import {paths} from '@ryanatkn/gro/paths.js';
import {load_from_env} from '@ryanatkn/gro/env.js';

import {fetch_deployments} from '$lib/fetch_deployments.js';
import {load_orc_config} from '$lib/config.js';
import {create_fs_fetch_value_cache} from '$lib/fs_fetch_value_cache.js';

// TODO add flag to ignore or invalidate cache -- no-cache? clean?

// TODO maybe support `--check` for CI
export const Args = z
	.object({
		dir: z
			.string({
				description: 'path to the directory containing the source package.json and fuz.config.ts',
			})
			.optional(),
	})
	.strict();
export type Args = z.infer<typeof Args>;

/**
 * This is a task not a `.gen.` file because it makes network calls.
 */
export const task: Task<Args> = {
	Args,
	summary: 'download metadata for the given deployments',
	run: async ({args, log}) => {
		const {dir} = args;

		const outfile = join(paths.lib, 'deployments.json');

		const orc_config = await load_orc_config(log, dir);

		const cache = await create_fs_fetch_value_cache('deployments');

		// This searches the parent directory for the env var, so we don't use SvelteKit's $env imports
		const token = await load_from_env('GITHUB_TOKEN_SECRET');
		if (!token) {
			log.warn('the env var GITHUB_TOKEN_SECRET was not found, so API calls with be unauthorized');
		}
		const fetched_deployments = await fetch_deployments(
			orc_config.deployments,
			token,
			cache.data,
			dir,
			log,
		);

		await writeFile(
			outfile,
			await format_file(JSON.stringify(fetched_deployments), {filepath: outfile}),
		);

		const types_outfile = outfile + '.d.ts';
		if (!(await exists(types_outfile))) {
			await writeFile(
				types_outfile,
				`declare module '$lib/deployments.json' {
	import type {Deployment} from '@ryanatkn/fuz_gitops/fetch_deployments.js';
	const data: Deployment[];
	export default data;
}
`,
			);
		}

		const changed = await cache.save();
		if (changed) {
			log.info('deployments cache updated');
		} else {
			log.info('deployments cache did not change');
		}
	},
};
