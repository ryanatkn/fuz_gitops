import {spawn} from '@ryanatkn/belt/process.js';
import type {Logger} from '@ryanatkn/belt/log.js';
import {wait} from '@ryanatkn/belt/async.js';
import {styleText as st} from 'node:util';

export interface Registry_Check_Result {
	available: boolean;
	version: string | null;
	attempts: number;
	duration: number;
}

export interface Registry_Monitor_Options {
	max_attempts?: number;
	base_delay?: number; // ms
	max_delay?: number; // ms
	log?: Logger;
}

export class Registry_Monitor {
	private max_attempts: number;
	private base_delay: number;
	private max_delay: number;
	private log?: Logger;

	constructor(options: Registry_Monitor_Options = {}) {
		this.max_attempts = options.max_attempts ?? 30; // ~5 minutes total with default delays
		this.base_delay = options.base_delay ?? 1000; // 1 second
		this.max_delay = options.max_delay ?? 60000; // 60 seconds
		this.log = options.log;
	}

	/**
	 * Waits for a package version to be available in the NPM registry.
	 * Uses exponential backoff with jitter.
	 */
	async wait_for_availability(
		pkg_name: string,
		version: string,
		cwd?: string,
	): Promise<Registry_Check_Result> {
		const start_time = Date.now();
		let attempts = 0;

		this.log?.info(`Waiting for ${st('cyan', `${pkg_name}@${version}`)} to be available on npm...`);

		while (attempts < this.max_attempts) {
			attempts++;

			// Check if package is available
			const available = await this.check_package_version(pkg_name, version, cwd);

			if (available) {
				const duration = Date.now() - start_time;
				this.log?.info(
					st('green', `✓ ${pkg_name}@${version} is now available`) +
						st('dim', ` (${attempts} attempts, ${(duration / 1000).toFixed(1)}s)`),
				);
				return {
					available: true,
					version,
					attempts,
					duration,
				};
			}

			// Calculate delay with exponential backoff and jitter
			const delay = this.calculate_delay(attempts);

			if (attempts % 5 === 0 || attempts === 1) {
				this.log?.info(
					st('yellow', `  Attempt ${attempts}/${this.max_attempts}: `) +
						st('dim', `Package not yet available, retrying in ${(delay / 1000).toFixed(1)}s...`),
				);
			}

			await wait(delay);
		}

		// Max attempts reached
		const duration = Date.now() - start_time;
		this.log?.error(
			st(
				'red',
				`✗ ${pkg_name}@${version} is still not available after ${attempts} attempts (${(duration / 1000).toFixed(1)}s)`,
			),
		);

		return {
			available: false,
			version: null,
			attempts,
			duration,
		};
	}

	/**
	 * Checks if a specific package version is available.
	 *
	 * TODO: Consider using --cache flag for faster local testing:
	 * npm view --cache /tmp/npm-cache ${pkg_name}@${version} version
	 * This can help speed up repeated checks during development.
	 * Could be exposed as an option in the future.
	 */
	private async check_package_version(
		pkg_name: string,
		version: string,
		cwd?: string,
	): Promise<boolean> {
		try {
			const result = await spawn(
				'npm',
				['view', `${pkg_name}@${version}`, 'version', '--json'],
				{cwd},
			);

			if (result.ok && 'stdout' in result) {
				const stdout = result.stdout as string;
				if (stdout) {
					const output = stdout.trim();
					// npm view returns the version string if found
					return output.includes(version);
				}
			}
		} catch {
			// Package not found or network error
		}

		return false;
	}

	/**
	 * Calculates delay with exponential backoff and jitter.
	 */
	private calculate_delay(attempt: number): number {
		// Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s...
		const exponential_delay = Math.min(this.base_delay * Math.pow(2, attempt - 1), this.max_delay);

		// Add jitter (±25%) to avoid thundering herd
		const jitter = exponential_delay * 0.25 * (Math.random() * 2 - 1);

		return Math.max(this.base_delay, exponential_delay + jitter);
	}

	/**
	 * Waits for multiple packages to be available.
	 */
	async wait_for_multiple(
		packages: Array<{name: string; version: string}>,
		cwd?: string,
	): Promise<Map<string, Registry_Check_Result>> {
		const results = new Map<string, Registry_Check_Result>();

		this.log?.info(
			st('cyan', `Waiting for ${packages.length} packages to be available on npm...`),
		);

		// Check all packages in parallel
		const promises = packages.map(async ({name, version}) => {
			const result = await this.wait_for_availability(name, version, cwd);
			results.set(name, result);
			return result;
		});

		await Promise.all(promises);

		// Summary
		const all_available = Array.from(results.values()).every((r) => r.available);
		const total_duration = Math.max(...Array.from(results.values()).map((r) => r.duration));

		if (all_available) {
			this.log?.info(
				st('green', `✓ All ${packages.length} packages are now available`) +
					st('dim', ` (${(total_duration / 1000).toFixed(1)}s total)`),
			);
		} else {
			const failed = Array.from(results.entries())
				.filter(([_, r]) => !r.available)
				.map(([name]) => name);
			this.log?.error(
				st('red', `✗ ${failed.length} packages failed to become available: ${failed.join(', ')}`),
			);
		}

		return results;
	}

	/**
	 * Checks if we can successfully install a package.
	 * This is more reliable than just checking availability.
	 */
	async verify_installable(
		pkg_name: string,
		version: string,
		cwd: string,
	): Promise<boolean> {
		try {
			// Try a dry-run install
			const result = await spawn(
				'npm',
				['install', '--dry-run', '--no-save', `${pkg_name}@${version}`],
				{cwd},
			);

			return result.ok;
		} catch {
			return false;
		}
	}
}

/**
 * Creates a registry monitor with default settings.
 */
export const create_registry_monitor = (log?: Logger): Registry_Monitor => {
	return new Registry_Monitor({log});
};