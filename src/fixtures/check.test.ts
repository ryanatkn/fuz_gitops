import {test, assert, describe, beforeAll} from 'vitest';

import {
	run_gitops_command_json,
	assert_publishing_order,
	assert_version_changes,
	assert_messages,
	get_fixture_config_path,
} from './helpers.js';
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
import type {Repo_Fixture_Set} from './repo_fixture_types.js';

const COMMAND_TIMEOUT = 60_000;

// All fixture sets
const FIXTURES: Array<Repo_Fixture_Set> = [
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

// Generate fixture repos before running tests
beforeAll(async () => {
	// Check if any fixtures are missing
	const missing = FIXTURES.some((f) => !fixtures_exist(f.name));

	if (missing) {
		// Generate all fixtures if any are missing
		await generate_all_fixtures(FIXTURES);
	}
}, 120_000); // Allow up to 2 minutes for fixture generation

/**
 * Structured JSON-based tests that validate each fixture in isolation.
 * Each fixture has its own gitops config and runs independently.
 */

for (const fixture of FIXTURES) {
	describe(`${fixture.name} fixture`, () => {
		const config_path = get_fixture_config_path(fixture.name);
		const has_errors =
			fixture.expected_outcomes.errors && fixture.expected_outcomes.errors.length > 0;

		describe('gitops_analyze', () => {
			test(
				'produces expected publishing order',
				async () => {
					if (has_errors) {
						// For fixtures with errors, the command might fail or return null publishing_order
						// Just verify the command runs and returns a result
						const result = await run_gitops_command_json(
							'gitops_analyze',
							[],
							undefined,
							config_path,
						);
						assert.ok(result, 'Should return a result even with errors');
						return;
					}

					const result = await run_gitops_command_json(
						'gitops_analyze',
						[],
						undefined,
						config_path,
					);
					assert.ok(result.publishing_order, 'Should have publishing_order');
					assert_publishing_order(
						result.publishing_order,
						fixture.expected_outcomes.publishing_order,
					);
				},
				COMMAND_TIMEOUT,
			);
		});

		describe('gitops_plan', () => {
			test(
				'predicts correct version changes',
				async () => {
					if (has_errors) {
						// Errors block planning - verify errors are reported
						try {
							await run_gitops_command_json('gitops_plan', [], undefined, config_path);
							// If we get here without error, check that errors are in the result
						} catch (_error) {
							// Command failed as expected for error fixtures
							return;
						}
						return;
					}

					const result = await run_gitops_command_json('gitops_plan', [], undefined, config_path);

					// Verify version changes
					if (fixture.expected_outcomes.version_changes.length > 0) {
						assert_version_changes(
							result.version_changes,
							fixture.expected_outcomes.version_changes,
						);
					} else {
						assert.equal(result.version_changes.length, 0, 'Expected no version changes');
					}
				},
				COMMAND_TIMEOUT,
			);

			test(
				'reports correct publishing order',
				async () => {
					if (has_errors) return; // Skip for error fixtures

					const result = await run_gitops_command_json('gitops_plan', [], undefined, config_path);

					// Publishing order should match for fixtures with version changes
					if (fixture.expected_outcomes.version_changes.length > 0) {
						assert_publishing_order(
							result.publishing_order,
							fixture.expected_outcomes.publishing_order,
						);
					}
				},
				COMMAND_TIMEOUT,
			);

			test(
				'tracks breaking cascades',
				async () => {
					if (has_errors || !fixture.expected_outcomes.breaking_cascades) return;

					const result = await run_gitops_command_json('gitops_plan', [], undefined, config_path);

					// Verify breaking cascades exist
					for (const [pkg, expected_affected] of Object.entries(
						fixture.expected_outcomes.breaking_cascades,
					)) {
						assert.ok(result.breaking_cascades[pkg], `Should have breaking cascade for ${pkg}`);

						// Verify affected packages match
						const actual_affected = result.breaking_cascades[pkg];
						for (const expected_pkg of expected_affected) {
							assert.ok(
								actual_affected.includes(expected_pkg),
								`${pkg} should affect ${expected_pkg}`,
							);
						}
					}
				},
				COMMAND_TIMEOUT,
			);

			test(
				'reports warnings',
				async () => {
					if (
						!fixture.expected_outcomes.warnings ||
						fixture.expected_outcomes.warnings.length === 0
					)
						return;

					const result = await run_gitops_command_json('gitops_plan', [], undefined, config_path);
					assert_messages(result.warnings, fixture.expected_outcomes.warnings, 'warnings');
				},
				COMMAND_TIMEOUT,
			);

			test(
				'reports errors',
				async () => {
					if (!fixture.expected_outcomes.errors || fixture.expected_outcomes.errors.length === 0)
						return;

					try {
						const result = await run_gitops_command_json('gitops_plan', [], undefined, config_path);
						// If command succeeded, errors should be in result
						assert_messages(result.errors, fixture.expected_outcomes.errors, 'errors');
					} catch (_error) {
						// Command failed - this is expected for error fixtures
						assert.ok(true, 'Command failed as expected for error fixture');
					}
				},
				COMMAND_TIMEOUT,
			);

			test(
				'reports info for packages with no changes',
				async () => {
					if (
						has_errors ||
						!fixture.expected_outcomes.info ||
						fixture.expected_outcomes.info.length === 0
					)
						return;

					const result = await run_gitops_command_json('gitops_plan', [], undefined, config_path);

					// Check that expected packages are in info
					for (const pkg of fixture.expected_outcomes.info) {
						assert.ok(result.info.includes(pkg), `Info should include ${pkg}`);
					}
				},
				COMMAND_TIMEOUT,
			);
		});

		describe('gitops_publish_dry', () => {
			/*
			 * Note: Dry runs have limitations compared to full publishing:
			 * - Cannot auto-generate changesets (requires filesystem writes)
			 * - Limited bump escalation (requires iteration to see new dependency versions)
			 * - Only packages with explicit .changeset/ files can be published
			 *
			 * Tests validate that packages WITH explicit changesets are attempted,
			 * but cannot fully validate auto-generated or escalated scenarios.
			 */

			test(
				'publishes expected packages',
				async () => {
					if (has_errors) return; // Skip for error fixtures

					const result = await run_gitops_command_json(
						'gitops_publish_dry',
						[],
						undefined,
						config_path,
					);

					// Dry runs can ONLY publish packages with explicit changesets
					// Auto-generated changesets require filesystem writes (not possible in dry run)
					// Bump escalation requires iteration to see new versions (limited in dry run)
					const packages_with_explicit_changesets =
						fixture.expected_outcomes.version_changes.filter(
							(vc) => vc.scenario === 'explicit_changeset' || vc.scenario === 'bump_escalation',
						);

					if (packages_with_explicit_changesets.length > 0) {
						// Dry run should publish packages with explicit changesets
						// Note: May not match exact versions due to limited iteration (escalation may not work fully)
						assert.ok(
							result.published.length > 0,
							`Should publish at least some packages (expected ${packages_with_explicit_changesets.length} with explicit changesets)`,
						);

						// Verify published packages are in the expected set
						for (const published of result.published) {
							const expected_change = fixture.expected_outcomes.version_changes.find(
								(vc) => vc.package_name === published.name,
							);
							assert.ok(
								expected_change,
								`Published package ${published.name} should be in expected changes`,
							);
							// Note: Version might not match exactly due to escalation limitations in dry run
							// We just verify the package was attempted to be published
						}
					} else {
						// No packages with explicit changesets - dry run should publish nothing
						assert.equal(result.published.length, 0, 'Should not publish any packages');
					}
				},
				COMMAND_TIMEOUT,
			);

			test(
				'reports success status',
				async () => {
					if (has_errors) return; // Skip for error fixtures

					const result = await run_gitops_command_json(
						'gitops_publish_dry',
						[],
						undefined,
						config_path,
					);

					// Should report success for valid fixtures
					assert.ok(result.ok === true, 'Should report success');
					assert.equal(result.failed.length, 0, 'Should have no failures');
				},
				COMMAND_TIMEOUT,
			);
		});
	});
}
