import type {EntryGenerator} from './$types';

import maybe_deployments from '$lib/deployments.json';
import {parse_deployments} from '$lib/deployments.js';

const {deployments} = parse_deployments(maybe_deployments, 'https://gitops.fuz.dev/');

export const entries: EntryGenerator = async () => {
	return deployments.map((deployment) => {
		return {slug: deployment.repo_name};
	});
};
