import {test, assert, describe, beforeAll} from 'vitest';
import {existsSync} from 'node:fs';

import {run_gitops_command, load_fixture, compare_outputs, type Command_Output} from './helpers.js';

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
		}, 60000);

		test('command executes successfully', () => {
			assert.ok(command_output.success, `Command failed: ${command_output.stderr}`);
			assert.ok(command_output.stdout.length > 0, 'Command produced no output');
		});

		test('output matches baseline', () => {
			const comparison = compare_outputs(baseline_content, command_output.stdout);
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
		}, 60000);

		test('command executes successfully', () => {
			assert.ok(command_output.success, `Command failed: ${command_output.stderr}`);
			assert.ok(command_output.stdout.length > 0, 'Command produced no output');
		});

		test('output matches baseline', () => {
			const comparison = compare_outputs(baseline_content, command_output.stdout);
			assert.ok(
				comparison.matches,
				`Output differs from baseline (${comparison.differences.length} differences). Run 'npm run update:fixtures' to update baseline.`,
			);
		});
	});
});
