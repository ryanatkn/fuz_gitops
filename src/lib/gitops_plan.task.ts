import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';
import {styleText as st} from 'node:util';
import {writeFile} from 'node:fs/promises';

import {get_gitops_ready} from '$lib/gitops_task_helpers.js';
import {
	generate_publishing_plan,
	log_publishing_plan,
	type Publishing_Plan,
} from '$lib/publishing_plan.js';

const Args = z
	.object({
		dir: z.string().describe('root directory for repos').optional(),
		path: z.string().describe('path to gitops config file').default('gitops.config.ts'),
		format: z.enum(['stdout', 'json', 'markdown']).describe('output format').default('stdout'),
		outfile: z.string().describe('write output to file instead of logging').optional(),
	})
	.strict();

type Args = z.infer<typeof Args>;

/**
 * Generate a publishing plan showing what would happen during multi-repo publishing.
 * Shows version changes, dependency updates, and breaking change cascades.
 *
 * Usage:
 *   gro gitops_plan
 *   gro gitops_plan --dir ../repos
 *   gro gitops_plan --path ./custom.config.ts
 */
export const task: Task<Args> = {
	summary: 'generate a publishing plan based on changesets',
	Args,
	run: async ({args, log}): Promise<void> => {
		const {dir, path, format, outfile} = args;

		log.info(st('cyan', 'Generating multi-repo publishing plan...'));

		// Load local repos
		const {local_repos} = await get_gitops_ready(
			path,
			dir,
			false, // Don't download if missing
			log,
		);

		if (local_repos.length === 0) {
			log.error('No local repos found');
			return;
		}

		log.info(`  Found ${local_repos.length} local repos`);

		// Generate publishing plan
		const plan = await generate_publishing_plan(local_repos, log);

		// Display the plan based on format
		let content: string;
		if (format === 'json') {
			// Output as JSON
			const output = {
				publishing_order: plan.publishing_order,
				version_changes: plan.version_changes,
				dependency_updates: plan.dependency_updates,
				breaking_cascades: Object.fromEntries(plan.breaking_cascades),
				warnings: plan.warnings,
				info: plan.info,
				errors: plan.errors,
			};
			content = JSON.stringify(output, null, 2);
		} else if (format === 'markdown') {
			// Output as markdown
			const lines = format_plan_as_markdown(plan);
			content = lines.join('\n');
		} else {
			// Default stdout format - special handling since it uses log directly
			if (outfile) {
				throw new Error('--outfile is not supported with stdout format, use json or markdown');
			}
			log_publishing_plan(plan, log);
			content = '';
		}

		// Output to file or log
		if (content && outfile) {
			await writeFile(outfile, content);
			log.info(`Output written to ${outfile}`);
		} else if (content) {
			// Log line by line for json/markdown formats
			for (const line of content.split('\n')) {
				log.info(line);
			}
		}

		// Exit with error if there are blocking issues
		if (plan.errors.length > 0) {
			throw new Error('Publishing plan found errors that would block publishing');
		}
	},
};

/**
 * Format the publishing plan as markdown.
 */
