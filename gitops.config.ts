import type {CreateGitopsConfig} from './src/lib/gitops_config.js';

const config: CreateGitopsConfig = () => {
	return {
		repos: [
			// {
			// 	repo_url: 'https://github.com/ryanatkn/zzz',
			// 	branch: 'upgrade-deps',
			// },
			'https://github.com/ryanatkn/moss',
			'https://github.com/ryanatkn/fuz',
			'https://github.com/ryanatkn/gro',
			'https://github.com/ryanatkn/belt',
			// {
			// 	repo_url: 'https://github.com/ryanatkn/fuz_template',
			// 	branch: 'upgrade-deps',
			// },
			// {
			// 	repo_url: 'https://github.com/ryanatkn/fuz_blog',
			// 	branch: 'upgrade-deps',
			// },
			// {
			// 	repo_url: 'https://github.com/ryanatkn/fuz_mastodon',
			// 	branch: 'upgrade-deps',
			// },
			// {
			// 	repo_url: 'https://github.com/ryanatkn/fuz_code',
			// 	branch: 'upgrade-deps',
			// },
			// {
			// 	repo_url: 'https://github.com/ryanatkn/webdevladder.net',
			// 	branch: 'upgrade-deps',
			// },
			// {
			// 	repo_url: 'https://github.com/ryanatkn/ryanatkn.com',
			// 	branch: 'upgrade-deps',
			// },
		],
	};
};

export default config;
