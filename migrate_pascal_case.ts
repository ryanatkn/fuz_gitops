/**
 * Ecosystem-wide migration: UpperSnakeCase → PascalCase
 *
 * Renames all UpperSnakeCase identifiers to PascalCase across
 * the @ryanatkn project ecosystem. Lowercase snake_case identifiers remain unchanged.
 *
 * Pattern: Detects identifiers like FooBar (becomes FooBar) and TFoo (becomes TFoo)
 * but NOT identifiers like foo_bar (stays foo_bar) or FOO_BAR (stays FOO_BAR).
 *
 * Usage:
 *   gro run migrate_pascal_case.ts --dry-run          # Preview changes
 *   gro run migrate_pascal_case.ts                    # Run migration with post-checks
 *   gro run migrate_pascal_case.ts --skip-checks      # Skip gro gen/check
 *   gro run migrate_pascal_case.ts --skip-renames     # Only change content, not filenames
 *   gro run migrate_pascal_case.ts --verbose          # Show detailed output
 *   gro run migrate_pascal_case.ts --repo belt,gro    # Only process specific repos
 *   gro run migrate_pascal_case.ts --json             # Output JSON summary
 */

import {spawn} from 'node:child_process';
import {readFile, writeFile, stat, rename} from 'node:fs/promises';
import {relative} from 'node:path';
import {styleText as st} from 'node:util';

import {get_repo_paths, walk_repo_files, type RepoPath} from './src/lib/repo_ops.js';

/* eslint-disable no-console */

// =============================================================================
// Configuration
// =============================================================================

/**
 * Pattern to match UpperSnakeCase identifiers (non-global for .test()).
 * Matches: FooBar, TFoo, CreateGitopsConfig
 * Does NOT match: foo_bar, FOO_BAR, T (single letter), _Foo_Bar (leading underscore)
 */
const UPPER_SNAKE_PATTERN = /\b([A-Z][a-z0-9]*(?:_[A-Z][a-z0-9]*)+)\b/;

/** Global version for .replace() - resets lastIndex automatically */
const UPPER_SNAKE_PATTERN_GLOBAL = /\b([A-Z][a-z0-9]*(?:_[A-Z][a-z0-9]*)+)\b/g;

// =============================================================================
// Types
// =============================================================================

interface CliOptions {
	dry_run: boolean;
	skip_checks: boolean;
	skip_renames: boolean;
	verbose: boolean;
	json_output: boolean;
	repo_filter: Array<string> | null;
}

interface FileChange {
	path: string;
	type: 'content' | 'rename';
	old_path?: string;
	new_path?: string;
	replacements?: Map<string, number>;
}

interface RepoResult {
	name: string;
	path: string;
	files_scanned: number;
	files_modified: number;
	files_renamed: number;
	identifiers_replaced: number;
	replacements: Map<string, number>;
	changes: Array<FileChange>;
	errors: Array<{path: string; error: string}>;
	collisions: Array<string>;
	gen_success?: boolean;
	check_success?: boolean;
}

