import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';
import {readFile, writeFile} from 'node:fs/promises';
import {format_file} from '@ryanatkn/gro/format_file.js';
import {basename, resolve} from 'node:path';
import {print_path} from '@ryanatkn/gro/paths.js';
import {load_from_env} from '@ryanatkn/gro/env.js';
import {embed_json} from '@ryanatkn/belt/json.js';
import {load_package_json} from '@ryanatkn/gro/package_json.js';
import {existsSync} from 'node:fs';

import {fetch_repos as fetch_repo_data} from '$lib/fetch_repo_data.js';
import {create_fs_fetch_value_cache} from '$lib/fs_fetch_value_cache.js';
import {get_gitops_ready} from '$lib/gitops_task_helpers.js';

// TODO add flag to ignore or invalidate cache -- no-cache? clean?

// TODO maybe support `--check` for CI
export const Args = z
	.object({
		path: z
			.string({description: 'path to the gitops config file, absolute or relative to the cwd'})
			.default('gitops.config.ts'),
		dir: z
			.string({description: 'path containing the repos, defaults to the parent of the `path` dir'})
			.optional(),
		outdir: z
			.string({description: 'path to the directory for the generated files, defaults to $routes/'})
			.optional(),
		download: z.boolean({description: 'download all missing local repos'}).default(false),
	})
	.strict();
export type Args = z.infer<typeof Args>;

/**
 * This is a task not a `.gen.` file because it makes network calls.
 */
export const task: Task<Args> = {
	Args,
	summary: 'gets gitops ready and runs scripts',
	run: async ({args, log, sveltekit_config}) => {
		const {path, dir, outdir = sveltekit_config.routes_path, download} = args;

		const {local_repos} = await get_gitops_ready(path, dir, log, download);

		const outfile = resolve(outdir, 'repos.ts');

		const cache = await create_fs_fetch_value_cache('repos');

		// This searches the parent directory for the env var, so we don't use SvelteKit's $env imports
		const token = load_from_env('GITHUB_TOKEN_SECRET');
		if (!token) {
			log.warn('the env var GITHUB_TOKEN_SECRET was not found, so API calls with be unauthorized');
		}

		log.info('fetching remote repo data');
		const repos = await fetch_repo_data(local_repos, token, cache.data, log);

		// TODO should package_json be provided in the Gro task/gen contexts? check if it's always loaded
		const package_json = load_package_json();
		const repo_specifier =
			package_json.name === '@ryanatkn/fuz_gitops'
				? '$lib/repo.js'
				: '@ryanatkn/fuz_gitops/repo.js';

		log.info('generating ' + outfile);

		// JSON is faster to parse than JS so we optimize it by embedding the data as a string.
		// TODO the `basename` is used here because we don't have an `origin_id` like with gen,
		// and this file gets re-exported,
		// and we don't want the file to change based on where it's being generated,
		// because for example linking to a local package would change the contents
		const contents = `
			// generated by ${basename(import.meta.filename)}
			import type {Repo} from '${repo_specifier}';

			export const repos: Repo[] = ${embed_json(repos, (s) => JSON.stringify(s, null, '\t'))};
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
			log.info('repos cache updated');
		} else {
			log.info('repos cache did not change');
		}
	},
};
