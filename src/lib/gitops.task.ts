import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';
import {readFile, writeFile} from 'node:fs/promises';
import {format_file} from '@ryanatkn/gro/format_file.js';
import {basename, resolve} from 'node:path';
import {paths, print_path} from '@ryanatkn/gro/paths.js';
import {load_from_env} from '@ryanatkn/gro/env.js';
import {load_fuz_config} from '@ryanatkn/fuz/config.js';
import {embed_json} from '@ryanatkn/belt/json.js';
import {load_package_json} from '@ryanatkn/gro/package_json.js';
import {existsSync} from 'node:fs';

import {fetch_deployments} from '$lib/fetch_deployments.js';
import {create_fs_fetch_value_cache} from '$lib/fs_fetch_value_cache.js';

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
		outdir: z
			.string({
				description: 'path to the directory for the generated files, defaults to $routes/',
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
	run: async ({args, log, sveltekit_config}) => {
		const {path, dir, outdir = sveltekit_config.routes_path} = args;

		const outfile = resolve(outdir, 'repos.ts');

		const fuz_config = await load_fuz_config(path, dir, log);

		const cache = await create_fs_fetch_value_cache('deployments');

		// This searches the parent directory for the env var, so we don't use SvelteKit's $env imports
		const token = load_from_env('GITHUB_TOKEN_SECRET');
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

		// TODO should package_json be provided in the Gro task/gen contexts? check if it's always loaded
		const package_json = load_package_json(dir);
		const specifier =
			package_json.name === '@ryanatkn/fuz_gitops'
				? '$lib/fetch_deployments.js'
				: '@ryanatkn/fuz_gitops/fetch_deployments.js';

		// JSON is faster to parse than JS so we optimize it by embedding the data as a string.
		// TODO the `basename` is used here because we don't have an `origin_id` like with gen,
		// and this file gets re-exported,
		// and we don't want the file to change based on where it's being generated,
		// because for example linking to a local package would change the contents
		const contents = `
			// generated by ${basename(import.meta.filename)}
			import type {Deployment} from '${specifier}';

			export const deployments: Deployment[] = ${embed_json(fetched_deployments, (s) => JSON.stringify(s, null, '\t'))};
		`;
		// TODO think about possibly using the `gen` functionality in this task, not sure what the API design could look like
		const formatted = await format_file(contents, {filepath: outfile});
		const existing = existsSync(outfile) ? await readFile(outfile, 'utf8') : '';
		if (existing === formatted) {
			log.info(`no changes to ${print_path(outfile)}`);
		} else {
			log.info(`writing changes to ${print_path(outfile)}`);
			await writeFile(outfile, formatted);
		}

		const changed = await cache.save();
		if (changed) {
			log.info('deployments cache updated');
		} else {
			log.info('deployments cache did not change');
		}
	},
};
