// generated by src/routes/package.gen.ts

import type {Package_Json} from '@grogarden/gro/package_json.js';
import type {Src_Json} from '@grogarden/gro/src_json.js';

export const package_json = {
	name: '@ryanatkn/orc',
	version: '0.15.0',
	description: 'a tool for orchestrating many repos',
	icon: '🪄',
	public: true,
	license: 'MIT',
	homepage: 'https://orc.ryanatkn.com/',
	repository: 'https://github.com/ryanatkn/orc',
	type: 'module',
	engines: {node: '>=20.7'},
	scripts: {
		start: 'gro dev',
		dev: 'gro dev',
		build: 'gro build',
		test: 'gro test',
		deploy: 'gro deploy',
	},
	files: ['dist'],
	peerDependencies: {'@octokit/request': '*', '@sveltejs/kit': '*', dequal: '*', svelte: '*'},
	devDependencies: {
		'@changesets/changelog-git': '^0.2.0',
		'@feltjs/eslint-config': '^0.4.1',
		'@fuz.dev/fuz': '^0.81.0',
		'@fuz.dev/fuz_contextmenu': '^0.6.0',
		'@fuz.dev/fuz_dialog': '^0.5.0',
		'@fuz.dev/fuz_library': '^0.23.0',
		'@grogarden/gro': '^0.105.3',
		'@grogarden/util': '^0.18.0',
		'@octokit/request': '^8.1.6',
		'@sveltejs/adapter-static': '^2.0.3',
		'@sveltejs/kit': '^1.30.3',
		'@sveltejs/package': '^2.2.3',
		'@types/node': '^20.10.4',
		'@typescript-eslint/eslint-plugin': '^6.14.0',
		'@typescript-eslint/parser': '^6.14.0',
		dequal: '^2.0.3',
		eslint: '^8.55.0',
		'eslint-plugin-svelte': '^2.35.1',
		prettier: '^3.1.1',
		'prettier-plugin-svelte': '^3.1.2',
		svelte: '^4.2.8',
		'svelte-check': '^3.6.2',
		tslib: '^2.6.2',
		typescript: '^5.3.3',
		uvu: '^0.5.6',
	},
	eslintConfig: {root: true, extends: '@feltjs', rules: {'no-console': 1}},
	prettier: {
		plugins: ['prettier-plugin-svelte'],
		useTabs: true,
		printWidth: 100,
		singleQuote: true,
		bracketSpacing: false,
		overrides: [{files: 'package.json', options: {useTabs: false}}],
	},
	exports: {
		'./config.js': {default: './dist/config.js', types: './dist/config.d.ts'},
		'./Deployments_Table.svelte': {
			svelte: './dist/Deployments_Table.svelte',
			default: './dist/Deployments_Table.svelte',
			types: './dist/Deployments_Table.svelte.d.ts',
		},
		'./Deployments_Tree.svelte': {
			svelte: './dist/Deployments_Tree.svelte',
			default: './dist/Deployments_Tree.svelte',
			types: './dist/Deployments_Tree.svelte.d.ts',
		},
		'./deployments.json': {
			default: './dist/deployments.json',
			types: './dist/deployments.json.d.ts',
		},
		'./deployments.task.js': {
			default: './dist/deployments.task.js',
			types: './dist/deployments.task.d.ts',
		},
		'./deployments.js': {default: './dist/deployments.js', types: './dist/deployments.d.ts'},
		'./fetch_cache.js': {default: './dist/fetch_cache.js', types: './dist/fetch_cache.d.ts'},
		'./fetch_deployments.js': {
			default: './dist/fetch_deployments.js',
			types: './dist/fetch_deployments.d.ts',
		},
		'./fs_fetch_cache.js': {
			default: './dist/fs_fetch_cache.js',
			types: './dist/fs_fetch_cache.d.ts',
		},
		'./github_helpers.js': {
			default: './dist/github_helpers.js',
			types: './dist/github_helpers.d.ts',
		},
		'./github.js': {default: './dist/github.js', types: './dist/github.d.ts'},
		'./Modules_Detail.svelte': {
			svelte: './dist/Modules_Detail.svelte',
			default: './dist/Modules_Detail.svelte',
			types: './dist/Modules_Detail.svelte.d.ts',
		},
		'./Modules_Menu.svelte': {
			svelte: './dist/Modules_Menu.svelte',
			default: './dist/Modules_Menu.svelte',
			types: './dist/Modules_Menu.svelte.d.ts',
		},
		'./Modules_Page.svelte': {
			svelte: './dist/Modules_Page.svelte',
			default: './dist/Modules_Page.svelte',
			types: './dist/Modules_Page.svelte.d.ts',
		},
		'./orc.task.js': {default: './dist/orc.task.js', types: './dist/orc.task.d.ts'},
		'./Page_Footer.svelte': {
			svelte: './dist/Page_Footer.svelte',
			default: './dist/Page_Footer.svelte',
			types: './dist/Page_Footer.svelte.d.ts',
		},
		'./Page_Header.svelte': {
			svelte: './dist/Page_Header.svelte',
			default: './dist/Page_Header.svelte',
			types: './dist/Page_Header.svelte.d.ts',
		},
		'./Pull_Requests_Detail.svelte': {
			svelte: './dist/Pull_Requests_Detail.svelte',
			default: './dist/Pull_Requests_Detail.svelte',
			types: './dist/Pull_Requests_Detail.svelte.d.ts',
		},
	},
} satisfies Package_Json;

