import type {Task} from '@ryanatkn/gro';
import {z} from 'zod';
import {styleText as st} from 'node:util';

import {get_gitops_ready} from './gitops_task_helpers.js';
import {preview_publishing_plan, log_publishing_preview, type Publishing_Preview} from './publishing_preview.js';

const Args = z
	.object({
		dir: z.string().describe('root directory for repos').optional(),
		path: z.string().describe('path to gitops config file').default('gitops.config.ts'),
		format: z
			.enum(['stdout', 'json', 'markdown'])
			.describe('output format')
			.default('stdout'),
	})
	.strict();

type Args = z.infer<typeof Args>;

/**
 * Preview what would happen during multi-repo publishing.
 * Shows version changes, dependency updates, and breaking change cascades.
 *
 * Usage:
 *   gro gitops_preview
 *   gro gitops_preview --dir ../repos
 *   gro gitops_preview --path ./custom.config.ts
 */
export const task: Task<Args> = {
	summary: 'preview what will happen during multi-repo publishing based on changesets',
	Args,
	run: async ({args, log}): Promise<void> => {
		const {dir, path, format} = args;

		log.info(st('cyan', '🔍 Previewing multi-repo publishing plan...\n'));

		// Load local repos
		const {local_repos} = await get_gitops_ready(
			path,
			dir,
			false, // Don't download if missing
			false, // Don't install
			log,
		);

		if (local_repos.length === 0) {
			log.error('No local repos found');
			return;
		}

		log.info(`  Found ${local_repos.length} local repos`);

		// Generate publishing preview
		const preview = await preview_publishing_plan(local_repos, log);

		// Display the preview based on format
		if (format === 'json') {
			// Output as JSON
			const output = {
				publishing_order: preview.publishing_order,
				version_changes: preview.version_changes,
				dependency_updates: preview.dependency_updates,
				breaking_cascades: Object.fromEntries(preview.breaking_cascades),
				warnings: preview.warnings,
				errors: preview.errors,
			};
			log.info(JSON.stringify(output, null, 2));
		} else if (format === 'markdown') {
			// Output as markdown
			const lines = format_preview_as_markdown(preview);
			for (const line of lines) {
				log.info(line);
			}
		} else {
			// Default stdout format
			log_publishing_preview(preview, log);
		}

		// Exit with error if there are blocking issues
		if (preview.errors.length > 0) {
			throw new Error('Publishing preview found errors that would block publishing');
		}
	},
};

/**
 * Format the publishing preview as markdown.
 */
const format_preview_as_markdown = (preview: Publishing_Preview): Array<string> => {
	const lines: Array<string> = [];
	const {
		publishing_order,
		version_changes,
		dependency_updates,
		breaking_cascades,
		warnings,
		errors,
	} = preview;

	lines.push('# Publishing Preview');
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
		lines.push(publishing_order.map(p => `\`${p}\``).join(' → '));
		lines.push('');
	}

	// Version changes
	if (version_changes.length > 0) {
		const with_changesets = version_changes.filter(vc => vc.has_changesets);
		const with_auto_changesets = version_changes.filter(vc => vc.will_generate_changeset);

		if (with_changesets.length > 0) {
			lines.push('## Version Changes (from changesets)');
			lines.push('');
			lines.push('| Package | From | To | Bump | Breaking |');
			lines.push('|---------|------|----|------|----------|');
			for (const change of with_changesets) {
				const breaking = change.breaking ? '💥 Yes' : 'No';
				lines.push(
					`| \`${change.package_name}\` | ${change.from} | ${change.to} | ${change.bump_type} | ${breaking} |`,
				);
			}
			lines.push('');
		}

		if (with_auto_changesets.length > 0) {
			lines.push('## Version Changes (auto-generated for dependency updates)');
			lines.push('');
			lines.push('| Package | From | To | Bump | Reason |');
			lines.push('|---------|------|-------|------|--------|');
			for (const change of with_auto_changesets) {
				lines.push(
					`| \`${change.package_name}\` | ${change.from} | ${change.to} | ${change.bump_type} | Dependency updates |`,
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

	// Breaking cascades
	if (breaking_cascades.size > 0) {
		lines.push('## Breaking Change Cascades');
		lines.push('');
		for (const [pkg, affected] of breaking_cascades) {
			lines.push(`- \`${pkg}\` affects: ${affected.map(a => `\`${a}\``).join(', ')}`);
		}
		lines.push('');
	}

	// Dependency updates
	if (dependency_updates.length > 0) {
		// Group by package
		const updates_by_package = new Map<string, typeof dependency_updates>();
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

	// Warnings
	if (warnings.length > 0) {
		lines.push('## ⚠️ Warnings');
		lines.push('');
		for (const warning of warnings) {
			lines.push(`- ${warning}`);
		}
		lines.push('');
	}

	// Summary
	lines.push('## Summary');
	lines.push('');
	lines.push(`- **Packages to publish**: ${version_changes.length}`);
	lines.push(`- **Dependency updates**: ${dependency_updates.length}`);
	lines.push(`- **Breaking changes**: ${breaking_cascades.size}`);
	lines.push(`- **Warnings**: ${warnings.length}`);
	lines.push(`- **Errors**: ${errors.length}`);

	return lines;
};