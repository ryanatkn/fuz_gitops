/**
 * Markdown formatting utilities
 */

/**
 * Formats a markdown table from headers and rows.
 */
export const format_markdown_table = (
	headers: Array<string>,
	rows: Array<Array<string>>,
): Array<string> => {
	const lines: Array<string> = [];

	// Add headers
	lines.push(`| ${headers.join(' | ')} |`);

	// Add separator
	lines.push(`|${headers.map(() => '---').join('|')}|`);

	// Add rows
	for (const row of rows) {
		lines.push(`| ${row.join(' | ')} |`);
	}

	return lines;
};

/**
 * Formats a list with optional bullets.
 */
export const format_markdown_list = (items: Array<string>, ordered = false): Array<string> => {
	return items.map((item, i) => (ordered ? `${i + 1}. ${item}` : `- ${item}`));
};

/**
 * Formats a section with title and content.
 */
export const format_markdown_section = (
	title: string,
	content: Array<string>,
	level = 2,
): Array<string> => {
	const heading = '#'.repeat(level) + ' ' + title;
	return [heading, '', ...content, ''];
};

/**
 * Formats key-value pairs as a definition list.
 */
export const format_markdown_definitions = (pairs: Array<[string, string]>): Array<string> => {
	const lines: Array<string> = [];
	for (const [key, value] of pairs) {
		lines.push(`- **${key}**: ${value}`);
	}
	return lines;
};

/**
 * Escapes special markdown characters.
 */
export const escape_markdown = (text: string): string => {
	return text
		.replace(/\*/g, '\\*')
		.replace(/_/g, '\\_')
		.replace(/\[/g, '\\[')
		.replace(/\]/g, '\\]')
		.replace(/\(/g, '\\(')
		.replace(/\)/g, '\\)')
		.replace(/~/g, '\\~')
		.replace(/`/g, '\\`')
		.replace(/>/g, '\\>')
		.replace(/#/g, '\\#')
		.replace(/\+/g, '\\+')
		.replace(/-/g, '\\-')
		.replace(/\./g, '\\.')
		.replace(/!/g, '\\!');
};
