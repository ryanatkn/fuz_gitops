import {spawn_out} from '@ryanatkn/belt/process.js';
import {readFileSync, existsSync, unlinkSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';
import type {Logger} from '@ryanatkn/belt/log.js';

const GITOPS_OUTPUT_DIR = join('.gro', 'fuz_gitops');

export interface Command_Output {
	stdout: string;
	stderr: string;
	success: boolean;
	command: string;
	args: Array<string>;
}

export interface Fixture_Comparison {
	expected: string;
	actual: string;
	matches: boolean;
	differences: Array<string>;
}

/**
 * Execute a gitops command and capture its output.
 * Defaults to using the fixture config for isolated testing.
 */
export const run_gitops_command = async (
	command: 'gitops_analyze' | 'gitops_plan' | 'gitops_publish_dry',
	args: Array<string> = [],
	log?: Logger,
	config_path: string = 'src/fixtures/gitops.fixtures.config.ts',
): Promise<Command_Output> => {
	// Create output directory if it doesn't exist
	if (!existsSync(GITOPS_OUTPUT_DIR)) {
		mkdirSync(GITOPS_OUTPUT_DIR, {recursive: true});
	}

	// Use a file in .gro directory for clean output
	const outfile = join(GITOPS_OUTPUT_DIR, `${command}_output_${Date.now()}.md`);

	// Build command args - handle gitops_publish_dry specially
	let full_args: Array<string>;
	if (command === 'gitops_publish_dry') {
		full_args = [
			'gitops_publish',
			'--dry',
			'--no-plan',
			'--format',
			'markdown',
			'--outfile',
			outfile,
			'--path',
			config_path,
			...args,
		];
	} else {
		full_args = [
			command,
			'--format',
			'markdown',
			'--outfile',
			outfile,
			'--path',
			config_path,
			...args,
		];
	}

	try {
		log?.info(`Running: gro ${full_args.join(' ')}`);
		const result = await spawn_out('gro', full_args, {
			cwd: process.cwd(),
		});

		// Read the output from the file if it exists
		if (existsSync(outfile)) {
			const content = readFileSync(outfile, 'utf-8');
			// Clean up the temp file
			unlinkSync(outfile);

			return {
				stdout: content,
				stderr: result.stderr || '',
				success: true,
				command: 'gro',
				args: full_args,
			};
		} else {
			// If no outfile was created, something went wrong
			return {
				stdout: result.stdout || '',
				stderr: result.stderr || 'Output file not created',
				success: false,
				command: 'gro',
				args: full_args,
			};
		}
	} catch (error) {
		// Clean up temp file if it exists
		if (existsSync(outfile)) {
			unlinkSync(outfile);
		}

		log?.error(`Failed to run command: ${error}`);
		return {
			stdout: '',
			stderr: String(error),
			success: false,
			command: 'gro',
			args: full_args,
		};
	}
};

/**
 * Normalize command output for comparison by removing dynamic elements
 */
export const normalize_output = (output: string): string => {
	return (
		output
			// Remove any timestamps or dates
			.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, 'TIMESTAMP')
			// Remove any specific file paths that might be dynamic
			.replace(/\/[^\s]+\/dev\/[^\s]*/g, '/path/to/repo')
			// Normalize line endings
			.replace(/\r\n/g, '\n')
			// Remove trailing whitespace from lines
			.replace(/[ \t]+$/gm, '')
			// Normalize multiple consecutive empty lines to single
			.replace(/\n{3,}/g, '\n\n')
			// Trim overall content
			.trim()
	);
};

/**
 * Compare predicted vs actual output and generate detailed differences
 */
export const compare_outputs = (predicted: string, actual: string): Fixture_Comparison => {
	const normalized_predicted = normalize_output(predicted);
	const normalized_actual = normalize_output(actual);

	const matches = normalized_predicted === normalized_actual;
	const differences: Array<string> = [];

	if (!matches) {
		// Split into lines for detailed comparison
		const predicted_lines = normalized_predicted.split('\n');
		const actual_lines = normalized_actual.split('\n');

		const max_lines = Math.max(predicted_lines.length, actual_lines.length);

		for (let i = 0; i < max_lines; i++) {
			const predicted_line = predicted_lines[i] || '';
			const actual_line = actual_lines[i] || '';

			if (predicted_line !== actual_line) {
				differences.push(
					`Line ${i + 1}:\n` +
						`  Expected: ${JSON.stringify(predicted_line)}\n` +
						`  Actual:   ${JSON.stringify(actual_line)}`,
				);
			}
		}

		// Add summary difference if lines differ significantly
		if (Math.abs(predicted_lines.length - actual_lines.length) > 0) {
			differences.push(
				`Line count differs: expected ${predicted_lines.length}, actual ${actual_lines.length}`,
			);
		}
	}

	return {
		expected: normalized_predicted,
		actual: normalized_actual,
		matches,
		differences,
	};
};

/**
 * Load a fixture file from the fixtures directory
 */
export const load_fixture = (filename: string): string => {
	const fixture_path = join('src/fixtures', filename);

	if (!existsSync(fixture_path)) {
		throw new Error(`Fixture file not found: ${fixture_path}`);
	}

	return readFileSync(fixture_path, 'utf-8');
};
