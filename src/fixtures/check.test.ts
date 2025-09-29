import {test, assert, describe, beforeAll} from 'vitest';
import {existsSync} from 'node:fs';
import {format_file} from '@ryanatkn/gro/format_file.js';

import {run_gitops_command, load_fixture, compare_outputs, type Command_Output} from './helpers.js';

const COMMAND_TIMEOUT = 60_000;

/**
 * Get the path for an output baseline file
 */
const get_output_path = (command: 'gitops_analyze' | 'gitops_preview'): string => {
	return `${command}_output.md`;
};

/**
 * Minimal test suite that compares command output against baseline files.
 * Run `npm run update:fixtures` to generate/update baseline files.
 */
describe('gitops commands match baseline outputs', () => {
	describe('gitops_analyze', () => {
		let command_output: Command_Output;
		let baseline_content: string;

		beforeAll(async () => {
			// Load baseline output
			const output_path = get_output_path('gitops_analyze');
			assert.ok(
				existsSync(`src/fixtures/${output_path}`),
				`Baseline file missing: src/fixtures/${output_path}. Run 'npm run update:fixtures' to generate.`,
			);
			baseline_content = load_fixture(output_path);

			// Run the command
			command_output = await run_gitops_command('gitops_analyze');
		}, COMMAND_TIMEOUT);

		test('command executes successfully', () => {
			assert.ok(command_output.success, `Command failed: ${command_output.stderr}`);
			assert.ok(command_output.stdout.length > 0, 'Command produced no output');
		});

		test('output matches baseline', async () => {
			const output_path = get_output_path('gitops_analyze');
			const formatted_output = await format_file(command_output.stdout, {filepath: output_path});
			const comparison = compare_outputs(baseline_content, formatted_output);
			assert.ok(
				comparison.matches,
				`Output differs from baseline (${comparison.differences.length} differences). Run 'npm run update:fixtures' to update baseline.`,
			);
		});
	});

	describe('gitops_preview', () => {
		let command_output: Command_Output;
		let baseline_content: string;

		beforeAll(async () => {
			// Load baseline output
			const output_path = get_output_path('gitops_preview');
			assert.ok(
				existsSync(`src/fixtures/${output_path}`),
				`Baseline file missing: src/fixtures/${output_path}. Run 'npm run update:fixtures' to generate.`,
			);
			baseline_content = load_fixture(output_path);

			// Run the command
			command_output = await run_gitops_command('gitops_preview');
		}, COMMAND_TIMEOUT);

		test('command executes successfully', () => {
			assert.ok(command_output.success, `Command failed: ${command_output.stderr}`);
			assert.ok(command_output.stdout.length > 0, 'Command produced no output');
		});

		test('output matches baseline', async () => {
			const output_path = get_output_path('gitops_preview');
			const formatted_output = await format_file(command_output.stdout, {filepath: output_path});
			const comparison = compare_outputs(baseline_content, formatted_output);
			assert.ok(
				comparison.matches,
				`Output differs from baseline (${comparison.differences.length} differences). Run 'npm run update:fixtures' to update baseline.`,
			);
		});
	});
});
