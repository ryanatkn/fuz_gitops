import {test, assert, describe, beforeAll} from 'vitest';
import {existsSync} from 'node:fs';
import {styleText as st} from 'node:util';

import {
	run_gitops_command,
	load_fixture,
	compare_outputs,
	extract_markdown_sections,
	compare_sections,
	type Command_Output,
} from './helpers.js';

/**
 * Get the path for an output baseline file
 */
const get_output_path = (command: 'gitops_analyze' | 'gitops_preview'): string => {
	return `${command}_output.md`;
};

/**
 * Test Architecture Overview
 * =========================
 *
 * This test suite validates that our gitops publishing commands produce consistent,
 * correct output by comparing runtime behavior against baseline output files.
 *
 * Tests ensure:
 * - Commands run successfully without errors
 * - Output structure matches expected markdown format
 * - Output is consistent between runs
 * - No unexpected changes to command behavior
 */

describe('gitops commands match baseline outputs', () => {
	// Ensure repos are ready before running tests
	beforeAll(async () => {
		// This is a basic check - in CI we'd want to ensure gitops_ready has been run
		const basic_repos = ['../belt', '../fuz', '../gro', '../moss'];
		const missing_repos = basic_repos.filter(repo => !existsSync(repo));

		if (missing_repos.length > 0) {
			console.warn(
				st('yellow',
					`⚠️  Some repos missing: ${missing_repos.join(', ')}\n` +
					'   Run `gro gitops_ready` to ensure all repos are available'
				)
			);
		}
	}, 30000); // Longer timeout for setup

	describe('gitops_analyze', () => {
		let command_output: Command_Output;
		let baseline_content: string;

		beforeAll(async () => {
			// Load baseline output first to ensure it exists
			const output_path = get_output_path('gitops_analyze');
			assert.ok(
				existsSync(`src/fixtures/${output_path}`),
				`Baseline output file missing: src/fixtures/${output_path}. Run 'npm run update:fixtures' to generate.`
			);
			baseline_content = load_fixture(output_path);

			// Run the actual command
			command_output = await run_gitops_command('gitops_analyze');
		}, 60000); // Longer timeout for command execution

		test('command executes successfully', () => {
			if (!command_output.success) {
				console.error('Command stderr:', command_output.stderr);
			}
			assert.ok(command_output.success, `gitops_analyze command failed: ${command_output.stderr}`);
			assert.ok(command_output.stdout.length > 0, 'Command produced no output');
		});

		test('output structure matches expected format', () => {
			const sections = extract_markdown_sections(command_output.stdout);

			// Check for expected sections
			const expected_sections = [
				'summary',
				'publishing_order',
				'internal_dependencies'
			];

			for (const section of expected_sections) {
				assert.ok(
					sections[section],
					`Missing expected section: ${section}`
				);
			}
		});

		test('output matches baseline', () => {
			const comparison = compare_outputs(baseline_content, command_output.stdout);

			if (!comparison.matches) {
				console.log(st('yellow', '\nDetailed differences:'));
				for (const diff of comparison.differences.slice(0, 5)) {
					console.log(`  ${diff}`);
				}
				if (comparison.differences.length > 5) {
					console.log(`  ... and ${comparison.differences.length - 5} more differences`);
				}

				console.log(st('cyan', '\nTip: Run `npm run update:fixtures --verbose` for detailed output'));
			}

			assert.ok(
				comparison.matches,
				`Output differs from baseline (${comparison.differences.length} differences)`
			);
		});

		test('section-by-section comparison', () => {
			const baseline_sections = extract_markdown_sections(baseline_content);
			const actual_sections = extract_markdown_sections(command_output.stdout);
			const section_comparisons = compare_sections(baseline_sections, actual_sections);

			const mismatched_sections = section_comparisons.filter(s => !s.matches);

			if (mismatched_sections.length > 0) {
				console.log(st('yellow', '\nMismatched sections:'));
				for (const {section, differences} of mismatched_sections) {
					console.log(`  • ${section}: ${differences.length} differences`);
				}
			}

			assert.strictEqual(
				mismatched_sections.length,
				0,
				`${mismatched_sections.length} sections don't match: ${mismatched_sections.map(s => s.section).join(', ')}`
			);
		});
	});

	describe('gitops_preview', () => {
		let command_output: Command_Output;
		let baseline_content: string;

		beforeAll(async () => {
			// Load baseline output first to ensure it exists
			const output_path = get_output_path('gitops_preview');
			assert.ok(
				existsSync(`src/fixtures/${output_path}`),
				`Baseline output file missing: src/fixtures/${output_path}. Run 'npm run update:fixtures' to generate.`
			);
			baseline_content = load_fixture(output_path);

			// Run the actual command
			command_output = await run_gitops_command('gitops_preview');
		}, 60000); // Longer timeout for command execution

		test('command executes successfully', () => {
			if (!command_output.success) {
				console.error('Command stderr:', command_output.stderr);
			}
			assert.ok(command_output.success, `gitops_preview command failed: ${command_output.stderr}`);
			assert.ok(command_output.stdout.length > 0, 'Command produced no output');
		});

		test('output structure matches expected format', () => {
			const sections = extract_markdown_sections(command_output.stdout);

			// Check for expected sections in preview output
			const expected_sections = [
				'publishing_order',
				'summary'
			];

			for (const section of expected_sections) {
				assert.ok(
					sections[section],
					`Missing expected section: ${section}. Available: ${Object.keys(sections).join(', ')}`
				);
			}
		});

		test('output matches baseline', () => {
			const comparison = compare_outputs(baseline_content, command_output.stdout);

			if (!comparison.matches) {
				console.log(st('yellow', '\nDetailed differences:'));
				for (const diff of comparison.differences.slice(0, 5)) {
					console.log(`  ${diff}`);
				}
				if (comparison.differences.length > 5) {
					console.log(`  ... and ${comparison.differences.length - 5} more differences`);
				}

				console.log(st('cyan', '\nTip: Run `npm run update:fixtures --verbose` for detailed output'));
			}

			assert.ok(
				comparison.matches,
				`Output differs from baseline (${comparison.differences.length} differences)`
			);
		});

		test('version changes are reasonable', () => {
			// Parse the output to check for reasonable version changes
			const lines = command_output.stdout.split('\n');
			const version_lines = lines.filter(line =>
				line.includes('→') &&
				line.match(/\d+\.\d+\.\d+/)
			);

			// Should have some version changes
			assert.ok(version_lines.length > 0, 'No version changes found in output');

			// Check that version changes follow semver
			for (const line of version_lines) {
				const version_match = line.match(/(\d+\.\d+\.\d+)\s*→\s*(\d+\.\d+\.\d+)/);
				if (version_match) {
					const [, from, to] = version_match;
					assert.ok(from !== to, `Version should change: ${from} → ${to}`);

					// Basic semver validation
					const from_parts = from.split('.').map(Number);
					const to_parts = to.split('.').map(Number);

					assert.ok(
						to_parts[0] >= from_parts[0] &&
						(to_parts[0] > from_parts[0] || to_parts[1] >= from_parts[1]) &&
						(to_parts[0] > from_parts[0] || to_parts[1] > from_parts[1] || to_parts[2] > from_parts[2]),
						`Invalid version progression: ${from} → ${to}`
					);
				}
			}
		});

		test('section-by-section comparison', () => {
			const baseline_sections = extract_markdown_sections(baseline_content);
			const actual_sections = extract_markdown_sections(command_output.stdout);
			const section_comparisons = compare_sections(baseline_sections, actual_sections);

			const mismatched_sections = section_comparisons.filter(s => !s.matches);

			if (mismatched_sections.length > 0) {
				console.log(st('yellow', '\nMismatched sections:'));
				for (const {section, differences} of mismatched_sections) {
					console.log(`  • ${section}: ${differences.length} differences`);
				}
			}

			assert.strictEqual(
				mismatched_sections.length,
				0,
				`${mismatched_sections.length} sections don't match: ${mismatched_sections.map(s => s.section).join(', ')}`
			);
		});
	});
});

