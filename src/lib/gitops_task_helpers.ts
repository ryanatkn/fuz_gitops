import {Task_Error} from '@ryanatkn/gro';
import {styleText as st} from 'node:util';
import {resolve} from 'node:path';

import {load_gitops_config, type Gitops_Config} from '$lib/gitops_config.js';
import {print_path} from '@ryanatkn/gro/paths.js';

export const resolve_gitops_paths = (
	path: string,
	dir: string | undefined,
): {config_path: string; repos_dir: string} => {
	const config_path = resolve(path);

	const repos_dir = dir === undefined ? resolve(config_path, '../..') : resolve(dir);

	return {config_path, repos_dir};
};

export const import_gitops_config = async (config_path: string): Promise<Gitops_Config> => {
	const gitops_config = await load_gitops_config(config_path);
	if (!gitops_config) {
		throw new Task_Error(st('red', `No gitops config found at ${print_path(config_path)}`));
	}
	return gitops_config;
};
