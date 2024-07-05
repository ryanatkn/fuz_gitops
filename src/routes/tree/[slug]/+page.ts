import type {EntryGenerator} from './$types.js';

import {parse_deployments} from '$lib/deployments.js';
import {deployments} from '$routes/repos.js';

const parsed = parse_deployments(deployments, 'https://gitops.fuz.dev/');

export const entries: EntryGenerator = () => {
	return parsed.deployments.map((d) => ({slug: d.repo_name}));
};
