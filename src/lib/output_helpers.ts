/**
 * Output formatting utilities for tasks.
 * Provides consistent handling of stdout/json/markdown output and file writing.
 */

import type {Logger} from '@ryanatkn/belt/log.js';
import {writeFile} from 'node:fs/promises';

/**
 * Output format options
 */
export type Output_Format = 'stdout' | 'json' | 'markdown';

/**
 * Options for formatting and outputting data
 */
export interface Output_Options {
	format: Output_Format;
	outfile?: string;
	log?: Logger;
}

/**
 * Formatters for different output formats
 */
export interface Output_Formatters<T> {
	/**
	 * Format data as JSON string
	 */
	json: (data: T) => string;

	/**
	 * Format data as markdown lines
	 */
	markdown: (data: T) => Array<string>;

	/**
	 * Format data to stdout using logger
	 * This function should call log methods directly for colored/styled output
	 */
	stdout: (data: T, log: Logger) => void;
}

/**
 * Formats and outputs data based on the specified format and options.
 *
 * @param data - The data to format and output
 * @param formatters - Format-specific formatter functions
 * @param options - Output options (format, outfile, log)
 * @throws Error if stdout format is used with outfile option
 */
export const format_and_output = async <T>(
	data: T,
	formatters: Output_Formatters<T>,
	options: Output_Options,
): Promise<void> => {
	const {format, outfile, log} = options;

	// Handle stdout format (special case - uses logger directly)
	if (format === 'stdout') {
		if (outfile) {
			throw new Error('--outfile is not supported with stdout format, use json or markdown');
		}
		if (!log) {
			throw new Error('Logger is required for stdout format');
		}
		formatters.stdout(data, log);
		return;
	}

	// Format data
	const content = format === 'json' ? formatters.json(data) : formatters.markdown(data).join('\n');

	// Output to file or log
	if (outfile) {
		await writeFile(outfile, content);
		log?.info(`Output written to ${outfile}`);
	} else {
		// Log line by line for better formatting
		const lines = content.split('\n');
		for (const line of lines) {
			log?.info(line);
		}
	}
};
