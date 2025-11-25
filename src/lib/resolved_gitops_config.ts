import type {GitopsConfig} from './gitops_config.js';
import {
	resolve_local_repo,
	type MaybeLocalRepo,
	type ResolvedLocalRepo,
	type UnresolvedLocalRepo,
} from './local_repo.js';

export interface ResolvedGitopsConfig {
	local_repos: Array<MaybeLocalRepo> | null;
	resolved_local_repos: Array<ResolvedLocalRepo> | null;
	unresolved_local_repos: Array<UnresolvedLocalRepo> | null;
}

export const resolve_gitops_config = (
	gitops_config: GitopsConfig,
	repos_dir: string,
): ResolvedGitopsConfig => {
	const local_repos = gitops_config.repos.map((r) =>
		resolve_local_repo({repo_config: r, repos_dir}),
	);

	const resolved_local_repos = local_repos.filter((r) => r.type === 'resolved_local_repo');
	const unresolved_local_repos = local_repos.filter((r) => r.type === 'unresolved_local_repo');

	const config: ResolvedGitopsConfig = {
		local_repos: local_repos.length ? local_repos : null,
		resolved_local_repos: resolved_local_repos.length ? resolved_local_repos : null,
		unresolved_local_repos: unresolved_local_repos.length ? unresolved_local_repos : null,
	};
	return config;
};
