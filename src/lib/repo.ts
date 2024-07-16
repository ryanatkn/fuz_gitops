import type {Url} from '@ryanatkn/gro/package_json.js';
import type {Package_Meta} from '@ryanatkn/gro/package_meta.js';

import {Github_Check_Runs_Item, type Github_Pull_Request} from '$lib/github.js';

export type Repo = Fetched_Repo | Unfetched_Repo;

// TODO ideally all of the repos stuff would be in a different repo,
// but this usage of `Package_Meta` would cause a circular dependency between this repo and that one,
// so maybe `Package_Meta` belongs in Gro?
export interface Fetched_Repo extends Package_Meta {
	check_runs: Github_Check_Runs_Item | null;
	pull_requests: Github_Pull_Request[] | null;
}

export interface Unfetched_Repo {
	url: Url;
	package_json: null;
	src_json: null;
	check_runs: null;
	pull_requests: null;
}
