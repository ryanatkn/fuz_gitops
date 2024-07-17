import type {Fuz_Config} from '@ryanatkn/fuz/fuz_config.js';
import type {Package_Meta} from '@ryanatkn/gro/package_meta.js';

export interface Gitops_Config {
	repos: Package_Meta[];
}

export const create_gitops_config = (fuz_config: Fuz_Config): Gitops_Config => {
	const config: Gitops_Config = {
		repos: [],
	};

	for (const repo_config of fuz_config.repos) {
		console.log(`url`, repo_config.repo_url);
	}

	return config;
};
