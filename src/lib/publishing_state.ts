import {readFile, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import type {Logger} from '@ryanatkn/belt/log.js';
import {styleText as st} from 'node:util';

import {PUBLISHING_STATE_PATH} from '$lib/paths.js';

export interface Publishing_State {
	started_at: string;
	resumed_at?: string;
	completed: Array<{name: string; version: string; timestamp: string}>;
	failed: Array<{name: string; error: string; timestamp: string}>;
	remaining: Array<string>;
	current?: string;
}

export interface State_Options {
	state_file?: string;
	log?: Logger;
}

/**
 * Manages persistent state for multi-repo publishing.
 * Allows resuming from failures and tracking progress.
 */
export class Publishing_State_Manager {
	private state: Publishing_State | null = null;
	private state_file: string;
	private log?: Logger;

	constructor(options: State_Options = {}) {
		this.state_file = options.state_file || PUBLISHING_STATE_PATH;
		this.log = options.log;
	}

	/**
	 * Creates a new publishing state.
	 */
	create_new_state(package_names: Array<string>): Publishing_State {
		this.state = {
			started_at: new Date().toISOString(),
			completed: [],
			failed: [],
			remaining: [...package_names],
		};
		return this.state;
	}

	/**
	 * Loads existing state from disk if available.
	 */
	async load_state(): Promise<Publishing_State | null> {
		if (!existsSync(this.state_file)) {
			return null;
		}

		try {
			const content = await readFile(this.state_file, 'utf8');
			this.state = JSON.parse(content);

			if (this.state) {
				// Mark as resumed
				this.state.resumed_at = new Date().toISOString();
				this.log?.info(st('cyan', `📂 Resumed publishing state from ${this.state_file}`));
				this.log?.info(`  Started: ${this.state.started_at}`);
				this.log?.info(`  Completed: ${this.state.completed.length} packages`);
				this.log?.info(`  Failed: ${this.state.failed.length} packages`);
				this.log?.info(`  Remaining: ${this.state.remaining.length} packages`);
			}

			return this.state;
		} catch (error) {
			this.log?.warn(`Failed to load state from ${this.state_file}: ${error}`);
			return null;
		}
	}

	/**
	 * Saves current state to disk.
	 */
	async save_state(): Promise<void> {
		if (!this.state) return;

		try {
			await writeFile(this.state_file, JSON.stringify(this.state, null, 2));
			this.log?.debug(`State saved to ${this.state_file}`);
		} catch (error) {
			this.log?.error(`Failed to save state to ${this.state_file}: ${error}`);
		}
	}

	/**
	 * Marks a package as currently being processed.
	 */
	mark_current(package_name: string): void {
		if (!this.state) return;
		this.state.current = package_name;
	}

	/**
	 * Marks a package as successfully completed.
	 */
	async mark_completed(package_name: string, version: string): Promise<void> {
		if (!this.state) return;

		// Remove from remaining
		this.state.remaining = this.state.remaining.filter((name) => name !== package_name);

		// Add to completed
		this.state.completed.push({
			name: package_name,
			version,
			timestamp: new Date().toISOString(),
		});

		// Clear current
		if (this.state.current === package_name) {
			this.state.current = undefined;
		}

		await this.save_state();
	}

	/**
	 * Marks a package as failed.
	 */
	async mark_failed(package_name: string, error: Error): Promise<void> {
		if (!this.state) return;

		// Remove from remaining
		this.state.remaining = this.state.remaining.filter((name) => name !== package_name);

		// Add to failed
		this.state.failed.push({
			name: package_name,
			error: error.message,
			timestamp: new Date().toISOString(),
		});

		// Clear current
		if (this.state.current === package_name) {
			this.state.current = undefined;
		}

		await this.save_state();
	}

	/**
	 * Gets packages that should be skipped (already processed).
	 */
	get_packages_to_skip(): Set<string> {
		if (!this.state) return new Set();

		const skip: Set<string> = new Set();

		// Skip completed packages
		for (const completed of this.state.completed) {
			skip.add(completed.name);
		}

		// Skip failed packages (user can manually retry if needed)
		for (const failed of this.state.failed) {
			skip.add(failed.name);
		}

		return skip;
	}

	/**
	 * Gets the current state.
	 */
	get_state(): Publishing_State | null {
		return this.state;
	}

	/**
	 * Clears the state file.
	 */
	async clear_state(): Promise<void> {
		if (existsSync(this.state_file)) {
			const {unlink} = await import('node:fs/promises');
			await unlink(this.state_file);
			this.log?.info(`Cleared state file: ${this.state_file}`);
		}
		this.state = null;
	}

	/**
	 * Gets a summary of the current state.
	 */
	get_summary(): string {
		if (!this.state) return 'No state loaded';

		const lines: Array<string> = [];
		lines.push('Publishing State Summary:');
		lines.push(`  Started: ${this.state.started_at}`);
		if (this.state.resumed_at) {
			lines.push(`  Resumed: ${this.state.resumed_at}`);
		}
		lines.push(`  Completed: ${this.state.completed.length} packages`);
		if (this.state.completed.length > 0) {
			for (const pkg of this.state.completed) {
				lines.push(`    ✓ ${pkg.name}@${pkg.version}`);
			}
		}
		lines.push(`  Failed: ${this.state.failed.length} packages`);
		if (this.state.failed.length > 0) {
			for (const pkg of this.state.failed) {
				lines.push(`    ✗ ${pkg.name}: ${pkg.error}`);
			}
		}
		lines.push(`  Remaining: ${this.state.remaining.length} packages`);
		if (this.state.current) {
			lines.push(`  Currently processing: ${this.state.current}`);
		}

		return lines.join('\n');
	}

	/**
	 * Checks if publishing should resume from a saved state.
	 */
	should_resume(): boolean {
		return this.state !== null && this.state.remaining.length > 0;
	}
}

/**
 * Helper to create or load a publishing state.
 */
export const init_publishing_state = async (
	package_names: Array<string>,
	options: State_Options = {},
): Promise<Publishing_State_Manager> => {
	const manager = new Publishing_State_Manager(options);

	// Try to load existing state
	const existing = await manager.load_state();

	if (existing) {
		// Validate that the package list matches
		const existing_all = new Set([
			...existing.completed.map((c) => c.name),
			...existing.failed.map((f) => f.name),
			...existing.remaining,
		]);

		const new_all = new Set(package_names);

		// Check if package lists match
		const same_packages =
			existing_all.size === new_all.size && [...existing_all].every((pkg) => new_all.has(pkg));

		if (!same_packages) {
			options.log?.warn('Package list has changed since last run, starting fresh');
			await manager.clear_state();
			manager.create_new_state(package_names);
		}
	} else {
		// Create new state
		manager.create_new_state(package_names);
	}

	return manager;
};
