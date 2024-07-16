import type {EntryGenerator} from './$types.js';

import {parse_repos} from '$lib/repos.js';
import {repos} from '$routes/repos.js';

const parsed = parse_repos(repos, 'https://gitops.fuz.dev/');

export const entries: EntryGenerator = () => {
	return parsed.repos.map((d) => ({slug: d.repo_name}));
};
