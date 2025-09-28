import type {Logger} from '@ryanatkn/belt/log.js';
import {spawn_cli} from '@ryanatkn/gro/cli.js';
import {git_check_clean_workspace, git_current_commit_hash} from '@ryanatkn/gro/git.js';
import {Task_Error} from '@ryanatkn/gro';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';

import type {Dependency_Graph} from './dependency_graph.js';
import type {Local_Repo} from './local_repo.js';
import {Version_Manager, type Published_Version, type Bump_Type} from './version_manager.js';

export interface Publishing_Options {
	dry: boolean;
	bump: Bump_Type | 'auto';
	continue_on_error: boolean;
	update_peers: boolean;
	peer_dependency_strategy?: 'exact' | 'caret' | 'tilde';
	log?: Logger;
}

export interface Publishing_Result {
	ok: boolean;
	published: Array<Published_Version>;
	failed: Array<{name: string; error: Error}>;
	duration: number;
}

export type Publishing_Status = 'pending' | 'in_progress' | 'published' | 'failed';

export interface Publishing_State_Json {
	graph: any; // Dependency_Graph_Json
	order: Array<string>;
	published: Array<Published_Version>;
	failed: Array<{name: string; error: string}>;
	status: string;
	started_at?: string;
	completed_at?: string;
}

export class Publishing_State {
	graph: Dependency_Graph;
	order: Array<string>;
	published: Map<string, Published_Version>;
	failed: Map<string, Error>;
	started_at?: Date;
	completed_at?: Date;

	constructor(graph: Dependency_Graph, order: Array<string>) {
		this.graph = graph;
		this.order = order;
		this.published = new Map();
		this.failed = new Map();
	}

	get_status(): 'pending' | 'in_progress' | 'complete' | 'failed' {
		if (!this.started_at) return 'pending';
		if (!this.completed_at) return 'in_progress';
		return this.failed.size > 0 ? 'failed' : 'complete';
	}

	toJSON(): Publishing_State_Json {
		return {
			graph: this.graph.toJSON(),
			order: this.order,
			published: Array.from(this.published.values()),
			failed: Array.from(this.failed.entries()).map(([name, error]) => ({
				name,
				error: error.message,
			})),
			status: this.get_status(),
			started_at: this.started_at?.toISOString(),
			completed_at: this.completed_at?.toISOString(),
		};
	}
}

export class Publishing_Orchestrator {
	state: Publishing_State;
	version_manager: Version_Manager;

	constructor(graph: Dependency_Graph, order: Array<string>) {
		this.state = new Publishing_State(graph, order);
		this.version_manager = new Version_Manager();
	}

	/**
	 * Executes the publishing workflow.
	 */
	async execute(options: Publishing_Options): Promise<Publishing_Result> {
		const start_time = Date.now();
		this.state.started_at = new Date();

		const {dry, log} = options;

		if (dry) {
			log?.info('🔍 Dry run mode - no packages will be published');
		}

		// Pre-flight checks
		await this.preflight_checks(options);

		// Execute publishing for each package in order
		for (const pkg_name of this.state.order) {
			const node = this.state.graph.get_node(pkg_name);
			if (!node) {
				log?.error(`Package ${pkg_name} not found in graph`);
				continue;
			}

			try {
				log?.info(`Publishing ${pkg_name}...`);
				const result = await this.publish_repo(node.repo, options);
				this.state.published.set(pkg_name, result);
				log?.info(`✅ Published ${pkg_name}@${result.new_version}`);
			} catch (error) {
				const err = error instanceof Error ? error : new Error(String(error));
				this.state.failed.set(pkg_name, err);
				log?.error(`❌ Failed to publish ${pkg_name}: ${err.message}`);

				if (!options.continue_on_error) {
					break;
				}
			}
		}

		this.state.completed_at = new Date();
		const duration = Date.now() - start_time;

		return {
			ok: this.state.failed.size === 0,
			published: Array.from(this.state.published.values()),
			failed: Array.from(this.state.failed.entries()).map(([name, error]) => ({name, error})),
			duration,
		};
	}

