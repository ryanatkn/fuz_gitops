import {styleText as st} from 'node:util';
import type {Publishing_State, Publishing_Result} from './publishing_orchestrator.js';

export interface Format_Options {
	format: 'stdout' | 'json' | 'markdown';
	verbose?: boolean;
	show_dependencies?: boolean;
	show_graph?: boolean;
}

/**
 * Formats the publishing plan for output.
 */
export const format_publishing_plan = (
	state: Publishing_State,
	format: Format_Options['format'],
): string => {
	switch (format) {
		case 'json':
			return format_plan_as_json(state);
		case 'markdown':
			return format_plan_as_markdown(state);
		default:
			return format_plan_as_stdout(state);
	}
};

/**
 * Formats the publishing result for output.
 */
export const format_publishing_result = (
	result: Publishing_Result,
	format: Format_Options['format'],
): string => {
	switch (format) {
		case 'json':
			return format_result_as_json(result);
		case 'markdown':
			return format_result_as_markdown(result);
		default:
			return format_result_as_stdout(result);
	}
};

const format_plan_as_json = (state: Publishing_State): string => {
	return JSON.stringify(state.toJSON(), null, 2);
};

const format_plan_as_markdown = (state: Publishing_State): string => {
	const lines: Array<string> = ['# Publishing Plan'];

	// Publishing order
	lines.push('', '## Publishing Order', '');
	state.order.forEach((name, i) => {
		const node = state.graph.get_node(name);
		const version = node ? node.version : 'unknown';
		lines.push(`${i + 1}. ${name} (${version})`);
	});

	// Dependencies that will be updated
	lines.push('', '## Dependency Updates', '');
	for (const name of state.order) {
		const node = state.graph.get_node(name);
		if (node) {
			const deps = Array.from(node.dependencies.entries()).filter(([dep_name]) =>
				state.order.includes(dep_name),
			);
			if (deps.length > 0) {
				lines.push(`### ${name}`);
				for (const [dep_name, spec] of deps) {
					lines.push(`- ${dep_name}: ${spec.version} → (will be updated)`);
				}
				lines.push('');
			}
		}
	}

	return lines.join('\n');
};

const format_plan_as_stdout = (state: Publishing_State): string => {
	const lines: Array<string> = [];

	lines.push(st('cyan', '🚀 Publishing Plan\n'));

	// Publishing order
	lines.push(st('yellow', 'Publishing order:'));
	state.order.forEach((name, i) => {
		const node = state.graph.get_node(name);
		const version = node ? node.version : 'unknown';
		lines.push(`  ${st('dim', `${i + 1}.`)} ${name} ${st('dim', `(${version})`)}`);
	});

	// Count dependencies that will be updated
	let update_count = 0;
	for (const name of state.order) {
		const node = state.graph.get_node(name);
		if (node) {
			update_count += Array.from(node.dependencies.keys()).filter((dep_name) =>
				state.order.includes(dep_name),
			).length;
		}
	}

	if (update_count > 0) {
		lines.push('');
		lines.push(st('yellow', `Dependencies to update: ${update_count}`));
	}

	return lines.join('\n');
};

const format_result_as_json = (result: Publishing_Result): string => {
	return JSON.stringify(
		{
			ok: result.ok,
			duration: result.duration,
			published: result.published,
			failed: result.failed.map((f) => ({
				name: f.name,
				error: f.error.message,
			})),
		},
		null,
		2,
	);
};

const format_result_as_markdown = (result: Publishing_Result): string => {
	const lines: Array<string> = ['# Publishing Report'];

	lines.push('', `**Status:** ${result.ok ? '✅ Success' : '❌ Failed'}`);
	lines.push(`**Duration:** ${result.duration}ms`);

	// Published packages
	if (result.published.length > 0) {
		lines.push('', '## Published Packages', '');
		lines.push('| Package | Old Version | New Version | Tag |');
		lines.push('|---------|------------|-------------|-----|');
		for (const pkg of result.published) {
			lines.push(`| ${pkg.name} | ${pkg.old_version} | ${pkg.new_version} | ${pkg.tag} |`);
		}
	}

	// Failed packages
	if (result.failed.length > 0) {
		lines.push('', '## Failed Packages', '');
		for (const {name, error} of result.failed) {
			lines.push(`- **${name}**: ${error.message}`);
		}
	}

	return lines.join('\n');
};

