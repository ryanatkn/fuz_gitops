import {describe, test, assert} from 'vitest';

import {preview_publishing_plan, type Publishing_Preview} from '$lib/publishing_preview.js';
import {basic_publishing} from './repo_fixtures/basic_publishing.js';
import {deep_cascade} from './repo_fixtures/deep_cascade.js';
import {circular_dev_deps} from './repo_fixtures/circular_dev_deps.js';
import {private_packages} from './repo_fixtures/private_packages.js';
import {major_bumps} from './repo_fixtures/major_bumps.js';
import {peer_deps_only} from './repo_fixtures/peer_deps_only.js';
import {fixture_to_local_repos} from './load_repo_fixtures.js';
import {create_mock_changeset_ops} from './mock_changeset_operations.js';
import type {Repo_Fixture_Set, Repo_Fixture_Expected_Version_Change} from './repo_fixture_types.js';

// All fixtures to test
const FIXTURES = [
	basic_publishing,
	deep_cascade,
	circular_dev_deps,
	private_packages,
	major_bumps,
	peer_deps_only,
];

/**
 * Validates version changes match expected outcomes
 */
const validate_version_changes = (
	preview: Publishing_Preview,
	expected: Array<Repo_Fixture_Expected_Version_Change>,
	fixture_name: string,
): void => {
	assert.equal(
		preview.version_changes.length,
		expected.length,
		`${fixture_name}: Correct number of version changes`,
	);

	// Verify each version change
	for (const expected_change of expected) {
		const actual = preview.version_changes.find(
			(vc) => vc.package_name === expected_change.package_name,
		);
		assert.ok(actual, `${fixture_name}: Found version change for ${expected_change.package_name}`);
		assert.equal(
			actual.from,
			expected_change.from,
			`${fixture_name}: ${expected_change.package_name} from version matches`,
		);
		assert.equal(
			actual.to,
			expected_change.to,
			`${fixture_name}: ${expected_change.package_name} to version matches`,
		);

		// Check scenario-specific flags
		switch (expected_change.scenario) {
			case 'explicit_changeset':
				assert.equal(actual.has_changesets, true);
				assert.equal(actual.will_generate_changeset, undefined);
				assert.equal(actual.needs_bump_escalation, undefined);
				break;
			case 'auto_generated':
				assert.equal(actual.has_changesets, false);
				assert.equal(actual.will_generate_changeset, true);
				break;
			case 'bump_escalation':
				assert.equal(actual.has_changesets, true);
				assert.equal(actual.needs_bump_escalation, true);
				break;
		}
	}
};

/**
 * Validates breaking cascades match expected outcomes
 */
const validate_breaking_cascades = (
	preview: Publishing_Preview,
	expected: Record<string, Array<string>> | undefined,
	fixture_name: string,
): void => {
	if (!expected) return;

	for (const [pkg, affected] of Object.entries(expected)) {
		const actual_affected = preview.breaking_cascades.get(pkg);
		assert.ok(actual_affected, `${fixture_name}: Found breaking cascade for ${pkg}`);
		assert.deepEqual(
			actual_affected.sort(),
			affected.sort(),
			`${fixture_name}: Breaking cascade for ${pkg} matches`,
		);
	}
};

/**
 * Validates info messages match expected outcomes
 */
const validate_info = (
	preview: Publishing_Preview,
	expected: Array<string> | undefined,
	fixture_name: string,
): void => {
	if (!expected) return;

	assert.deepEqual(
		preview.info.sort(),
		expected.sort(),
		`${fixture_name}: Info messages match expected`,
	);
};

/**
 * Validates warnings match expected outcomes
 */
const validate_warnings = (
	preview: Publishing_Preview,
	expected: Array<string> | undefined,
	fixture_name: string,
): void => {
	if (expected === undefined) return; // Don't validate if not specified

	assert.deepEqual(
		preview.warnings.sort(),
		expected.sort(),
		`${fixture_name}: Warnings match expected`,
	);
};

/**
 * Validates errors match expected outcomes
 */
const validate_errors = (
	preview: Publishing_Preview,
	expected: Array<string> | undefined,
	fixture_name: string,
): void => {
	if (expected === undefined) {
		// If no expected errors specified, assert no errors
		assert.equal(preview.errors.length, 0, `${fixture_name}: No unexpected errors`);
	} else {
		assert.deepEqual(
			preview.errors.sort(),
			expected.sort(),
			`${fixture_name}: Errors match expected`,
		);
	}
};

/**
 * Generic test for a repo fixture set
 */
const test_fixture = async (fixture: Repo_Fixture_Set): Promise<void> => {
	const repos = fixture_to_local_repos(fixture);
	const ops = create_mock_changeset_ops(fixture);

	const preview = await preview_publishing_plan(repos, undefined, ops);

	// Check publishing order
	assert.deepEqual(
		preview.publishing_order,
		fixture.expected_outcomes.publishing_order,
		`${fixture.name}: Publishing order matches expected`,
	);

	// Check version changes
	validate_version_changes(preview, fixture.expected_outcomes.version_changes, fixture.name);

	// Check breaking cascades
	validate_breaking_cascades(preview, fixture.expected_outcomes.breaking_cascades, fixture.name);

	// Check info messages
	validate_info(preview, fixture.expected_outcomes.info, fixture.name);

	// Check warnings
	validate_warnings(preview, fixture.expected_outcomes.warnings, fixture.name);

	// Check errors
	validate_errors(preview, fixture.expected_outcomes.errors, fixture.name);
};

// Run tests for all fixtures
describe('repo fixtures', () => {
	for (const fixture of FIXTURES) {
		test(fixture.name, async () => {
			await test_fixture(fixture);
		});
	}
});
