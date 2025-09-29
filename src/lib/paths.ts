import {ensure_start, strip_start} from '@ryanatkn/belt/string.js';

/**
 * Base directory for all gitops-generated files.
 */
export const GITOPS_OUTPUT_DIR = '.gro/fuz_gitops';

/**
 * Path to the publishing state file.
 */
export const PUBLISHING_STATE_PATH = GITOPS_OUTPUT_DIR + '/publish_state.json';

/**
 * Get the output path for a specific file
 */
export const get_output_path = (filename: string): string =>
	// TODO probably add `path.ts` to belt and then `path_join`
	GITOPS_OUTPUT_DIR + ensure_start('/', strip_start(filename, './'));