interface MigrationSummary {
	repos: Array<RepoResult>;
	totals: {
		files_scanned: number;
		files_modified: number;
		files_renamed: number;
		identifiers_replaced: number;
		collisions: number;
		errors: number;
	};
	top_replacements: Array<{from: string; to: string; count: number}>;
	options: CliOptions;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Convert UpperSnakeCase to PascalCase.
 * Examples: FooBar → FooBar, TFoo → TFoo, CreateGitopsConfig → CreateGitopsConfig
 */
const to_pascal_case = (identifier: string): string => {
	return identifier
		.split('_')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join('');
};

/**
 * Check if filename contains UpperSnakeCase.
 * Uses non-global pattern to avoid lastIndex state issues.
 */
const has_upper_snake_filename = (path: string): boolean => {
	const filename = path.split('/').pop() ?? '';
	return UPPER_SNAKE_PATTERN.test(filename);
};

/**
 * Rename a path from UpperSnakeCase to PascalCase in the filename only.
 */
const rename_path_to_pascal = (path: string): string => {
	const parts = path.split('/');
	const last = parts.at(-1);
	if (!last) return path;
	const renamed = last.replace(UPPER_SNAKE_PATTERN_GLOBAL, (match) => to_pascal_case(match));
	parts[parts.length - 1] = renamed;
	return parts.join('/');
};

/**
 * Check if file exists.
 */
const file_exists = async (path: string): Promise<boolean> => {
	try {
		await stat(path);
		return true;
	} catch {
		return false;
	}
};

/**
 * Check if git repo has uncommitted changes.
 */
const has_uncommitted_changes = async (repo_path: string): Promise<boolean> => {
	return new Promise((resolve) => {
		const proc = spawn('git', ['status', '--porcelain'], {cwd: repo_path});
		let output = '';
		proc.stdout.on('data', (data) => {
			output += data.toString();
		});
		proc.on('close', (code) => {
			resolve(code === 0 && output.trim().length > 0);
		});
		proc.on('error', () => resolve(false));
	});
};

/**
 * Run git mv to rename a file.
 */
const git_rename = async (
	old_path: string,
	new_path: string,
	repo_path: string,
): Promise<boolean> => {
	const relative_old = relative(repo_path, old_path);
	const relative_new = relative(repo_path, new_path);

	return new Promise((resolve) => {
		const proc = spawn('git', ['mv', relative_old, relative_new], {cwd: repo_path});
		proc.on('close', async (code) => {
			if (code === 0) {
				resolve(true);
			} else {
				// Fallback to regular rename
				try {
					await rename(old_path, new_path);
					resolve(true);
				} catch {
					resolve(false);
				}
			}
		});
		proc.on('error', () => resolve(false));
	});
};

/**
 * Run a gro command in a repo.
 */
const run_gro = async (command: string, repo_path: string): Promise<boolean> => {
	return new Promise((resolve) => {
		const proc = spawn('gro', [command], {cwd: repo_path, stdio: 'pipe'});
		proc.on('close', (code) => resolve(code === 0));
		proc.on('error', () => resolve(false));
	});
};

/**
 * Process file content: replace UpperSnakeCase identifiers with PascalCase.
 * Replaces everywhere including strings - the pattern is specific enough
 * (requires CapitalCase segments) that this is safe.
 */
const process_content = (
	content: string,
): {modified: boolean; new_content: string; replacements: Map<string, number>} => {
	const replacements = new Map<string, number>();
	let modified = false;

	const new_content = content.replace(UPPER_SNAKE_PATTERN_GLOBAL, (match) => {
		const pascal = to_pascal_case(match);
		if (pascal !== match) {
			replacements.set(match, (replacements.get(match) ?? 0) + 1);
			modified = true;
		}
		return pascal;
	});

	return {modified, new_content, replacements};
};

// =============================================================================
// Core Migration Logic
// =============================================================================

const process_file = async (file_path: string, dry_run: boolean): Promise<FileChange | null> => {
	try {
		const content = await readFile(file_path, 'utf-8');
		const {modified, new_content, replacements} = process_content(content);

		if (modified) {
			if (!dry_run) {
				await writeFile(file_path, new_content, 'utf-8');
			}
			return {path: file_path, type: 'content', replacements};
		}

		return null;
	} catch (error) {
		// Skip missing files or binary files we can't read
		const err = error as NodeJS.ErrnoException;
		if (err.code === 'ENOENT' || err.code === 'EISDIR' || err.message?.includes('encoding')) {
			return null;
		}
		throw error;
	}
};

const rename_files_in_repo = async (
	repo: RepoPath,
	options: CliOptions,
): Promise<{renames: Array<FileChange>; collisions: Array<string>}> => {
	const renames: Array<FileChange> = [];
	const collisions: Array<string> = [];

	// Collect all paths (files and directories)
	const all_paths: Array<string> = [];
	for await (const file_path of walk_repo_files(repo.path, {include_dirs: true})) {
		all_paths.push(file_path);
	}

	// Sort by depth (deepest first) to rename children before parents
	all_paths.sort((a, b) => b.split('/').length - a.split('/').length);

	for (const old_path of all_paths) {
		if (has_upper_snake_filename(old_path)) {
			const new_path = rename_path_to_pascal(old_path);

			if (new_path !== old_path) {
				if (await file_exists(new_path)) {
					collisions.push(`${old_path} → ${new_path} (target exists)`);
					continue;
				}

				renames.push({
					path: old_path,
					type: 'rename',
					old_path,
					new_path,
				});

				if (!options.dry_run) {
					await git_rename(old_path, new_path, repo.path);
				}
			}
		}
	}

	return {renames, collisions};
};

const migrate_repo = async (
	repo: RepoPath,
	options: CliOptions,
	repo_index: number,
	total_repos: number,
): Promise<RepoResult> => {
	const result: RepoResult = {
		name: repo.name,
		path: repo.path,
		files_scanned: 0,
		files_modified: 0,
		files_renamed: 0,
		identifiers_replaced: 0,
		replacements: new Map(),
		changes: [],
		errors: [],
		collisions: [],
	};

	// Progress indicator
	if (!options.json_output) {
		console.log(`\n${st('cyan', `[${repo_index + 1}/${total_repos}]`)} ${st('bold', repo.name)}`);
	}

	// Check for uncommitted changes
	if (!options.dry_run && (await has_uncommitted_changes(repo.path))) {
		if (!options.json_output) {
			console.log(st('yellow', '  ⚠ Warning: uncommitted changes'));
		}
	}

	// Phase 1: Replace identifiers in file contents
	for await (const file_path of walk_repo_files(repo.path)) {
		result.files_scanned++;

		try {
			const change = await process_file(file_path, options.dry_run);
			if (change) {
				result.files_modified++;
				result.changes.push(change);

				if (change.replacements) {
					for (const [id, count] of change.replacements) {
						result.replacements.set(id, (result.replacements.get(id) ?? 0) + count);
						result.identifiers_replaced += count;
					}
				}

				if (options.verbose && !options.json_output) {
					const relative_path = relative(repo.path, file_path);
					console.log(st('dim', `  ${relative_path}`));
					for (const [from, count] of change.replacements ?? []) {
						console.log(st('dim', `    ${from} → ${to_pascal_case(from)} (${count}×)`));
					}
				}
			}
		} catch (error) {
			result.errors.push({
				path: file_path,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	// Phase 2: Rename files and directories
	if (!options.skip_renames) {
		const {renames, collisions} = await rename_files_in_repo(repo, options);
		result.files_renamed = renames.length;
		result.changes.push(...renames);
		result.collisions = collisions;

		if (collisions.length > 0 && !options.json_output) {
			console.log(st('yellow', `  ⚠ ${collisions.length} collision(s) detected`));
		}

		if (options.verbose && !options.json_output) {
			for (const rename of renames) {
				console.log(st('dim', `  rename: ${rename.old_path} → ${rename.new_path}`));
			}
		}
	}

	// Phase 3: Run gro gen and check
	if (
		!options.dry_run &&
		!options.skip_checks &&
		(result.files_modified > 0 || result.files_renamed > 0)
	) {
		if (!options.json_output) {
			process.stdout.write(st('dim', '  gro gen... '));
		}
		result.gen_success = await run_gro('gen', repo.path);
		if (!options.json_output) {
			console.log(result.gen_success ? st('green', '✓') : st('red', '✗'));
		}

		if (result.gen_success) {
			if (!options.json_output) {
				process.stdout.write(st('dim', '  gro check... '));
			}
			result.check_success = await run_gro('check', repo.path);
			if (!options.json_output) {
				console.log(result.check_success ? st('green', '✓') : st('red', '✗'));
			}
		}
	}

	// Per-repo summary
	if (!options.json_output && (result.files_modified > 0 || result.files_renamed > 0)) {
		const parts = [
			`${result.files_modified} modified`,
			`${result.files_renamed} renamed`,
			`${result.identifiers_replaced} replacements`,
		];
		console.log(st('dim', `  → ${parts.join(', ')}`));
	}

	return result;
};

// =============================================================================
// Output
// =============================================================================

const create_summary = (results: Array<RepoResult>, options: CliOptions): MigrationSummary => {
	const all_replacements = new Map<string, number>();

	const totals = {
		files_scanned: 0,
		files_modified: 0,
		files_renamed: 0,
		identifiers_replaced: 0,
		collisions: 0,
		errors: 0,
	};

	for (const result of results) {
		totals.files_scanned += result.files_scanned;
		totals.files_modified += result.files_modified;
		totals.files_renamed += result.files_renamed;
		totals.identifiers_replaced += result.identifiers_replaced;
		totals.collisions += result.collisions.length;
		totals.errors += result.errors.length;

		for (const [id, count] of result.replacements) {
			all_replacements.set(id, (all_replacements.get(id) ?? 0) + count);
		}
	}

	const top_replacements = Array.from(all_replacements.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 20)
		.map(([from, count]) => ({from, to: to_pascal_case(from), count}));

	return {repos: results, totals, top_replacements, options};
};

const print_summary = (summary: MigrationSummary): void => {
	const {totals, top_replacements, options} = summary;

	console.log('\n' + '═'.repeat(80));
	console.log(
		options.dry_run ? st('cyan', '📋 DRY RUN SUMMARY') : st('green', '✅ MIGRATION SUMMARY'),
	);
	console.log('═'.repeat(80));

	console.log(`\n${st('bold', 'Totals:')}`);
	console.log(`  Files scanned:    ${totals.files_scanned}`);
	console.log(`  Files modified:   ${totals.files_modified}`);
	console.log(`  Files renamed:    ${totals.files_renamed}`);
	console.log(`  Replacements:     ${totals.identifiers_replaced}`);

	if (totals.collisions > 0) {
		console.log(st('yellow', `  Collisions:       ${totals.collisions}`));
	}
	if (totals.errors > 0) {
		console.log(st('red', `  Errors:           ${totals.errors}`));
	}

	if (top_replacements.length > 0) {
		console.log(`\n${st('bold', 'Top replacements:')}`);
		for (const {from, to, count} of top_replacements) {
			console.log(`  ${from} → ${to} ${st('dim', `(${count}×)`)}`);
		}
	}

	// Failed repos
	const failed = summary.repos.filter((r) => r.check_success === false);
	if (failed.length > 0) {
		console.log(`\n${st('red', 'Failed checks:')} ${failed.map((r) => r.name).join(', ')}`);
	}

	if (options.dry_run) {
		console.log(st('cyan', '\n💡 This was a dry run. Run without --dry-run to apply changes.'));
	}
};

const print_json = (summary: MigrationSummary): void => {
	// Convert Maps to plain objects for JSON serialization
	const json_summary = {
		...summary,
		repos: summary.repos.map((r) => ({
			...r,
			replacements: Object.fromEntries(r.replacements),
		})),
	};
	console.log(JSON.stringify(json_summary, null, 2));
};

// =============================================================================
// CLI
// =============================================================================

const parse_args = (): CliOptions => {
	const args = process.argv.slice(2);

	const options: CliOptions = {
		dry_run: args.includes('--dry-run'),
		skip_checks: args.includes('--skip-checks'),
		skip_renames: args.includes('--skip-renames'),
		verbose: args.includes('--verbose') || args.includes('-v'),
		json_output: args.includes('--json'),
		repo_filter: null,
	};

	// Parse --repo flag
	const repo_index = args.findIndex((a) => a === '--repo');
	if (repo_index !== -1) {
		const repo_arg = args[repo_index + 1];
		if (repo_arg) {
			options.repo_filter = repo_arg.split(',').map((s) => s.trim());
		}
	}

	return options;
};

const print_help = (): void => {
	console.log(`
${st('bold', 'UpperSnakeCase → PascalCase Migration')}

${st('bold', 'Usage:')}
  gro run migrate_pascal_case.ts [options]

${st('bold', 'Options:')}
  --dry-run          Preview changes without modifying files
  --skip-checks      Skip running gro gen and gro check after migration
  --skip-renames     Only change identifiers in content, don't rename files
  --verbose, -v      Show detailed output for each file
  --json             Output JSON summary instead of human-readable
  --repo <names>     Only process specific repos (comma-separated)
  --help             Show this help message

${st('bold', 'Examples:')}
  gro run migrate_pascal_case.ts --dry-run           # Preview all changes
  gro run migrate_pascal_case.ts --repo belt,gro     # Only process belt and gro
  gro run migrate_pascal_case.ts --verbose --dry-run # Detailed preview
  gro run migrate_pascal_case.ts --json > out.json   # Machine-readable output
`);
};

const main = async (): Promise<void> => {
	if (process.argv.includes('--help')) {
		print_help();
		return;
	}

	const options = parse_args();

	if (!options.json_output) {
		console.log(st('bold', '🔄 UpperSnakeCase → PascalCase Migration'));
		console.log('═'.repeat(80));
		console.log(`Mode: ${options.dry_run ? st('cyan', 'DRY RUN') : st('yellow', 'WRITE')}`);
		if (options.skip_checks) console.log('Post-checks: ' + st('dim', 'skipped'));
		if (options.skip_renames) console.log('File renames: ' + st('dim', 'skipped'));
		if (options.repo_filter) console.log('Repos: ' + st('cyan', options.repo_filter.join(', ')));
	}

	// Load repos
	let repos = await get_repo_paths();

	// Apply repo filter
	if (options.repo_filter) {
		repos = repos.filter((r) => options.repo_filter!.includes(r.name));
	}

	if (!options.json_output) {
		console.log(`\nFound ${repos.length} repo(s) to process`);
	}

	// Migrate each repo
	const results: Array<RepoResult> = [];
	let repo_index = 0;
	for (const repo of repos) {
		const result = await migrate_repo(repo, options, repo_index, repos.length);
		results.push(result);
		repo_index++;
	}

	// Output summary
	const summary = create_summary(results, options);

	if (options.json_output) {
		print_json(summary);
	} else {
		print_summary(summary);
	}

	// Exit code
	if (summary.totals.errors > 0) {
		process.exit(1);
	}
	if (!options.skip_checks && summary.repos.some((r) => r.check_success === false)) {
		process.exit(1);
	}
};

main().catch((error) => {
	console.error(st('red', 'Fatal error:'), error);
	process.exit(1);
});
