/**
 * Common output formatting utilities
 */

export interface Format_Options {
	format: 'json' | 'markdown' | 'stdout';
	colorize?: boolean;
}

/**
 * Formats data based on the specified format option.
 */
export const format_output = (data: any, options: Format_Options): string => {
	switch (options.format) {
		case 'json':
			return format_as_json(data);
		case 'markdown':
			return format_as_markdown(data);
		default:
			return format_as_stdout(data, options.colorize);
	}
};

/**
 * Formats data as JSON string.
 */
export const format_as_json = (data: any): string => {
	return JSON.stringify(data, null, 2);
};

/**
 * Basic markdown formatting.
 * More specific formatting should be in format_markdown.ts
 */
export const format_as_markdown = (data: any): string => {
	// This is a basic implementation - use format_markdown.ts for tables
	if (typeof data === 'string') return data;
	if (Array.isArray(data)) return data.join('\n');
	return JSON.stringify(data, null, 2);
};

/**
 * Formats for stdout with optional colors.
 */
export const format_as_stdout = (data: any, _colorize = true): string => {
	// Basic stdout formatting
	// TODO: implement colorization when needed
	if (typeof data === 'string') return data;
	if (Array.isArray(data)) return data.join('\n');
	return JSON.stringify(data, null, 2);
};