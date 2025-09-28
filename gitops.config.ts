import type {Create_Gitops_Config} from './src/lib/gitops_config.js';

const config: Create_Gitops_Config = () => {
	return {
		repos: [
			'https://github.com/ryanatkn/fuz',
			'https://github.com/ryanatkn/fuz_template',
			{repo_url: 'https://github.com/ryanatkn/fuz_gitops', branch: 'publishing'},
			'https://github.com/ryanatkn/fuz_code',
			'https://github.com/ryanatkn/fuz_mastodon',
			'https://github.com/ryanatkn/gro',
		],
	};
};

export default config;
