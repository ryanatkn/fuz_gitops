import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';

export const Args = z.object({}).strict();
export type Args = z.infer<typeof Args>;

export const task: Task<Args> = {
	Args,
	summary: 'upgrade and update deployments',
	run: async ({invoke_task}) => {
		await invoke_task('upgrade');
		await invoke_task('deployments');
		await invoke_task('sync');
		// TODO fully automate the update with `gro check`
		// and then `gro changeset` if it's a library,
		// and then `git commit` and `git push` and `gro release`
	},
};
