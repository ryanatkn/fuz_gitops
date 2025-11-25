import {describe, it, expect} from 'vitest';
import {join} from 'node:path';
import {mkdtemp, writeFile, mkdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';

import {
	should_exclude_path,
	walk_repo_files,
	collect_repo_files,
	DEFAULT_EXCLUDE_DIRS,
	DEFAULT_EXCLUDE_EXTENSIONS,
} from '$lib/repo_ops.js';

describe('repo_ops', () => {
	describe('DEFAULT_EXCLUDE_DIRS', () => {
		it('includes common directories to skip', () => {
			expect(DEFAULT_EXCLUDE_DIRS).toContain('node_modules');
			expect(DEFAULT_EXCLUDE_DIRS).toContain('.git');
			expect(DEFAULT_EXCLUDE_DIRS).toContain('.svelte-kit');
			expect(DEFAULT_EXCLUDE_DIRS).toContain('dist');
		});
	});

	describe('DEFAULT_EXCLUDE_EXTENSIONS', () => {
		it('includes binary file extensions', () => {
			expect(DEFAULT_EXCLUDE_EXTENSIONS).toContain('.png');
			expect(DEFAULT_EXCLUDE_EXTENSIONS).toContain('.jpg');
			expect(DEFAULT_EXCLUDE_EXTENSIONS).toContain('.woff2');
		});

		it('includes lock files', () => {
			expect(DEFAULT_EXCLUDE_EXTENSIONS).toContain('.lock');
		});
	});

	describe('should_exclude_path', () => {
		it('excludes paths containing default excluded directories', () => {
			expect(should_exclude_path('/project/node_modules/foo.js')).toBe(true);
			expect(should_exclude_path('/project/.git/config')).toBe(true);
			expect(should_exclude_path('/project/.svelte-kit/output/foo.js')).toBe(true);
			expect(should_exclude_path('/project/dist/bundle.js')).toBe(true);
		});

		it('excludes paths with default excluded extensions', () => {
			expect(should_exclude_path('/project/image.png')).toBe(true);
			expect(should_exclude_path('/project/font.woff2')).toBe(true);
			expect(should_exclude_path('/project/package-lock.lock')).toBe(true);
		});

		it('does not exclude normal source files', () => {
			expect(should_exclude_path('/project/src/lib/foo.ts')).toBe(false);
			expect(should_exclude_path('/project/src/routes/+page.svelte')).toBe(false);
			expect(should_exclude_path('/project/README.md')).toBe(false);
		});

		it('respects custom exclude_dirs option', () => {
			const options = {exclude_dirs: ['custom_dir']};
			expect(should_exclude_path('/project/custom_dir/foo.ts', options)).toBe(true);
			// Default dirs are still excluded
			expect(should_exclude_path('/project/node_modules/foo.ts', options)).toBe(true);
		});

		it('respects custom exclude_extensions option', () => {
			const options = {exclude_extensions: ['.custom']};
			expect(should_exclude_path('/project/file.custom', options)).toBe(true);
			// Default extensions are still excluded
			expect(should_exclude_path('/project/image.png', options)).toBe(true);
		});

		it('respects no_defaults option', () => {
			const options = {no_defaults: true, exclude_dirs: ['only_this']};
			// Default dirs no longer excluded
			expect(should_exclude_path('/project/node_modules/foo.ts', options)).toBe(false);
			// Custom dir is excluded
			expect(should_exclude_path('/project/only_this/foo.ts', options)).toBe(true);
		});
	});

	describe('walk_repo_files', () => {
		let temp_dir: string;

		// Create a temporary directory structure for testing
		const setup_temp_dir = async (): Promise<string> => {
			const dir = await mkdtemp(join(tmpdir(), 'repo_ops_test_'));

			// Create file structure
			await mkdir(join(dir, 'src', 'lib'), {recursive: true});
			await mkdir(join(dir, 'node_modules', 'pkg'), {recursive: true});
			await mkdir(join(dir, '.git'), {recursive: true});

			await writeFile(join(dir, 'src', 'lib', 'foo.ts'), 'export const foo = 1;');
			await writeFile(join(dir, 'src', 'lib', 'bar.ts'), 'export const bar = 2;');
			await writeFile(join(dir, 'src', 'index.ts'), 'export * from "./lib/foo.js";');
			await writeFile(join(dir, 'node_modules', 'pkg', 'index.js'), 'module.exports = {};');
			await writeFile(join(dir, '.git', 'config'), '[core]');
			await writeFile(join(dir, 'image.png'), 'binary data');
			await writeFile(join(dir, 'README.md'), '# Test');

			return dir;
		};

		const cleanup_temp_dir = async (dir: string): Promise<void> => {
			await rm(dir, {recursive: true, force: true});
		};

		it('walks files excluding default directories', async () => {
			temp_dir = await setup_temp_dir();
			try {
				const files = await collect_repo_files(temp_dir);

				// Should include source files
				expect(files.some((f) => f.endsWith('foo.ts'))).toBe(true);
				expect(files.some((f) => f.endsWith('bar.ts'))).toBe(true);
				expect(files.some((f) => f.endsWith('index.ts'))).toBe(true);
				expect(files.some((f) => f.endsWith('README.md'))).toBe(true);

				// Should exclude node_modules and .git
				expect(files.some((f) => f.includes('node_modules'))).toBe(false);
				expect(files.some((f) => f.includes('.git'))).toBe(false);

				// Should exclude binary files
				expect(files.some((f) => f.endsWith('.png'))).toBe(false);
			} finally {
				await cleanup_temp_dir(temp_dir);
			}
		});

		it('yields files via async generator', async () => {
			temp_dir = await setup_temp_dir();
			try {
				const files: Array<string> = [];
				for await (const file of walk_repo_files(temp_dir)) {
					files.push(file);
				}

				expect(files.length).toBeGreaterThan(0);
				expect(files.some((f) => f.endsWith('.ts'))).toBe(true);
			} finally {
				await cleanup_temp_dir(temp_dir);
			}
		});

		it('includes directories when include_dirs is true', async () => {
			temp_dir = await setup_temp_dir();
			try {
				const files = await collect_repo_files(temp_dir, {include_dirs: true});

				// Should include the src and src/lib directories
				expect(files.some((f) => f.endsWith('/src'))).toBe(true);
				expect(files.some((f) => f.endsWith('/src/lib'))).toBe(true);
			} finally {
				await cleanup_temp_dir(temp_dir);
			}
		});

		it('respects custom exclusions', async () => {
			temp_dir = await setup_temp_dir();
			try {
				// Exclude .md files
				const files = await collect_repo_files(temp_dir, {
					exclude_extensions: ['.md'],
				});

				expect(files.some((f) => f.endsWith('README.md'))).toBe(false);
				expect(files.some((f) => f.endsWith('.ts'))).toBe(true);
			} finally {
				await cleanup_temp_dir(temp_dir);
			}
		});

		it('handles non-existent directories gracefully', async () => {
			const files = await collect_repo_files('/non/existent/path');
			expect(files).toEqual([]);
		});
	});

	describe('collect_repo_files', () => {
		it('returns array of all walked files', async () => {
			const temp_dir = await mkdtemp(join(tmpdir(), 'repo_ops_collect_'));
			try {
				await writeFile(join(temp_dir, 'a.ts'), 'a');
				await writeFile(join(temp_dir, 'b.ts'), 'b');

				const files = await collect_repo_files(temp_dir);

				expect(Array.isArray(files)).toBe(true);
				expect(files.length).toBe(2);
				expect(files.some((f) => f.endsWith('a.ts'))).toBe(true);
				expect(files.some((f) => f.endsWith('b.ts'))).toBe(true);
			} finally {
				await rm(temp_dir, {recursive: true, force: true});
			}
		});
	});
});
