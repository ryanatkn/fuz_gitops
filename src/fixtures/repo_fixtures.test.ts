import {test, assert} from 'vitest';

import {preview_publishing_plan} from '$lib/publishing_preview.js';
import {basic_publishing} from './repo_fixtures/basic_publishing.js';
import {fixture_to_local_repos} from './load_repo_fixtures.js';
import {create_mock_changeset_ops} from './mock_changeset_operations.js';

test('basic_publishing fixture', async () => {
	const repos = fixture_to_local_repos(basic_publishing);
	const ops = create_mock_changeset_ops(basic_publishing);

	const preview = await preview_publishing_plan(repos, undefined, ops);

	// Check publishing order
	assert.deepEqual(
		preview.publishing_order,
		basic_publishing.expected_outcomes.publishing_order,
		'Publishing order matches expected',
	);

	// Check version changes
	assert.equal(
		preview.version_changes.length,
		basic_publishing.expected_outcomes.version_changes.length,
		'Correct number of version changes',
	);

	// Verify each version change
	for (const expected of basic_publishing.expected_outcomes.version_changes) {
		const actual = preview.version_changes.find((vc) => vc.package_name === expected.package_name);
		assert.ok(actual, `Found version change for ${expected.package_name}`);
		assert.equal(actual.from, expected.from, `${expected.package_name}: from version matches`);
		assert.equal(actual.to, expected.to, `${expected.package_name}: to version matches`);

		// Check scenario-specific flags
		switch (expected.scenario) {
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

	// Check breaking cascades
	if (basic_publishing.expected_outcomes.breaking_cascades) {
		for (const [pkg, affected] of Object.entries(
			basic_publishing.expected_outcomes.breaking_cascades,
		)) {
			const actual_affected = preview.breaking_cascades.get(pkg);
			assert.ok(actual_affected, `Found breaking cascade for ${pkg}`);
			assert.deepEqual(
				actual_affected?.sort(),
				affected.sort(),
				`Breaking cascade for ${pkg} matches`,
			);
		}
	}

	// Check no errors
	assert.equal(preview.errors.length, 0, 'No errors in preview');

	// Check info section has packages with no changes
	assert.ok(preview.info.includes('@test/repo_d'), 'repo_d in info (no changes)');
	assert.ok(preview.info.includes('@test/repo_e'), 'repo_e in info (dev deps only)');
});