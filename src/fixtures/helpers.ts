import {spawn} from '@ryanatkn/belt/process.js';
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import type {Logger} from '@ryanatkn/belt/log.js';

export interface Command_Output {
	stdout: string;
	stderr: string;
	success: boolean;
	command: string;
	args: string[];
}

export interface Fixture_Comparison {
	predicted: string;
	actual: string;
	matches: boolean;
	differences: Array<string>;
}

/**
 * Execute a gitops command and capture its output
 */
export const run_gitops_command = async (
	command: 'gitops_analyze' | 'gitops_preview',
	args: string[] = [],
	log?: Logger,
): Promise<Command_Output> => {
	const full_args = [command, '--format', 'markdown', ...args];

	try {
		log?.info(`Running: gro ${full_args.join(' ')}`);
		const result = await spawn('gro', full_args, {
			cwd: process.cwd(),
		});

		// Check if we have stdout content regardless of result.ok status
		// The gitops commands may exit with non-zero code but still produce valid output
		if ('stdout' in result && result.stdout) {
			return {
				stdout: result.stdout as string,
				stderr: result.stderr as string || '',
				success: true,
				command: 'gro',
				args: full_args,
			};
		} else {
			return {
				stdout: '',
				stderr: 'stderr' in result ? result.stderr as string : 'Unknown error',
				success: false,
				command: 'gro',
				args: full_args,
			};
		}
	} catch (error) {
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
	return output
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
		.trim();
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
					`  Actual:   ${JSON.stringify(actual_line)}`
				);
			}
		}

		// Add summary difference if lines differ significantly
		if (Math.abs(predicted_lines.length - actual_lines.length) > 0) {
			differences.push(
				`Line count differs: expected ${predicted_lines.length}, actual ${actual_lines.length}`
			);
		}
	}

	return {
		predicted: normalized_predicted,
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

/**
 * Save output to an actual results file
 */
export const save_actual_output = (filename: string, content: string): void => {
	const actual_path = join('src/fixtures/actual', filename);

	// Ensure directory exists
	const fs = require('fs');
	const path = require('path');
	const dir = path.dirname(actual_path);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	writeFileSync(actual_path, content, 'utf-8');
};

/**
 * Get the path for a prediction fixture file
 */
export const get_prediction_path = (command: 'gitops_analyze' | 'gitops_preview'): string => {
	return `${command}_prediction.md`;
};

/**
 * Get the path for an actual output file
 */
export const get_actual_path = (command: 'gitops_analyze' | 'gitops_preview'): string => {
	return `${command}_actual.md`;
};

/**
 * Extract specific sections from markdown output for targeted comparison
 */
export const extract_markdown_sections = (content: string): Record<string, string> => {
	const sections: Record<string, string> = {};
	const lines = content.split('\n');

	let current_section = 'header';
	let current_content: Array<string> = [];

	for (const line of lines) {
		// Check if this is a new section header
		if (line.startsWith('## ')) {
			// Save previous section
			if (current_content.length > 0) {
				sections[current_section] = current_content.join('\n').trim();
			}

			// Start new section
			current_section = line.substring(3).trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
			current_content = [];
		} else {
			current_content.push(line);
		}
	}

	// Save final section
	if (current_content.length > 0) {
		sections[current_section] = current_content.join('\n').trim();
	}

	return sections;
};

/**
 * Compare specific sections of markdown output
 */
export const compare_sections = (
	predicted_sections: Record<string, string>,
	actual_sections: Record<string, string>,
): Array<{section: string; matches: boolean; differences: Array<string>}> => {
	const results: Array<{section: string; matches: boolean; differences: Array<string>}> = [];

	// Get all section names from both
	const all_sections = new Set([
		...Object.keys(predicted_sections),
		...Object.keys(actual_sections),
	]);

	for (const section of all_sections) {
		const predicted = predicted_sections[section] || '';
		const actual = actual_sections[section] || '';

		const comparison = compare_outputs(predicted, actual);

		results.push({
			section,
			matches: comparison.matches,
			differences: comparison.differences,
		});
	}

	return results;
};