export const src_json = {
	name: '@ryanatkn/orc',
	version: '0.15.0',
	modules: {
		'./config.js': {
			path: 'config.ts',
			declarations: [
				{name: 'Orc_Config', kind: 'variable'},
				{name: 'load_orc_config', kind: 'function'},
			],
		},
		'./Deployments_Table.svelte': {path: 'Deployments_Table.svelte', declarations: []},
		'./Deployments_Tree.svelte': {path: 'Deployments_Tree.svelte', declarations: []},
		'./deployments.json': {path: 'deployments.json', declarations: []},
		'./deployments.task.js': {
			path: 'deployments.task.ts',
			declarations: [
				{name: 'Args', kind: 'variable'},
				{name: 'task', kind: 'variable'},
			],
		},
		'./deployments.js': {
			path: 'deployments.ts',
			declarations: [
				{name: 'Deployments', kind: 'type'},
				{name: 'set_deployments', kind: 'function'},
				{name: 'get_deployments', kind: 'function'},
				{name: 'parse_deployments', kind: 'function'},
			],
		},
		'./fetch_cache.js': {
			path: 'fetch_cache.ts',
			declarations: [
				{name: 'Fetch_Cache', kind: 'type'},
				{name: 'Fetch_Cache_Key', kind: 'variable'},
				{name: 'Fetch_Cache_Data', kind: 'type'},
				{name: 'Fetch_Cache_Item', kind: 'variable'},
				{name: 'CACHE_KEY_SEPARATOR', kind: 'variable'},
				{name: 'to_fetch_cache_key', kind: 'function'},
				{name: 'serialize_cache', kind: 'function'},
				{name: 'deserialize_cache', kind: 'function'},
			],
		},
		'./fetch_deployments.js': {
			path: 'fetch_deployments.ts',
			declarations: [
				{name: 'Deployment', kind: 'type'},
				{name: 'Fetched_Deployment', kind: 'type'},
				{name: 'Unfetched_Deployment', kind: 'type'},
				{name: 'fetch_deployments', kind: 'function'},
				{name: 'fetch_package_json', kind: 'function'},
				{name: 'fetch_src_json', kind: 'function'},
				{name: 'fetch_json', kind: 'function'},
			],
		},
		'./fs_fetch_cache.js': {
			path: 'fs_fetch_cache.ts',
			declarations: [{name: 'create_fs_fetch_cache', kind: 'function'}],
		},
		'./github_helpers.js': {
			path: 'github_helpers.ts',
			declarations: [
				{name: 'Filter_Pull_Request', kind: 'type'},
				{name: 'Pull_Request_Meta', kind: 'type'},
				{name: 'to_pull_requests', kind: 'function'},
				{name: 'to_pull_url', kind: 'function'},
			],
		},
		'./github.js': {
			path: 'github.ts',
			declarations: [
				{name: 'GITHUB_API_VERSION', kind: 'variable'},
				{name: 'Github_Pull_Request', kind: 'variable'},
				{name: 'Github_Check_Runs', kind: 'variable'},
				{name: 'fetch_github_pull_requests', kind: 'function'},
				{name: 'fetch_github_check_runs', kind: 'function'},
			],
		},
		'./Modules_Detail.svelte': {path: 'Modules_Detail.svelte', declarations: []},
		'./Modules_Menu.svelte': {path: 'Modules_Menu.svelte', declarations: []},
		'./Modules_Page.svelte': {path: 'Modules_Page.svelte', declarations: []},
		'./orc.task.js': {
			path: 'orc.task.ts',
			declarations: [
				{name: 'Args', kind: 'variable'},
				{name: 'task', kind: 'variable'},
			],
		},
		'./Page_Footer.svelte': {path: 'Page_Footer.svelte', declarations: []},
		'./Page_Header.svelte': {path: 'Page_Header.svelte', declarations: []},
		'./Pull_Requests_Detail.svelte': {path: 'Pull_Requests_Detail.svelte', declarations: []},
	},
} satisfies Src_Json;

// generated by src/routes/package.gen.ts
