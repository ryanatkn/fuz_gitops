/**
 * Comparison utilities for flexible output matching between predicted and actual command outputs.
 * These utilities handle common variations that don't represent functional differences.
 */

export interface Comparison_Options {
	ignore_whitespace?: boolean;
	ignore_line_order?: boolean;
	ignore_version_patches?: boolean;
	ignore_timestamps?: boolean;
	normalize_paths?: boolean;
	tolerance_threshold?: number; // Allow up to N differences
}

export interface Semantic_Difference {
	type: 'addition' | 'removal' | 'modification' | 'reorder';
	location: string;
	expected?: string;
	actual?: string;
	severity: 'low' | 'medium' | 'high';
}

/**
 * Advanced comparison that focuses on semantic differences rather than formatting
 */
export const semantic_compare = (
	expected: string,
	actual: string,
	options: Comparison_Options = {}
): {matches: boolean; differences: Array<Semantic_Difference>; summary: string} => {
	const {
		ignore_whitespace = true,
		ignore_version_patches = false,
		ignore_timestamps = true,
		normalize_paths = true,
		tolerance_threshold = 0,
	} = options;

	let normalized_expected = expected;
	let normalized_actual = actual;

	// Apply normalizations
	if (ignore_timestamps) {
		normalized_expected = normalize_timestamps(normalized_expected);
		normalized_actual = normalize_timestamps(normalized_actual);
	}

	if (normalize_paths) {
		normalized_expected = normalize_file_paths(normalized_expected);
		normalized_actual = normalize_file_paths(normalized_actual);
	}

	if (ignore_whitespace) {
		normalized_expected = normalize_whitespace(normalized_expected);
		normalized_actual = normalize_whitespace(normalized_actual);
	}

	if (ignore_version_patches) {
		normalized_expected = normalize_version_patches(normalized_expected);
		normalized_actual = normalize_version_patches(normalized_actual);
	}

	// Find semantic differences
	const differences = find_semantic_differences(normalized_expected, normalized_actual);

	// Filter by severity and tolerance
	const significant_differences = differences.filter(diff =>
		diff.severity !== 'low' || differences.length > tolerance_threshold
	);

	const matches = significant_differences.length <= tolerance_threshold;

	const summary = generate_comparison_summary(differences, matches);

	return {
		matches,
		differences: significant_differences,
		summary,
	};
};

/**
 * Normalize timestamps to avoid false positives from timing differences
 */
const normalize_timestamps = (content: string): string => {
	return content
		// ISO timestamps
		.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?/g, 'TIMESTAMP')
		// Human readable dates
		.replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, 'DATE')
		// Time only
		.replace(/\d{1,2}:\d{2}(:\d{2})?/g, 'TIME');
};

/**
 * Normalize file paths to avoid differences from different environments
 */
const normalize_file_paths = (content: string): string => {
	return content
		// Absolute paths
		.replace(/\/[^\s]+\/dev\/[^\s]*/g, '/dev/REPO')
		// Windows paths
		.replace(/[A-Z]:\\[^\s]+\\dev\\[^\s]*/g, 'C:\\dev\\REPO')
		// Relative paths with ../
		.replace(/\.\.\/[^\s]+/g, '../REPO');
};

/**
 * Normalize whitespace while preserving structure
 */
const normalize_whitespace = (content: string): string => {
	return content
		// Normalize line endings
		.replace(/\r\n/g, '\n')
		// Remove trailing whitespace
		.replace(/[ \t]+$/gm, '')
		// Normalize multiple spaces to single space (except in code blocks)
		.replace(/(?<!`)  +(?!`)/g, ' ')
		// Remove excessive blank lines
		.replace(/\n{3,}/g, '\n\n')
		.trim();
};

/**
 * Normalize patch versions to focus on major/minor changes
 */
const normalize_version_patches = (content: string): string => {
	// Replace patch versions (x.y.z -> x.y.*)
	return content.replace(/(\d+\.\d+)\.\d+/g, '$1.*');
};

/**
 * Find semantic differences between normalized content
 */
const find_semantic_differences = (expected: string, actual: string): Array<Semantic_Difference> => {
	const differences: Array<Semantic_Difference> = [];

	const expected_lines = expected.split('\n');
	const actual_lines = actual.split('\n');

	// Compare line by line with context awareness
	const max_lines = Math.max(expected_lines.length, actual_lines.length);

	for (let i = 0; i < max_lines; i++) {
		const expected_line = expected_lines[i] || '';
		const actual_line = actual_lines[i] || '';

		if (expected_line !== actual_line) {
			const location = `line ${i + 1}`;

			if (!expected_line) {
				differences.push({
					type: 'addition',
					location,
					actual: actual_line,
					severity: categorize_line_severity(actual_line),
				});
			} else if (!actual_line) {
				differences.push({
					type: 'removal',
					location,
					expected: expected_line,
					severity: categorize_line_severity(expected_line),
				});
			} else {
				differences.push({
					type: 'modification',
					location,
					expected: expected_line,
					actual: actual_line,
					severity: categorize_modification_severity(expected_line, actual_line),
				});
			}
		}
	}

	return differences;
};

/**
 * Categorize the severity of a line change
 */
