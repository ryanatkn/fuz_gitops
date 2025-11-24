import type {EntryGenerator} from './$types.js';

import {Repo, type Repo_Json, repos_parse} from '$lib/repo.svelte.js';
import {repos_json} from '$routes/repos.js';

const parsed = repos_parse(
	repos_json.map((r: Repo_Json) => new Repo(r)),
	'https://gitops.fuz.dev/',
);

export const entries: EntryGenerator = () => {
	return parsed.repos.map((d) => ({slug: d.pkg.repo_name}));
};
