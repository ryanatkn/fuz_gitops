import type {Create_Fuz_Config} from '@ryanatkn/fuz/fuz_config.js';

const config: Create_Fuz_Config = () => {
	return {
		repos: [
			'https://www.fuz.dev/',
			'https://template.fuz.dev/',
			'https://gitops.fuz.dev/',
			'https://code.fuz.dev/',
			'https://mastodon.fuz.dev/',
			'https://gro.ryanatkn.com/',
		],
	};
};

export default config;
