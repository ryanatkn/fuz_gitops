import type {Create_Fuz_Config} from '@ryanatkn/fuz/fuz_config.js';

const config: Create_Fuz_Config = () => {
	return {
		repos: [
			'https://github.com/ryanatkn/fuz',
			'https://github.com/ryanatkn/fuz_template',
			'https://github.com/ryanatkn/fuz_gitops',
			'https://github.com/ryanatkn/fuz_code',
			'https://github.com/ryanatkn/fuz_mastodon',
			'https://github.com/ryanatkn/gro',
		],
	};
};

export default config;