const categorize_line_severity = (line: string): 'low' | 'medium' | 'high' => {
	// Empty lines or pure whitespace
	if (!line.trim()) return 'low';

	// Comments or metadata
	if (line.trim().startsWith('<!--') || line.trim().startsWith('//')) return 'low';

	// Headers and structure
	if (line.startsWith('#') || line.includes('##') || line.includes('|')) return 'high';

	// Version numbers or important data
	if (line.match(/\d+\.\d+\.\d+/) || line.includes('→')) return 'medium';

	return 'medium';
};

/**
 * Categorize the severity of a line modification
 */
const categorize_modification_severity = (expected: string, actual: string): 'low' | 'medium' | 'high' => {
	// If only whitespace differs
	if (expected.trim() === actual.trim()) return 'low';

	// If structure is the same but content differs
	const expected_structure = expected.replace(/[^|#\-\*]/g, '');
	const actual_structure = actual.replace(/[^|#\-\*]/g, '');

	if (expected_structure === actual_structure) return 'medium';

	// Structure differs
	return 'high';
};

/**
 * Generate a human-readable summary of the comparison
 */
const generate_comparison_summary = (
	differences: Array<Semantic_Difference>,
	matches: boolean
): string => {
	if (matches) {
		return differences.length === 0
			? 'Content matches exactly'
			: `Content matches within tolerance (${differences.length} minor differences)`;
	}

	const additions = differences.filter(d => d.type === 'addition').length;
	const removals = differences.filter(d => d.type === 'removal').length;
	const modifications = differences.filter(d => d.type === 'modification').length;
	const reorders = differences.filter(d => d.type === 'reorder').length;

	const parts: Array<string> = [];
	if (additions > 0) parts.push(`${additions} addition${additions > 1 ? 's' : ''}`);
	if (removals > 0) parts.push(`${removals} removal${removals > 1 ? 's' : ''}`);
	if (modifications > 0) parts.push(`${modifications} modification${modifications > 1 ? 's' : ''}`);
	if (reorders > 0) parts.push(`${reorders} reorder${reorders > 1 ? 's' : ''}`);

	return `Content differs: ${parts.join(', ')}`;
};

/**
 * Extract specific data from command output for targeted comparison
 */
export const extract_data_points = (content: string): Record<string, any> => {
	const data: Record<string, any> = {};

	// Extract publishing order
	const order_match = content.match(/Publishing Order[:\s\n]+(.+?)(?=\n##|\n$)/s);
	if (order_match) {
		const order = order_match[1]
			.split('→')
			.map(s => s.trim().replace(/`/g, ''))
			.filter(Boolean);
		data.publishing_order = order;
	}

	// Extract version changes
	const version_changes: Array<{package: string; from: string; to: string}> = [];
	const version_regex = /`([^`]+)`\s*\|\s*([0-9.]+)\s*\|\s*([0-9.]+)/g;
	let version_match;
	while ((version_match = version_regex.exec(content)) !== null) {
		version_changes.push({
			package: version_match[1],
			from: version_match[2],
			to: version_match[3],
		});
	}
	data.version_changes = version_changes;

	// Extract summary numbers
	const summary_match = content.match(/## Summary[\s\S]*?- \*\*([^*]+)\*\*: (\d+)/g);
	if (summary_match) {
		const summary: Record<string, number> = {};
		for (const match of summary_match) {
			const parts = match.match(/\*\*([^*]+)\*\*: (\d+)/);
			if (parts) {
				summary[parts[1].toLowerCase().replace(/\s+/g, '_')] = parseInt(parts[2]);
			}
		}
		data.summary = summary;
	}

	return data;
};

/**
 * Compare extracted data points for structural equivalence
 */
export const compare_data_points = (
	expected_data: Record<string, any>,
	actual_data: Record<string, any>
): {matches: boolean; differences: Array<string>} => {
	const differences: Array<string> = [];

	// Compare publishing order
	if (expected_data.publishing_order && actual_data.publishing_order) {
		const expected_order = expected_data.publishing_order as Array<string>;
		const actual_order = actual_data.publishing_order as Array<string>;

		if (expected_order.length !== actual_order.length) {
			differences.push(`Publishing order length: expected ${expected_order.length}, got ${actual_order.length}`);
		} else {
			for (let i = 0; i < expected_order.length; i++) {
				if (expected_order[i] !== actual_order[i]) {
					differences.push(`Publishing order[${i}]: expected "${expected_order[i]}", got "${actual_order[i]}"`);
				}
			}
		}
	}

	// Compare version changes count
	if (expected_data.version_changes && actual_data.version_changes) {
		const expected_count = expected_data.version_changes.length;
		const actual_count = actual_data.version_changes.length;

		if (expected_count !== actual_count) {
			differences.push(`Version changes count: expected ${expected_count}, got ${actual_count}`);
		}
	}

	// Compare summary numbers
	if (expected_data.summary && actual_data.summary) {
		for (const [key, expected_value] of Object.entries(expected_data.summary)) {
			const actual_value = actual_data.summary[key];
			if (actual_value !== expected_value) {
				differences.push(`Summary ${key}: expected ${expected_value}, got ${actual_value}`);
			}
		}
	}

	return {
		matches: differences.length === 0,
		differences,
	};
};