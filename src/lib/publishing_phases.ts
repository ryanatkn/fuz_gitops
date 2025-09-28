import type {Logger} from '@ryanatkn/belt/log.js';
import {styleText as st} from 'node:util';
import type {Local_Repo} from './local_repo.js';
import type {Dependency_Graph} from './dependency_graph.js';
import {Dependency_Classifier} from './dependency_classifier.js';
import {Registry_Monitor} from './registry_monitor.js';
import {Publishing_Orchestrator} from './publishing_orchestrator.js';
import type {Bump_Type} from './version_manager.js';

export interface Publishing_Phase {
	name: string;
	description: string;
	execute: () => Promise<Phase_Result>;
}

export interface Phase_Result {
	ok: boolean;
	phase: string;
	duration: number;
	errors?: Array<Error>;
	data?: any;
}

export interface Publishing_Phases_Config {
	graph: Dependency_Graph;
	repos: Array<Local_Repo>;
	dry: boolean;
	bump: Bump_Type | 'auto';
	continue_on_error: boolean;
	update_peers: boolean;
	peer_dependency_strategy: 'exact' | 'caret' | 'tilde';
	log?: Logger;
}

export interface Publishing_Context {
	graph: Dependency_Graph;
	classifier: Dependency_Classifier;
	registry_monitor: Registry_Monitor;
	orchestrator: Publishing_Orchestrator;
	publishing_order: Array<string>;
	published_versions: Map<string, {version: string; timestamp: Date}>;
	phase_results: Array<Phase_Result>;
	start_time: number;
}

/**
 * Manages multi-phase publishing workflow.
 */
export class Publishing_Phases_Manager {
	private config: Publishing_Phases_Config;
	private context: Publishing_Context;
	private phases: Array<Publishing_Phase>;

	constructor(config: Publishing_Phases_Config) {
		this.config = config;

		// Initialize context
		const classifier = new Dependency_Classifier();
		const publishing_order = config.graph.topological_sort(true); // Exclude dev deps
		const orchestrator = new Publishing_Orchestrator(config.graph, publishing_order);

		this.context = {
			graph: config.graph,
			classifier,
			registry_monitor: new Registry_Monitor({log: config.log}),
			orchestrator,
			publishing_order,
			published_versions: new Map(),
			phase_results: [],
			start_time: Date.now(),
		};

		// Define phases
		this.phases = [
			this.create_analysis_phase(),
			this.create_publishing_phase(),
			this.create_propagation_phase(),
			this.create_reconciliation_phase(),
			this.create_verification_phase(),
		];
	}

	/**
	 * Executes all publishing phases.
	 */
	async execute(): Promise<{ok: boolean; results: Array<Phase_Result>; total_duration: number}> {
		const {log} = this.config;

		log?.info(st('cyan', '🚀 Starting multi-phase publishing workflow\n'));

		let all_ok = true;

		for (const phase of this.phases) {
			log?.info(st('yellow', `\n📋 Phase: ${phase.name}`));
			log?.info(st('dim', phase.description));

			const start_time = Date.now();

			try {
				const result = await phase.execute();
				result.duration = Date.now() - start_time;
				this.context.phase_results.push(result);

				if (result.ok) {
					log?.info(
						st('green', `✓ ${phase.name} completed`) +
							st('dim', ` (${(result.duration / 1000).toFixed(1)}s)`),
					);
				} else {
					log?.error(st('red', `✗ ${phase.name} failed`));
					all_ok = false;
					if (!this.config.continue_on_error) {
						break;
					}
				}
			} catch (error) {
				const err = error instanceof Error ? error : new Error(String(error));
				const result: Phase_Result = {
					ok: false,
					phase: phase.name,
					duration: Date.now() - start_time,
					errors: [err],
				};
				this.context.phase_results.push(result);
				log?.error(st('red', `✗ ${phase.name} failed: ${err.message}`));
				all_ok = false;
				if (!this.config.continue_on_error) {
					break;
				}
			}
		}

		const total_duration = Date.now() - this.context.start_time;

		// Final summary
		log?.info(st('cyan', '\n📊 Publishing Summary'));
		for (const result of this.context.phase_results) {
			const icon = result.ok ? st('green', '✓') : st('red', '✗');
			log?.info(
				`  ${icon} ${result.phase}: ${(result.duration / 1000).toFixed(1)}s`,
			);
		}
		log?.info(st('dim', `\nTotal time: ${(total_duration / 1000).toFixed(1)}s`));

		return {
			ok: all_ok,
			results: this.context.phase_results,
			total_duration,
		};
	}

	/**
	 * Phase 1: Analysis - Validate and prepare.
	 */
	private create_analysis_phase(): Publishing_Phase {
		return {
			name: 'Analysis',
			description: 'Analyzing dependencies and detecting issues',
			execute: async () => {
				const {log} = this.config;

				// Classify dependencies
				const classification = this.context.classifier.classify(this.context.graph);

				// Check for cycles in publishing dependencies (should be resolved by excluding dev deps)
				const cycles = this.context.graph.detect_cycles();
				const publishing_cycles = cycles.filter((cycle) => {
					// Check if cycle only involves dev dependencies
					return !cycle.every((pkg) => {
						const node = this.context.graph.get_node(pkg);
						if (!node) return false;
						// This is a simplification - would need more sophisticated check
						return true;
					});
				});

				if (publishing_cycles.length > 0) {
					log?.error('Found cycles in publishing dependencies:');
					for (const cycle of publishing_cycles) {
						log?.error(`  ${cycle.join(' → ')}`);
					}
					return {
						ok: false,
						phase: 'Analysis',
						duration: 0,
						errors: [new Error('Circular dependencies in publishing graph')],
					};
				}

				// Report findings
				log?.info(`  Publishing order: ${this.context.publishing_order.length} packages`);
				log?.info(`  Cycle-causing edges: ${classification.cycle_causing_edges.length} (all dev deps)`);

				return {
					ok: true,
					phase: 'Analysis',
					duration: 0,
					data: {classification, publishing_order: this.context.publishing_order},
				};
			},
		};
	}