const format_result_as_stdout = (result: Publishing_Result): string => {
	const lines: Array<string> = [];

	if (result.ok) {
		lines.push(
			st('green', `\n✅ Publishing complete: ${result.published.length} packages published`),
		);
	} else {
		lines.push(
			st(
				'red',
				`\n❌ Publishing failed: ${result.published.length} succeeded, ${result.failed.length} failed`,
			),
		);
	}

	// Show published packages
	if (result.published.length > 0) {
		lines.push('');
		lines.push(st('yellow', 'Published:'));
		for (const pkg of result.published) {
			const bump_type = detect_bump_type(pkg.old_version, pkg.new_version);
			lines.push(
				`  ${st('green', '✓')} ${pkg.name}@${pkg.new_version} ${st('dim', `(${bump_type})`)}`,
			);
		}
	}

	// Show failed packages
	if (result.failed.length > 0) {
		lines.push('');
		lines.push(st('red', 'Failed:'));
		for (const {name, error} of result.failed) {
			lines.push(`  ${st('red', '✗')} ${name}: ${error.message}`);
		}
	}

	// Duration
	lines.push('');
	lines.push(st('dim', `Duration: ${(result.duration / 1000).toFixed(1)}s`));

	return lines.join('\n');
};

/**
 * Formats dependency updates for display.
 */
export const format_dependency_updates = (
	updates: Map<string, Map<string, {old_version: string; new_version: string}>>,
	format: 'stdout' | 'markdown',
): string => {
	if (updates.size === 0) return '';

	if (format === 'markdown') {
		const lines: Array<string> = ['## Dependency Updates', ''];
		for (const [pkg, deps] of updates) {
			lines.push(`### ${pkg}`);
			for (const [dep, {old_version, new_version}] of deps) {
				lines.push(`- ${dep}: ${old_version} → ${new_version}`);
			}
			lines.push('');
		}
		return lines.join('\n');
	} else {
		const lines: Array<string> = [st('yellow', 'Dependencies updated:')];
		for (const [pkg, deps] of updates) {
			for (const [dep, {old_version, new_version}] of deps) {
				lines.push(`  ${pkg}: ${dep}@${old_version} → ${new_version}`);
			}
		}
		return lines.join('\n');
	}
};

/**
 * Formats the publishing status for real-time display.
 */
export const format_publishing_status = (
	state: Publishing_State,
	current: string | null,
): string => {
	const lines: Array<string> = [];

	for (const name of state.order) {
		const published = state.published.has(name);
		const failed = state.failed.has(name);
		const is_current = name === current;

		let status_icon: string;
		let status_text: string;

		if (published) {
			const version = state.published.get(name)!;
			status_icon = st('green', '✅');
			status_text = `${name}@${version.new_version}`;
		} else if (failed) {
			status_icon = st('red', '❌');
			status_text = st('red', name);
		} else if (is_current) {
			status_icon = st('yellow', '⏳');
			status_text = st('yellow', name);
		} else {
			status_icon = st('dim', '⏸️ ');
			status_text = st('dim', name);
		}

		lines.push(`${status_icon} ${status_text}`);
	}

	return lines.join('\n');
};

const detect_bump_type = (old_version: string, new_version: string): string => {
	const old_parts = old_version.split('.');
	const new_parts = new_version.split('.');

	if (old_parts[0] !== new_parts[0]) return 'major';
	if (old_parts[1] !== new_parts[1]) return 'minor';
	if (old_parts[2] !== new_parts[2]) return 'patch';
	return 'unknown';
};
