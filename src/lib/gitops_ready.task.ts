import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';

import {resolve_gitops_config} from '$lib/resolve_gitops_config.js';
import {import_gitops_config, resolve_gitops_paths} from '$lib/gitops_task_helpers.js';

// TODO per-repo `main` branch config

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
	})
	.strict();
export type Args = z.infer<typeof Args>;

export const task: Task<Args> = {
	Args,
	summary:
		'sets up gitops repos, downloading as needed and switching to the main branch with a clean git workspace',
	run: async ({args, log}) => {
		const {path, dir} = args;

		const {config_path, repos_dir} = resolve_gitops_paths(path, dir);

		const gitops_config = await import_gitops_config(config_path);

		log.info('resolving gitops config on the filesystem');
		const {resolved_local_repos, unresolved_local_repos} = await resolve_gitops_config(
			gitops_config,
			repos_dir,
		);

		console.log(`resolved_local_repos`, resolved_local_repos);
		console.log(`unresolved_local_repos`, unresolved_local_repos);
	},
};
