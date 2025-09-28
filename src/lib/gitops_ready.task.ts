import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';

import {get_gitops_ready} from '$lib/gitops_task_helpers.js';

// TODO per-repo `main` branch config

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
		download: z.boolean().meta({description: 'dual of no-download'}).default(true),
		'no-download': z.boolean().meta({description: 'opt out of gro download'}).default(false),
		install: z.boolean().meta({description: 'dual of no-install'}).default(true),
		'no-install': z.boolean().meta({description: 'opt out of installing packages'}).default(false),
	})
	.strict();
export type Args = z.infer<typeof Args>;

export const task: Task<Args> = {
	Args,
	summary:
		'sets up gitops repos, downloading as needed and switching to the main branch with a clean git workspace',
	run: async ({args, log}) => {
		const {path, dir, download, install} = args;

		await get_gitops_ready(path, dir, download, install, log);
	},
};
