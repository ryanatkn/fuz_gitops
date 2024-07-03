import type {EntryGenerator} from './$types.js';

import {parse_deployments} from '$lib/deployments.js';
import deployments from '$lib/deployments.json' assert {type: 'json'};

// TODO fix JSON types
const parsed = parse_deployments(deployments as any, 'https://gitops.fuz.dev/');

export const entries: EntryGenerator = async () => {
	return parsed.deployments.map((d) => ({slug: d.repo_name}));
};
