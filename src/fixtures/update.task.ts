import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';
import {styleText as st} from 'node:util';
import {existsSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';

import {
	run_gitops_command,
	save_actual_output,
	load_fixture,
	compare_outputs,
	get_prediction_path,
	get_actual_path,
	extract_markdown_sections,
	compare_sections,
} from './helpers.js';

const Args = z
	.object({
		update_predictions: z
			.boolean()
			.describe('Update prediction files with actual output instead of comparing')
			.default(false),
		verbose: z
			.boolean()
			.describe('Show detailed differences when comparisons fail')
			.default(false),
	})
	.strict();

type Args = z.infer<typeof Args>;

/**
 * Updates fixture files by running gitops commands and comparing with predictions.
 *
 * Usage:
 *   gro src/fixtures/update                    # Compare actual vs predicted
 *   gro src/fixtures/update --update-predictions  # Update predictions with actual
 *   gro src/fixtures/update --verbose          # Show detailed differences
 */
export const task: Task<Args> = {
	summary: 'update and validate gitops command output fixtures',
	Args,
	run: async ({args, log}): Promise<void> => {
		const {update_predictions, verbose} = args;

		log.info(st('cyan', '🔧 Updating gitops command fixtures...\n'));

		// Ensure actual output directory exists
		const actual_dir = join('src/fixtures/actual');
		if (!existsSync(actual_dir)) {
			mkdirSync(actual_dir, {recursive: true});
			log.info(`Created directory: ${actual_dir}`);
		}

		const commands: Array<'gitops_analyze' | 'gitops_preview'> = ['gitops_analyze', 'gitops_preview'];
		const results: Array<{
			command: string;
			success: boolean;
			matches?: boolean;
			differences?: Array<string>;
		}> = [];

		for (const command of commands) {
			log.info(st('yellow', `\n📋 Processing ${command}...`));

			try {
				// Run the command
				const output = await run_gitops_command(command, [], log);

				if (!output.success) {
					log.error(`❌ Command failed: ${command}`);
					log.error(`   stderr: ${output.stderr}`);
					results.push({command, success: false});
					continue;
				}

				// Save actual output
				const actual_filename = get_actual_path(command);
				save_actual_output(actual_filename, output.stdout);
				log.info(`   Saved actual output to: src/fixtures/actual/${actual_filename}`);

				if (update_predictions) {
					// Update prediction file with actual output
					const prediction_filename = get_prediction_path(command);
					const prediction_path = join('src/fixtures', prediction_filename);

					const fs = require('fs');
					fs.writeFileSync(prediction_path, output.stdout, 'utf-8');
					log.info(st('green', `   ✓ Updated prediction: ${prediction_filename}`));
					results.push({command, success: true});
				} else {
					// Compare with prediction
					try {
						const prediction_filename = get_prediction_path(command);
						const predicted = load_fixture(prediction_filename);
						const comparison = compare_outputs(predicted, output.stdout);

						if (comparison.matches) {
							log.info(st('green', `   ✓ Output matches prediction`));
							results.push({command, success: true, matches: true});
						} else {
							log.warn(st('yellow', `   ⚠️  Output differs from prediction`));
							log.warn(`   Found ${comparison.differences.length} differences`);

							if (verbose) {
								log.info('\n   Detailed differences:');
								for (const diff of comparison.differences.slice(0, 10)) { // Limit to first 10
									log.info(`     ${diff}`);
								}
								if (comparison.differences.length > 10) {
									log.info(`     ... and ${comparison.differences.length - 10} more`);
								}

								// Also show section-by-section comparison
								const predicted_sections = extract_markdown_sections(predicted);
								const actual_sections = extract_markdown_sections(output.stdout);
								const section_comparisons = compare_sections(predicted_sections, actual_sections);

								log.info('\n   Section comparison:');
								for (const {section, matches, differences} of section_comparisons) {
									const status = matches ? '✓' : '✗';
									const color = matches ? 'green' : 'red';
									log.info(st(color, `     ${status} ${section}`));
									if (!matches && differences.length > 0) {
										log.info(`       ${differences.length} differences in this section`);
									}
								}
							}

							results.push({
								command,
								success: true,
								matches: false,
								differences: comparison.differences,
							});
						}
					} catch (error) {
						log.error(`❌ Failed to compare with prediction: ${error}`);
						results.push({command, success: false});
					}
				}
			} catch (error) {
				log.error(`❌ Failed to process ${command}: ${error}`);
				results.push({command, success: false});
			}
		}

		// Summary
		log.info(st('cyan', '\n📊 Summary:'));
		const successful = results.filter(r => r.success);
		const failed = results.filter(r => !r.success);
		const mismatched = results.filter(r => r.success && r.matches === false);

		log.info(`   Commands processed: ${results.length}`);
		log.info(`   Successful: ${successful.length}`);

		if (failed.length > 0) {
			log.info(st('red', `   Failed: ${failed.length}`));
			for (const result of failed) {
				log.info(`     - ${result.command}`);
			}
		}

		if (!update_predictions && mismatched.length > 0) {
			log.info(st('yellow', `   Mismatched: ${mismatched.length}`));
			for (const result of mismatched) {
				log.info(`     - ${result.command} (${result.differences?.length} differences)`);
			}

			log.info(st('yellow', '\n💡 Tips:'));
			log.info('   • Run with --verbose to see detailed differences');
			log.info('   • Run with --update-predictions to update predictions with actual output');
			log.info('   • Check if repos need to be updated with `gro gitops_ready`');
		}

		if (update_predictions) {
			log.info(st('green', '\n✅ Predictions updated successfully'));
		} else if (mismatched.length === 0 && failed.length === 0) {
			log.info(st('green', '\n✅ All outputs match predictions'));
		}

		// Exit with error code if there were failures or mismatches (when not updating)
		if (failed.length > 0 || (!update_predictions && mismatched.length > 0)) {
			throw new Error(`${failed.length} commands failed, ${mismatched.length} outputs mismatched`);
		}
	},
};