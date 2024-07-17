import {getContext, setContext} from 'svelte';

import {Github_Check_Runs_Item, type Github_Pull_Request} from '$lib/github.js';
import type {Resolved_Local_Repo} from './resolve_gitops_config.js';

export interface Repo extends Resolved_Local_Repo {
	check_runs: Github_Check_Runs_Item | null;
	pull_requests: Github_Pull_Request[] | null;
}

export interface Repos {
	repo: Repo;
	repos: Repo[];
}

const KEY = Symbol('Repos');

export const set_repos = (repos: Repos): Repos => setContext(KEY, repos);

export const get_repos = (): Repos => getContext(KEY);
