import type {EntryGenerator} from './$types';

import {parse_deployments} from '$lib/deployments.js';
import deployments from '$lib/deployments.json';

const parsed = parse_deployments(deployments, 'https://gitops.fuz.dev/');

export const entries: EntryGenerator = async () => {
	return parsed.deployments.map((d) => ({slug: d.repo_name}));
};
