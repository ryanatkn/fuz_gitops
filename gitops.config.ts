import type {CreateGitopsConfig} from './src/lib/gitops_config.js';

const config: CreateGitopsConfig = () => {
	return {
		repos: [
			{
				repo_url: 'https://github.com/ryanatkn/zzz',
				branch: 'main',
			},
			'https://github.com/ryanatkn/moss',
			'https://github.com/ryanatkn/fuz',
			'https://github.com/ryanatkn/gro',
			'https://github.com/ryanatkn/belt',
			{
				repo_url: 'https://github.com/ryanatkn/fuz_template',
				branch: 'main',
			},
			{
				repo_url: 'https://github.com/ryanatkn/fuz_blog',
				branch: 'main',
			},
			{
				repo_url: 'https://github.com/ryanatkn/fuz_mastodon',
				branch: 'main',
			},
			{
				repo_url: 'https://github.com/ryanatkn/fuz_code',
				branch: 'main',
			},
			{
				repo_url: 'https://github.com/ryanatkn/fuz_gitops',
				branch: 'main',
			},
		],
	};
};

export default config;