const format_plan_as_markdown = (plan: Publishing_Plan): Array<string> => {
	const lines: Array<string> = [];
	const {
		publishing_order,
		version_changes,
		dependency_updates,
		breaking_cascades,
		warnings,
		info,
		errors,
	} = plan;

	lines.push('# Publishing Plan');
	lines.push('');

	// Errors
	if (errors.length > 0) {
		lines.push('## ❌ Errors');
		lines.push('');
		for (const error of errors) {
			lines.push(`- ${error}`);
		}
		lines.push('');
	}

	// Publishing order
	if (publishing_order.length > 0) {
		lines.push('## Publishing Order');
		lines.push('');
		lines.push(publishing_order.map((p) => `\`${p}\``).join(' → '));
		lines.push('');
	}

	// Version changes
	if (version_changes.length > 0) {
		const with_changesets = version_changes.filter(
			(vc) => vc.has_changesets && !vc.needs_bump_escalation,
		);
		const with_escalation = version_changes.filter((vc) => vc.needs_bump_escalation);
		const with_auto_changesets = version_changes.filter((vc) => vc.will_generate_changeset);

		if (with_changesets.length > 0) {
			lines.push('## Version Changes (from changesets)');
			lines.push('');
			lines.push('| Package | From | To | Bump | Major |');
			lines.push('|---------|------|----|------|-------|');
			for (const change of with_changesets) {
				const is_major = change.bump_type === 'major' ? '💥 Yes' : 'No';
				lines.push(
					`| \`${change.package_name}\` | ${change.from} | ${change.to} | ${change.bump_type} | ${is_major} |`,
				);
			}
			lines.push('');
		}

		if (with_escalation.length > 0) {
			lines.push('## Version Changes (bump escalation required)');
			lines.push('');
			lines.push('| Package | From | To | Changesets Bump | Required Bump | Major |');
			lines.push('|---------|------|-----|-----------------|---------------|-------|');
			for (const change of with_escalation) {
				const is_major = change.bump_type === 'major' ? '💥 Yes' : 'No';
				lines.push(
					`| \`${change.package_name}\` | ${change.from} | ${change.to} | ${change.existing_bump} | ${change.required_bump} | ${is_major} |`,
				);
			}
			lines.push('');
			lines.push(
				'> ⬆️ These packages have changesets, but dependencies require a larger version bump.',
			);
			lines.push('');
		}

		if (with_auto_changesets.length > 0) {
			lines.push('## Version Changes (auto-generated for dependency updates)');
			lines.push('');
			lines.push('| Package | From | To | Bump | Major |');
			lines.push('|---------|------|-----|------|-------|');
			for (const change of with_auto_changesets) {
				const is_major = change.bump_type === 'major' ? '💥 Yes' : 'No';
				lines.push(
					`| \`${change.package_name}\` | ${change.from} | ${change.to} | ${change.bump_type} | ${is_major} |`,
				);
			}
			lines.push('');
		}
	} else {
		lines.push('## No Packages to Publish');
		lines.push('');
		lines.push('No packages have changesets to publish.');
		lines.push('');
	}

	// Dependency cascades
	if (breaking_cascades.size > 0) {
		lines.push('## Dependency Cascades');
		lines.push('');
		for (const [pkg, affected] of breaking_cascades) {
			lines.push(`- \`${pkg}\` affects: ${affected.map((a) => `\`${a}\``).join(', ')}`);
		}
		lines.push('');
	}

	// Dependency updates
	if (dependency_updates.length > 0) {
		// Group by package
		const updates_by_package: Map<string, typeof dependency_updates> = new Map();
		for (const update of dependency_updates) {
			const updates = updates_by_package.get(update.dependent_package) || [];
			updates.push(update);
			updates_by_package.set(update.dependent_package, updates);
		}

		lines.push('## Dependency Updates');
		lines.push('');
		for (const [pkg, updates] of updates_by_package) {
			lines.push(`### ${pkg}`);
			lines.push('');
			lines.push('| Dependency | New Version | Type | Triggers Republish |');
			lines.push('|------------|-------------|------|-------------------|');
			for (const update of updates) {
				const republish = update.causes_republish ? 'Yes' : 'No';
				lines.push(
					`| \`${update.updated_dependency}\` | ${update.new_version} | ${update.type} | ${republish} |`,
				);
			}
			lines.push('');
		}
	}

	// Warnings (actual issues requiring attention)
	if (warnings.length > 0) {
		lines.push('## ⚠️ Warnings');
		lines.push('');
		lines.push('*Issues that require attention:*');
		lines.push('');
		for (const warning of warnings) {
			lines.push(`- ${warning}`);
		}
		lines.push('');
	}

	// Info (packages with no changes - normal status)
	if (info.length > 0) {
		lines.push('## ℹ️ No Changes to Publish');
		lines.push('');
		lines.push('*These packages have no changesets and no dependency updates:*');
		lines.push('');
		for (const pkg of info) {
			lines.push(`- \`${pkg}\``);
		}
		lines.push('');
	}

	// Summary
	const major_bump_count = version_changes.filter((vc) => vc.bump_type === 'major').length;
	lines.push('## Summary');
	lines.push('');
	lines.push(`- **Packages to publish**: ${version_changes.length}`);
	lines.push(`- **Dependency updates**: ${dependency_updates.length}`);
	lines.push(`- **Major version bumps**: ${major_bump_count}`);
	lines.push(`- **Warnings**: ${warnings.length}`);
	lines.push(`- **Errors**: ${errors.length}`);

	return lines;
};
