import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';

import {get_gitops_ready} from '$lib/gitops_task_helpers.js';

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
		// TODO maybe add `download` that defaults to `true`?
	})
	.strict();
export type Args = z.infer<typeof Args>;

export const task: Task<Args> = {
	Args,
	summary:
		'sets up gitops repos, downloading as needed and switching to the main branch with a clean git workspace',
	run: async ({args, log}) => {
		const {path, dir} = args;

		// Download the repos and `npm install` as needed.
		await get_gitops_ready(path, dir, log, true);
	},
};
