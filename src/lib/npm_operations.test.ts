import {test, assert, describe} from 'vitest';

import {create_mock_npm_ops} from '$lib/test_helpers.js';

/* eslint-disable @typescript-eslint/require-await */

describe('install operation', () => {
	test('returns ok:true on success', async () => {
		const mock_ops = create_mock_npm_ops();
		const result = await mock_ops.install('/some/path');
		assert.ok(result.ok);
		assert.equal(result.error, undefined);
	});

	test('returns ok:false with error on failure', async () => {
		const mock_ops = create_mock_npm_ops({
			install: async () => ({ok: false, error: 'Network error'}),
		});
		const result = await mock_ops.install('/some/path');
		assert.ok(!result.ok);
		assert.equal(result.error, 'Network error');
	});

	test('accepts optional cwd parameter', async () => {
		const mock_ops = create_mock_npm_ops();
		const result = await mock_ops.install();
		assert.ok(result.ok);
	});

	test('can override install behavior in mock', async () => {
		let install_called = false;
		let install_cwd: string | undefined;

		const mock_ops = create_mock_npm_ops({
			install: async (cwd) => {
				install_called = true;
				install_cwd = cwd;
				return {ok: true};
			},
		});

		await mock_ops.install('/test/directory');

		assert.ok(install_called, 'install should have been called');
		assert.equal(install_cwd, '/test/directory');
	});
});

describe('check_package_available operation', () => {
	test('returns true when package exists', async () => {
		const mock_ops = create_mock_npm_ops();
		const result = await mock_ops.check_package_available('foo', '1.0.0');
		assert.equal(result, true);
	});

	test('returns false when package does not exist', async () => {
		const mock_ops = create_mock_npm_ops({
			check_package_available: async () => false,
		});
		const result = await mock_ops.check_package_available('foo', '1.0.0');
		assert.equal(result, false);
	});

	test('can override behavior in mock', async () => {
		let check_called = false;
		let pkg_name: string | undefined;
		let pkg_version: string | undefined;

		const mock_ops = create_mock_npm_ops({
			check_package_available: async (pkg, version) => {
				check_called = true;
				pkg_name = pkg;
				pkg_version = version;
				return true;
			},
		});

		await mock_ops.check_package_available('@scope/package', '2.3.4');

		assert.ok(check_called);
		assert.equal(pkg_name, '@scope/package');
		assert.equal(pkg_version, '2.3.4');
	});
});

describe('check_auth operation', () => {
	test('returns ok:true with username on success', async () => {
		const mock_ops = create_mock_npm_ops();
		const result = await mock_ops.check_auth();
		assert.ok(result.ok);
		assert.equal(result.username, 'testuser');
		assert.equal(result.error, undefined);
	});

	test('returns ok:false with error when not authenticated', async () => {
		const mock_ops = create_mock_npm_ops({
			check_auth: async () => ({ok: false, error: 'Not logged in to npm'}),
		});
		const result = await mock_ops.check_auth();
		assert.ok(!result.ok);
		assert.equal(result.error, 'Not logged in to npm');
		assert.equal(result.username, undefined);
	});

	test('can override behavior in mock', async () => {
		let auth_called = false;

		const mock_ops = create_mock_npm_ops({
			check_auth: async () => {
				auth_called = true;
				return {ok: true, username: 'custom-user'};
			},
		});

		const result = await mock_ops.check_auth();

		assert.ok(auth_called);
		assert.equal(result.username, 'custom-user');
	});
});

describe('check_registry operation', () => {
	test('returns ok:true when registry is reachable', async () => {
		const mock_ops = create_mock_npm_ops();
		const result = await mock_ops.check_registry();
		assert.ok(result.ok);
		assert.equal(result.error, undefined);
	});

	test('returns ok:false with error when registry unreachable', async () => {
		const mock_ops = create_mock_npm_ops({
			check_registry: async () => ({ok: false, error: 'Failed to ping npm registry'}),
		});
		const result = await mock_ops.check_registry();
		assert.ok(!result.ok);
		assert.equal(result.error, 'Failed to ping npm registry');
	});

	test('can override behavior in mock', async () => {
		let registry_called = false;

		const mock_ops = create_mock_npm_ops({
			check_registry: async () => {
				registry_called = true;
				return {ok: true};
			},
		});

		await mock_ops.check_registry();

		assert.ok(registry_called);
	});
});

describe('wait_for_package operation', () => {
	test('completes successfully when package becomes available', async () => {
		const mock_ops = create_mock_npm_ops();
		// Should not throw
		await mock_ops.wait_for_package('foo', '1.0.0');
	});

	test('accepts optional wait options', async () => {
		const mock_ops = create_mock_npm_ops();
		await mock_ops.wait_for_package('foo', '1.0.0', {max_attempts: 5});
	});

	test('accepts optional logger', async () => {
		const mock_ops = create_mock_npm_ops();
		// Pass undefined for logger - logger is optional
		await mock_ops.wait_for_package('foo', '1.0.0', undefined, undefined);
	});

	test('can override behavior in mock', async () => {
		let wait_called = false;
		let pkg_name: string | undefined;
		let pkg_version: string | undefined;

		const mock_ops = create_mock_npm_ops({
			wait_for_package: async (pkg, version) => {
				wait_called = true;
				pkg_name = pkg;
				pkg_version = version;
			},
		});

		await mock_ops.wait_for_package('@my/package', '3.2.1');

		assert.ok(wait_called);
		assert.equal(pkg_name, '@my/package');
		assert.equal(pkg_version, '3.2.1');
	});
});