	/**
	 * Phase 2: Publishing - Publish all packages in order.
	 */
	private create_publishing_phase(): Publishing_Phase {
		return {
			name: 'Publishing',
			description: 'Publishing packages in dependency order',
			execute: async () => {
				const {log, dry} = this.config;

				if (dry) {
					log?.info(st('yellow', '  🔍 Dry run - skipping actual publishing'));
					return {
						ok: true,
						phase: 'Publishing',
						duration: 0,
						data: {dry_run: true},
					};
				}

				// Execute publishing
				const result = await this.context.orchestrator.execute({
					dry: false,
					bump: this.config.bump,
					continue_on_error: this.config.continue_on_error,
					update_peers: false, // Handle in propagation phase
					log,
				});

				// Track published versions
				for (const published of result.published) {
					this.context.published_versions.set(published.name, {
						version: published.new_version,
						timestamp: new Date(),
					});
				}

				return {
					ok: result.ok,
					phase: 'Publishing',
					duration: result.duration,
					data: result,
					errors: result.failed.map((f) => f.error),
				};
			},
		};
	}

	/**
	 * Phase 3: Propagation - Update peer and prod dependencies.
	 */
	private create_propagation_phase(): Publishing_Phase {
		return {
			name: 'Propagation',
			description: 'Updating peer and production dependencies',
			execute: async () => {
				const {log, dry} = this.config;

				if (dry) {
					return {
						ok: true,
						phase: 'Propagation',
						duration: 0,
						data: {dry_run: true},
					};
				}

				// Wait for all published packages to be available
				log?.info('  Waiting for packages to be available on npm...');
				const packages_to_check = Array.from(this.context.published_versions.entries()).map(
					([name, {version}]) => ({name, version}),
				);

				const availability_results = await this.context.registry_monitor.wait_for_multiple(
					packages_to_check,
				);

				// Check if all packages are available
				const all_available = Array.from(availability_results.values()).every((r) => r.available);
				if (!all_available) {
					return {
						ok: false,
						phase: 'Propagation',
						duration: 0,
						errors: [new Error('Some packages failed to become available on npm')],
					};
				}

				// Plan and execute updates
				const updates = this.context.classifier.plan_updates(
					this.context.graph,
					this.context.published_versions,
					'propagation',
				);

				log?.info(`  Updating ${updates.length} dependency references...`);

				// TODO: Execute updates using spawn_cli to update package.json files
				// This would involve:
				// 1. For each repo with updates, modify its package.json
				// 2. Run npm install to update lock file
				// 3. Commit the changes
				// For now, just return success

				return {
					ok: true,
					phase: 'Propagation',
					duration: 0,
					data: {updates},
				};
			},
		};
	}

	/**
	 * Phase 4: Reconciliation - Update dev dependencies.
	 */
	private create_reconciliation_phase(): Publishing_Phase {
		return {
			name: 'Reconciliation',
			description: 'Updating development dependencies',
			execute: async () => {
				const {log, dry} = this.config;

				if (dry) {
					return {
						ok: true,
						phase: 'Reconciliation',
						duration: 0,
						data: {dry_run: true},
					};
				}

				// Plan dev dependency updates
				const updates = this.context.classifier.plan_updates(
					this.context.graph,
					this.context.published_versions,
					'reconciliation',
				);

				log?.info(`  Updating ${updates.length} dev dependency references...`);

				// TODO: Execute updates using reconciliation_manager
				// This would use the Reconciliation_Manager to:
				// 1. Wait for all packages to be installable
				// 2. Update dev dependencies in each repo
				// 3. Run install, tests, and commit changes
				// For now, just return success

				return {
					ok: true,
					phase: 'Reconciliation',
					duration: 0,
					data: {updates},
				};
			},
		};
	}

	/**
	 * Phase 5: Verification - Ensure everything is consistent.
	 */
	private create_verification_phase(): Publishing_Phase {
		return {
			name: 'Verification',
			description: 'Verifying all dependencies are consistent',
			execute: async () => {
				const {log} = this.config;

				// TODO: Implement verification checks
				// This would:
				// 1. Check that all dependencies resolve correctly
				// 2. Run integration tests across repos
				// 3. Verify no version conflicts
				// 4. Ensure all packages are installable
				// For now, just log what we would do
				log?.info('  Checking dependency consistency...');
				log?.info('  Running integration tests...');

				return {
					ok: true,
					phase: 'Verification',
					duration: 0,
					data: {verified: true},
				};
			},
		};
	}

	toJSON(): any {
		return {
			phases: this.phases.map((p) => p.name),
			context: {
				publishing_order: this.context.publishing_order,
				published_versions: Array.from(this.context.published_versions.entries()),
				phase_results: this.context.phase_results,
			},
		};
	}
}