import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';
import {styleText as st} from 'node:util';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {run_gitops_command} from './helpers.js';
import {format_file} from '@ryanatkn/gro/format_file.js';
import {generate_all_fixtures, fixtures_exist} from './generate_repos.js';
import {basic_publishing} from './repo_fixtures/basic_publishing.js';
import {deep_cascade} from './repo_fixtures/deep_cascade.js';
import {circular_dev_deps} from './repo_fixtures/circular_dev_deps.js';
import {private_packages} from './repo_fixtures/private_packages.js';
import {major_bumps} from './repo_fixtures/major_bumps.js';
import {peer_deps_only} from './repo_fixtures/peer_deps_only.js';
import {circular_prod_deps_error} from './repo_fixtures/circular_prod_deps_error.js';
import {isolated_packages} from './repo_fixtures/isolated_packages.js';
import {multiple_dep_types} from './repo_fixtures/multiple_dep_types.js';

// All fixture sets
const FIXTURES = [
	basic_publishing,
	deep_cascade,
	circular_dev_deps,
	private_packages,
	major_bumps,
	peer_deps_only,
	circular_prod_deps_error,
	isolated_packages,
	multiple_dep_types,
];

const Args = z
	.object({
		verbose: z.boolean().describe('Show detailed command output').default(false),
	})
	.strict();

type Args = z.infer<typeof Args>;

/**
 * Captures gitops command output to baseline files for testing.
 *
 * Usage:
 *   gro src/fixtures/update                    # Generate output files
 *   gro src/fixtures/update --verbose          # Show detailed command output
 */
export const task: Task<Args> = {
	summary: 'capture gitops command output as baseline files',
	Args,
	run: async ({args, log}): Promise<void> => {
		const {verbose} = args;

		log.info(st('cyan', '🔧 Capturing gitops command outputs...\n'));

		// Generate fixture repos if missing
		log.info('Checking fixture repositories...');
		const missing = FIXTURES.some((f) => !fixtures_exist(f.name));

		if (missing) {
			log.info(st('yellow', '  Generating fixture repos (some are missing)...\n'));
			await generate_all_fixtures(FIXTURES, log);
			log.info('');
		} else {
			log.info(st('green', '  ✓ Fixture repos already exist\n'));
		}

		// Ensure output directory exists
		const output_dir = 'src/fixtures';
		if (!existsSync(output_dir)) {
			mkdirSync(output_dir, {recursive: true});
			log.info(`Created directory: ${output_dir}`);
		}

		const commands: Array<'gitops_analyze' | 'gitops_preview' | 'gitops_publish_dry'> = [
			'gitops_analyze',
			'gitops_preview',
			'gitops_publish_dry',
		];
		const results: Array<{
			command: string;
			success: boolean;
			output_file: string;
		}> = [];

		for (const command of commands) {
			log.info(st('yellow', `\n📋 Processing ${command}...`));

			try {
				// Run the command
				const output = await run_gitops_command(command, [], log); // eslint-disable-line no-await-in-loop

				if (!output.success) {
					log.error(`❌ Command failed: ${command}`);
					log.error(`   stderr: ${output.stderr}`);
					results.push({command, success: false, output_file: ''});
					continue;
				}

				// Save output to baseline file
				const output_filename = `${command}_output.md`;
				const output_path = join('src/fixtures', output_filename);

				const formatted_contents = await format_file(output.stdout, {filepath: output_filename}); // eslint-disable-line no-await-in-loop

				writeFileSync(output_path, formatted_contents, 'utf-8');
				log.info(st('green', `   ✓ Saved output to: ${output_filename}`));

				if (verbose) {
					log.info(`   Output length: ${formatted_contents.length} characters`);
					log.info(`   First few lines:\n${formatted_contents.split('\n').slice(0, 3).join('\n')}`);
				}

				results.push({command, success: true, output_file: output_filename});
			} catch (error) {
				log.error(`❌ Failed to process ${command}: ${error}`);
				results.push({command, success: false, output_file: ''});
			}
		}

		// Summary
		log.info(st('cyan', '\n📊 Summary:'));
		const successful = results.filter((r) => r.success);
		const failed = results.filter((r) => !r.success);

		log.info(`   Commands processed: ${results.length}`);
		log.info(`   Successful: ${successful.length}`);

		if (successful.length > 0) {
			log.info(st('green', '   Generated output files:'));
			for (const result of successful) {
				log.info(`     - ${result.output_file}`);
			}
		}

		if (failed.length > 0) {
			log.info(st('red', `   Failed: ${failed.length}`));
			for (const result of failed) {
				log.info(`     - ${result.command}`);
			}
		}

		if (failed.length === 0) {
			log.info(st('green', '\n✅ All commands completed successfully'));
			log.info('   Output files can now be used as baselines for testing');
		}

		// Exit with error code if there were failures
		if (failed.length > 0) {
			throw new Error(`${failed.length} commands failed`);
		}
	},
};
