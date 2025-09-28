import type {Logger} from '@ryanatkn/belt/log.js';
import {spawn} from '@ryanatkn/belt/process.js';
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
 * Manages NPM registry operations with retry logic.
 */
export class Npm_Registry {
	private log?: Logger;

	constructor(log?: Logger) {
		this.log = log;
	}

	/**
	 * Checks if a specific package version is available on NPM.
	 */
	async check_availability(pkg: string, version: string): Promise<boolean> {
		try {
			const result = await spawn('npm', ['view', `${pkg}@${version}`, 'version', '--json']);

			if (result.ok && 'stdout' in result) {
				const stdout = result.stdout as string;
				if (stdout) {
					const output = stdout.trim();
					// npm view returns the version string if found
					return output.includes(version);
				}
			}
		} catch {
			// npm command failed
		}

		return false;
	}

	/**
	 * Waits for a package to become available on NPM with exponential backoff.
	 */
	async wait_for_package(
		pkg: string,
		version: string,
		options: Wait_Options = {},
	): Promise<boolean> {
		const {
			max_attempts = 30,
			initial_delay = 1000,
			max_delay = 60000,
			timeout = 300000,
		} = options;

		const start_time = Date.now();
		let attempt = 0;
		let delay = initial_delay;

		this.log?.info(`  Waiting for ${pkg}@${version}...`);

		while (Date.now() - start_time < timeout && attempt < max_attempts) {
			attempt++;

			if (await this.check_availability(pkg, version)) {
				const duration = Date.now() - start_time;
				this.log?.info(
					st('green', `  ✓ ${pkg}@${version} is available`) +
						st('dim', ` (${(duration / 1000).toFixed(1)}s, ${attempt} checks)`),
				);
				return true;
			}

			// Calculate next delay with exponential backoff and jitter
			await wait(delay);
			delay = Math.min(delay * 2, max_delay);
			delay += Math.random() * delay * 0.25; // Add 25% jitter

			// Log progress occasionally
			if (attempt % 5 === 0) {
				const elapsed = ((Date.now() - start_time) / 1000).toFixed(0);
				this.log?.info(st('dim', `    Still waiting... (${elapsed}s elapsed, ${attempt} checks)`));
			}
		}

		// Max attempts or timeout reached
		const duration = Date.now() - start_time;
		this.log?.warn(
			st(
				'yellow',
				`  ⚠️  ${pkg}@${version} not available after ${attempt} attempts (${(duration / 1000).toFixed(1)}s)`,
			),
		);

		return false;
	}

	/**
	 * Waits for multiple packages to become available.
	 */
	async wait_for_packages(
		packages: Array<Package_Info>,
		options: Wait_Options = {},
	): Promise<Map<string, boolean>> {
		const results = new Map<string, boolean>();

		this.log?.info(
			st('cyan', `Waiting for ${packages.length} packages to be available on npm...`),
		);

		// Check all packages in parallel
		const promises = packages.map(async ({name, version}) => {
			const available = await this.wait_for_package(name, version, options);
			results.set(name, available);
			return available;
		});

		const all_results = await Promise.all(promises);
		const all_available = all_results.every((r) => r);

		if (all_available) {
			this.log?.info(st('green', `✓ All ${packages.length} packages are now available`));
		} else {
			const failed = Array.from(results.entries())
				.filter(([_, available]) => !available)
				.map(([name]) => name);

			this.log?.warn(
				st('yellow', `⚠️  ${failed.length} packages not available: ${failed.join(', ')}`),
			);
		}

		return results;
	}

	/**
	 * Gets the latest version of a package from NPM.
	 */
	async get_latest_version(pkg: string): Promise<string | null> {
		try {
			const result = await spawn('npm', ['view', pkg, 'version', '--json']);

			if (result.ok && 'stdout' in result) {
				const stdout = result.stdout as string;
				if (stdout) {
					// Parse the version from npm view output
					const version = JSON.parse(stdout.trim());
					return version;
				}
			}
		} catch {
			// npm command failed
		}

		return null;
	}

	/**
	 * Checks if a package exists on NPM.
	 */
	async package_exists(pkg: string): Promise<boolean> {
		const latest = await this.get_latest_version(pkg);
		return latest !== null;
	}
}