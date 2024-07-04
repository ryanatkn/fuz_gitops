import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';
import {writeFile} from 'node:fs/promises';
import {format_file} from '@ryanatkn/gro/format_file.js';
import {join} from 'node:path';
import {paths} from '@ryanatkn/gro/paths.js';
import {load_from_env} from '@ryanatkn/gro/env.js';
import {load_fuz_config} from '@ryanatkn/fuz/config.js';

import {fetch_deployments} from '$lib/fetch_deployments.js';
import {create_fs_fetch_value_cache} from '$lib/fs_fetch_value_cache.js';
import {embed_json} from '@ryanatkn/belt/json.js';

// TODO add flag to ignore or invalidate cache -- no-cache? clean?

// TODO maybe support `--check` for CI
export const Args = z
	.object({
		path: z
			.string({
				description: 'path to the fuz config file',
			})
			.default('fuz.config.ts'),
		dir: z
			.string({
				description: 'path to the directory containing the source package.json and fuz config',
			})
			.default(paths.root),
	})
	.strict();
export type Args = z.infer<typeof Args>;

/**
 * This is a task not a `.gen.` file because it makes network calls.
 */
export const task: Task<Args> = {
	Args,
	summary: 'download metadata for the given deployments',
	run: async ({args, log, sveltekit_config}) => {
		const {path, dir} = args;

		const outfile = join(sveltekit_config.routes_path, 'repos.ts');

		const fuz_config = await load_fuz_config(path, dir, log);

		const cache = await create_fs_fetch_value_cache('deployments');

		// This searches the parent directory for the env var, so we don't use SvelteKit's $env imports
		const token = await load_from_env('GITHUB_TOKEN_SECRET');
		if (!token) {
			log.warn('the env var GITHUB_TOKEN_SECRET was not found, so API calls with be unauthorized');
		}
		const fetched_deployments = await fetch_deployments(
			fuz_config.deployments,
			token,
			cache.data,
			dir,
			log,
		);

		// JSON is faster to parse than JS so this is a small optimization.
		const contents = `import type {Deployment} from '@ryanatkn/fuz_gitops/fetch_deployments.js';
export const deployments: Deployment[] = ${embed_json(fetched_deployments)}`;
		await writeFile(outfile, await format_file(contents, {filepath: outfile}));

		const changed = await cache.save();
		if (changed) {
			log.info('deployments cache updated');
		} else {
			log.info('deployments cache did not change');
		}
	},
};