	/**
	 * Performs pre-flight checks before publishing.
	 */
	private async preflight_checks(options: Publishing_Options): Promise<void> {
		const {log} = options;

		for (const pkg_name of this.state.order) {
			const node = this.state.graph.get_node(pkg_name);
			if (!node) continue;

			const {repo} = node;

			// Check for clean workspace
			const error_message = await git_check_clean_workspace({cwd: repo.repo_dir});
			if (error_message) {
				throw new Task_Error(`Repo ${repo.repo_dir} has uncommitted changes: ${error_message}`);
			}

			// Verify we're on the correct branch
			// This is already handled by load_local_repo, but we can add additional checks here
		}

		log?.info('✅ Pre-flight checks passed');
	}

	/**
	 * Publishes a single repository.
	 */
	async publish_repo(repo: Local_Repo, options: Publishing_Options): Promise<Published_Version> {
		const {dry, bump, update_peers, peer_dependency_strategy = 'caret', log} = options;

		const old_version = repo.pkg.package_json.version || '0.0.0';

		// Determine version bump
		let bump_type: Bump_Type;
		if (bump === 'auto') {
			const detected_bump = await this.version_manager.determine_bump_type(repo);
			if (!detected_bump) {
				throw new Error(`No changesets found for ${repo.pkg.name}. Create a changeset or specify --bump explicitly.`);
			}
			bump_type = detected_bump;
		} else {
			bump_type = bump;
		}
		const new_version = this.version_manager.bump_version(old_version, bump_type);

		if (dry) {
			// Simulate publishing in dry run
			return {
				name: repo.pkg.name,
				old_version,
				new_version,
				commit: 'dry-run',
				tag: `v${new_version}`,
			};
		}

		// Update dependencies if needed
		if (update_peers) {
			await this.update_dependencies(repo, peer_dependency_strategy, log);
		}

		// Run gro publish
		const publish_result = await spawn_cli(
			'gro',
			['publish', '--no-build'], // Assume already built
			log,
			{cwd: repo.repo_dir},
		);

		if (!publish_result?.ok) {
			throw new Error(`Failed to publish ${repo.pkg.name}`);
		}

		// Get actual commit hash
		const commit = (await git_current_commit_hash(undefined, {cwd: repo.repo_dir})) || 'HEAD';

		return {
			name: repo.pkg.name,
			old_version,
			new_version,
			commit,
			tag: `v${new_version}`,
		};
	}

	/**
	 * Updates dependencies in a repo's package.json.
	 */
	private async update_dependencies(
		repo: Local_Repo,
		strategy: 'exact' | 'caret' | 'tilde',
		log?: Logger,
	): Promise<void> {
		const updates = new Map<string, string>();

		// Check each dependency against published versions
		for (const [dep_name] of repo.dependencies || new Map()) {
			const published = this.state.published.get(dep_name);
			if (published) {
				updates.set(dep_name, published.new_version);
			}
		}

		for (const [dep_name] of repo.dev_dependencies || new Map()) {
			const published = this.state.published.get(dep_name);
			if (published) {
				updates.set(dep_name, published.new_version);
			}
		}

		for (const [dep_name] of repo.peer_dependencies || new Map()) {
			const published = this.state.published.get(dep_name);
			if (published) {
				updates.set(dep_name, published.new_version);
			}
		}

		if (updates.size > 0) {
			log?.info(`Updating ${updates.size} dependencies in ${repo.pkg.name}`);

			// Read current package.json
			const package_json_path = join(repo.repo_dir, 'package.json');
			const {default: package_json} = await import(package_json_path);

			// Update versions
			const updated = this.version_manager.update_dependency_versions(
				package_json,
				updates,
				strategy,
			);

			// Write back
			await writeFile(package_json_path, JSON.stringify(updated, null, 2) + '\n');

			// Commit changes
			await spawn_cli('git', ['add', 'package.json'], log, {cwd: repo.repo_dir});
			await spawn_cli('git', ['commit', '-m', `update dependencies after publishing`], log, {
				cwd: repo.repo_dir,
			});
		}
	}

	/**
	 * Gets the current publishing status.
	 */
	get_status(): Publishing_Status {
		const status = this.state.get_status();
		switch (status) {
			case 'complete':
				return 'published';
			case 'in_progress':
				return 'in_progress';
			case 'failed':
				return 'failed';
			default:
				return 'pending';
		}
	}

	toJSON(): any {
		return this.state.toJSON();
	}
}

/**
 * Helper to create and execute publishing orchestration.
 */
export const publish_repos = async (
	graph: Dependency_Graph,
	order: Array<string>,
	options: Publishing_Options,
): Promise<Publishing_Result> => {
	const orchestrator = new Publishing_Orchestrator(graph, order);
	return orchestrator.execute(options);
};
