import type {Gitops_Config} from '$lib/gitops_config.js';
import {
	resolve_local_repo,
	type Local_Repo,
	type Resolved_Local_Repo,
	type Unresolved_Local_Repo,
} from '$lib/local_repo.js';

export interface Resolved_Gitops_Config {
	local_repos: Local_Repo[] | null;
	resolved_local_repos: Resolved_Local_Repo[] | null;
	unresolved_local_repos: Unresolved_Local_Repo[] | null;
}

/**
 * Resolves repo data locally on the filesystem.
 */
export const resolve_gitops_config = async (
	gitops_config: Gitops_Config,
	repos_dir: string,
): Promise<Resolved_Gitops_Config> => {
	const local_repos = await Promise.all(
		gitops_config.repos.map((r) => resolve_local_repo(r, repos_dir)),
	);

	const resolved_local_repos = local_repos.filter((r) => r.type === 'resolved_local_repo');
	const unresolved_local_repos = local_repos.filter((r) => r.type === 'unresolved_local_repo');

	const config: Resolved_Gitops_Config = {
		local_repos: local_repos.length ? local_repos : null,
		resolved_local_repos: resolved_local_repos.length ? resolved_local_repos : null,
		unresolved_local_repos: unresolved_local_repos.length ? unresolved_local_repos : null,
	};
	return config;
};
