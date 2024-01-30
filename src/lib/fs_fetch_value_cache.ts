import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {exists} from '@ryanatkn/gro/fs.js';
import {dirname, join} from 'node:path';
import {paths} from '@ryanatkn/gro/paths.js';
import {format_file} from '@ryanatkn/gro/format_file.js';
import {dequal} from 'dequal';
import {deserialize_cache, serialize_cache, type Fetch_Value_Cache} from '@ryanatkn/belt/fetch.js';

// TODO upstream to Gro probably, and rename/redesign?

export interface Fetch_Cache {
	name: string;
	data: Fetch_Value_Cache; // TODO probably expose an API for this instead of passing the map directly
	/**
	 * @returns a boolean indicating if anything changed, returns `false` if it was a no-op
	 */
	save: () => Promise<boolean>;
}

export const create_fs_fetch_value_cache = async (
	name: string,
	dir = join(paths.build, 'fetch'),
): Promise<Fetch_Cache> => {
	const data_path = join(dir, name + '.json');
	let data: Fetch_Value_Cache;
	if (await exists(data_path)) {
		try {
			data = deserialize_cache(await readFile(data_path, 'utf8')); // TODO pass schema to parse so failures invalidate the cache
		} catch (err) {
			// something went wrong, maybe the data format changed, so clear the cache
			data = new Map();
			await rm(data_path);
		}
	} else {
		data = new Map();
	}
	const initial = structuredClone(data);
	return {
		name,
		data,
		save: async () => {
			if (dequal(initial, data)) {
				return false; // no changes to save
			}
			await mkdir(dirname(data_path), {recursive: true});
			await writeFile(data_path, await format_file(serialize_cache(data), {filepath: data_path}));
			return true;
		},
	};
};
