import type {Create_Gitops_Config} from './src/lib/gitops_config.js';

const config: Create_Gitops_Config = () => {
	return {
		repos: [
			// 'https://github.com/ryanatkn/zzz',
			'https://github.com/ryanatkn/moss',
			'https://github.com/ryanatkn/fuz',
			'https://github.com/ryanatkn/gro',
			'https://github.com/ryanatkn/belt',
			'https://github.com/ryanatkn/fuz_template',
			'https://github.com/ryanatkn/fuz_blog',
			'https://github.com/ryanatkn/fuz_mastodon',
			'https://github.com/ryanatkn/fuz_code',
			{
				repo_url: 'https://github.com/ryanatkn/fuz_gitops',
				branch: 'upgrade-deps',
			},
			'https://github.com/ryanatkn/webdevladder.net',
			// 'https://github.com/ryanatkn/ryanatkn.com',
		],
	};
};

export default config;
