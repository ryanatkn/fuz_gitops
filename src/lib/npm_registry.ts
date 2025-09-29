import type {Logger} from '@ryanatkn/belt/log.js';
import {spawn_out} from '@ryanatkn/belt/process.js';
import {wait} from '@ryanatkn/belt/async.js';
import {styleText as st} from 'node:util';

export interface Wait_Options {
	max_attempts?: number;
	initial_delay?: number;
	max_delay?: number;
	timeout?: number;
}

export interface Package_Info {
	name: string;
	version: string;
}

/**
 * Checks if a specific package version is available on NPM.
 */
export const check_package_available = async (
	pkg: string,
	version: string,
	log?: Logger,
): Promise<boolean> => {
	try {
		// Use npm view to check if the specific version exists
		const result = await spawn_out('npm', ['view', `${pkg}@${version}`, 'version']);

		if (result.stdout) {
			const output = result.stdout.trim();
			// If we get a version back, it exists
			return output === version;
		}

		return false;
	} catch (error) {
		log?.debug(`Failed to check ${pkg}@${version}: ${error}`);
		return false;
	}
};

/**
 * Waits for a package version to become available on NPM with exponential backoff.
 */
export const wait_for_package = async (
	pkg: string,
	version: string,
	options: Wait_Options = {},
	log?: Logger,
): Promise<void> => {
	const {
		max_attempts = 30,
		initial_delay = 1000,
		max_delay = 60000,
		timeout = 300000, // 5 minutes default
	} = options;

	const start_time = Date.now();
	let attempt = 0;
	let delay = initial_delay;

	while (attempt < max_attempts) {
		attempt++;

		// Check timeout
		if (Date.now() - start_time > timeout) {
			throw new Error(`Timeout waiting for ${pkg}@${version} after ${timeout}ms`);
		}

		// Check if package is available
		if (await check_package_available(pkg, version, log)) {
			log?.info(st('green', `    ✓ ${pkg}@${version} is now available on NPM`));
			return;
		}

		// Log progress occasionally
		if (attempt % 5 === 0) {
			log?.debug(`    Still waiting for ${pkg}@${version} (attempt ${attempt}/${max_attempts})`);
		}

		// Wait with exponential backoff + jitter
		const jitter = Math.random() * delay * 0.1; // 10% jitter
		const actual_delay = Math.min(delay + jitter, max_delay);
		await wait(actual_delay);

		// Exponential backoff
		delay = Math.min(delay * 1.5, max_delay);
	}

	throw new Error(`${pkg}@${version} not available after ${max_attempts} attempts`);
};

/**
 * Gets basic package information from NPM.
 */
export const get_package_info = async (pkg: string, log?: Logger): Promise<Package_Info | null> => {
	try {
		const result = await spawn_out('npm', ['view', pkg, '--json']);

		if (result.stdout) {
			const data = JSON.parse(result.stdout);
			return {
				name: data.name,
				version: data.version,
			};
		}

		return null;
	} catch (error) {
		log?.debug(`Failed to get package info for ${pkg}: ${error}`);
		return null;
	}
};

/**
 * Checks if a package exists on NPM.
 */
export const package_exists = async (pkg: string, log?: Logger): Promise<boolean> => {
	const info = await get_package_info(pkg, log);
	return info !== null;
};