describe('command integration tests', () => {
	test('both commands can run without interfering', async () => {
		// Ensure running analyze then preview works correctly
		const analyze_output = await run_gitops_command('gitops_analyze');
		assert.ok(analyze_output.success, 'gitops_analyze should succeed');

		const preview_output = await run_gitops_command('gitops_preview');
		assert.ok(preview_output.success, 'gitops_preview should succeed after analyze');

		// Outputs should be different (they serve different purposes)
		assert.notStrictEqual(
			analyze_output.stdout,
			preview_output.stdout,
			'Commands should produce different outputs'
		);
	}, 120000); // Longer timeout for running both commands

	test('commands produce consistent results on repeated runs', async () => {
		// Run the same command twice and ensure consistent output
		const output1 = await run_gitops_command('gitops_analyze');
		const output2 = await run_gitops_command('gitops_analyze');

		assert.ok(output1.success && output2.success, 'Both runs should succeed');

		const comparison = compare_outputs(output1.stdout, output2.stdout);
		assert.ok(
			comparison.matches,
			`Command should produce consistent results (${comparison.differences.length} differences)`
		);
	}, 120000);
});

/**
 * Future Test Improvements
 * =======================
 *
 * describe('performance benchmarks', () => {
 *   test('commands complete within reasonable time', () => {
 *     // Track execution time for large repo sets
 *   });
 * });
 *
 * describe('error handling', () => {
 *   test('handles missing repos gracefully', () => {
 *     // Test with repos that don't exist
 *   });
 *
 *   test('handles malformed config gracefully', () => {
 *     // Test with invalid gitops.config.ts
 *   });
 * });
 *
 * describe('edge cases', () => {
 *   test('handles repos with no changesets', () => {
 *     // Verify expected warnings
 *   });
 *
 *   test('handles circular dependencies correctly', () => {
 *     // Test cycle detection and handling
 *   });
 * });
 */