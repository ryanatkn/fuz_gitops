// generated by src/lib/package.gen.ts

import type {Package_Json} from '@grogarden/gro/package_json.js';

export const package_json = {
	name: '@ryanatkn/orc',
	description: 'a tool for orchestrating many repos',
	version: '0.10.5',
	public: true,
	icon: '🪄',
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
		'@changesets/changelog-git': '^0.1.14',
		'@feltjs/eslint-config': '^0.4.1',
		'@fuz.dev/fuz': '^0.79.2',
		'@fuz.dev/fuz_contextmenu': '^0.6.0',
		'@fuz.dev/fuz_dialog': '^0.5.0',
		'@fuz.dev/fuz_library': '^0.19.4',
		'@grogarden/gro': '^0.100.1',
		'@grogarden/util': '^0.16.0',
		'@octokit/request': '^8.1.4',
		'@sveltejs/adapter-static': '^2.0.3',
		'@sveltejs/kit': '^1.27.2',
		'@sveltejs/package': '^2.2.2',
		'@types/node': '^20.8.10',
		'@typescript-eslint/eslint-plugin': '^6.9.1',
		'@typescript-eslint/parser': '^6.9.1',
		dequal: '^2.0.3',
		eslint: '^8.52.0',
		'eslint-plugin-svelte': '^2.34.0',
		prettier: '^3.0.3',
		'prettier-plugin-svelte': '^3.0.3',
		svelte: '^4.2.2',
		'svelte-check': '^3.5.2',
		tslib: '^2.6.2',
		typescript: '^5.2.2',
		uvu: '^0.5.6',
	},
	eslintConfig: {root: true, extends: '@feltjs'},
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
		'./fetch_cache.js': {default: './dist/fetch_cache.js', types: './dist/fetch_cache.d.ts'},
		'./fetch_packages.js': {
			default: './dist/fetch_packages.js',
			types: './dist/fetch_packages.d.ts',
		},
		'./fs_fetch_cache.js': {
			default: './dist/fs_fetch_cache.js',
			types: './dist/fs_fetch_cache.d.ts',
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
		'./package.gen.js': {default: './dist/package.gen.js', types: './dist/package.gen.d.ts'},
		'./package.js': {default: './dist/package.js', types: './dist/package.d.ts'},
		'./packages.json': {default: './dist/packages.json', types: './dist/packages.json.d.ts'},
		'./packages.task.js': {default: './dist/packages.task.js', types: './dist/packages.task.d.ts'},
		'./Pull_Requests_Detail.svelte': {
			svelte: './dist/Pull_Requests_Detail.svelte',
			default: './dist/Pull_Requests_Detail.svelte',
			types: './dist/Pull_Requests_Detail.svelte.d.ts',
		},
		'./Repo_Table.svelte': {
			svelte: './dist/Repo_Table.svelte',
			default: './dist/Repo_Table.svelte',
			types: './dist/Repo_Table.svelte.d.ts',
		},
		'./sync.task.js': {default: './dist/sync.task.js', types: './dist/sync.task.d.ts'},
	},
	modules: {
		'./config.js': {
			path: 'config.ts',
			declarations: [
				{name: 'Orc_Config', kind: 'VariableDeclaration'},
				{name: 'load_orc_config', kind: 'VariableDeclaration'},
			],
		},
		'./fetch_cache.js': {
			path: 'fetch_cache.ts',
			declarations: [
				{name: 'Fetch_Cache', kind: 'InterfaceDeclaration'},
				{name: 'Fetch_Cache_Key', kind: 'VariableDeclaration'},
				{name: 'Fetch_Cache_Data', kind: 'TypeAliasDeclaration'},
				{name: 'Fetch_Cache_Item', kind: 'VariableDeclaration'},
				{name: 'CACHE_KEY_SEPARATOR', kind: 'VariableDeclaration'},
				{name: 'to_fetch_cache_key', kind: 'VariableDeclaration'},
				{name: 'serialize_cache', kind: 'VariableDeclaration'},
				{name: 'deserialize_cache', kind: 'VariableDeclaration'},
			],
		},
		'./fetch_packages.js': {
			path: 'fetch_packages.ts',
			declarations: [
				{name: 'Maybe_Fetched_Package', kind: 'InterfaceDeclaration'},
				{name: 'Fetched_Package', kind: 'InterfaceDeclaration'},
				{name: 'Unfetchable_Package', kind: 'InterfaceDeclaration'},
				{name: 'Fetched_Package_Meta', kind: 'TypeAliasDeclaration'},
				{name: 'fetch_packages', kind: 'VariableDeclaration'},
			],
		},
		'./fs_fetch_cache.js': {
			path: 'fs_fetch_cache.ts',
			declarations: [{name: 'create_fs_fetch_cache', kind: 'VariableDeclaration'}],
		},
		'./github.js': {
			path: 'github.ts',
			declarations: [
				{name: 'Github_Pull_Request', kind: 'VariableDeclaration'},
				{name: 'fetch_github_pull_requests', kind: 'VariableDeclaration'},
			],
		},
		'./Modules_Detail.svelte': {path: 'Modules_Detail.svelte', declarations: []},
		'./Modules_Menu.svelte': {path: 'Modules_Menu.svelte', declarations: []},
		'./package.gen.js': {path: 'package.gen.ts', declarations: []},
		'./package.js': {
			path: 'package.ts',
			declarations: [{name: 'package_json', kind: 'VariableDeclaration'}],
		},
		'./packages.json': {path: 'packages.json', declarations: []},
		'./packages.task.js': {
			path: 'packages.task.ts',
			declarations: [
				{name: 'Args', kind: 'VariableDeclaration'},
				{name: 'task', kind: 'VariableDeclaration'},
			],
		},
		'./Pull_Requests_Detail.svelte': {path: 'Pull_Requests_Detail.svelte', declarations: []},
		'./Repo_Table.svelte': {path: 'Repo_Table.svelte', declarations: []},
		'./sync.task.js': {
			path: 'sync.task.ts',
			declarations: [{name: 'task', kind: 'VariableDeclaration'}],
		},
	},
} satisfies Package_Json;

// generated by src/lib/package.gen.ts
