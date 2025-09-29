/**
 * Helper utilities for working with Result types from @ryanatkn/belt
 */

import type {Result} from '@ryanatkn/belt/result.js';
import {OK, NOT_OK} from '@ryanatkn/belt/result.js';

/**
 * Creates a successful result with a value.
 */
export const ok = <T>(value: T): Result<{value: T}, never> => ({...OK, value});

/**
 * Creates a failed result with an error.
 */
export const err = <E extends {message?: string}>(error: E): Result<never, E> => ({...NOT_OK, ...error});

/**
 * Maps a successful result value.
 */
export const map_result = <T extends {value?: unknown}, U, E extends object>(
	result: Result<T, E>,
	fn: (value: T['value']) => U,
): Result<{value: U}, E> => {
	if (result.ok && 'value' in result) {
		return ok(fn(result.value));
	}
	return result as Result<{value: U}, E>;
};

/**
 * Maps a failed result error.
 */
export const map_error = <T extends object, E extends object, F extends {message?: string}>(
	result: Result<T, E>,
	fn: (error: E) => F,
): Result<T, F> => {
	if (!result.ok) {
		return err(fn(result));
	}
	return result as Result<T, F>;
};

/**
 * Collects multiple results into values and errors.
 */
export const collect_results = <T extends {value?: unknown}, E extends object>(
	results: Array<Result<T, E>>,
): {values: Array<T['value']>; errors: Array<E>} => {
	const values: Array<T['value']> = [];
	const errors: Array<E> = [];

	for (const result of results) {
		if (result.ok && 'value' in result) {
			values.push(result.value);
		} else if (!result.ok) {
			errors.push(result);
		}
	}

	return {values, errors};
};

/**
 * Converts a promise to a Result type.
 */
export const try_async = async <T>(
	fn: () => Promise<T>,
): Promise<Result<{value: T}, {message: string}>> => {
	try {
		const value = await fn();
		return ok(value);
	} catch (error) {
		return err({message: error instanceof Error ? error.message : String(error)});
	}
};

/**
 * Converts a synchronous function to a Result type.
 */
export const try_sync = <T>(
	fn: () => T,
): Result<{value: T}, {message: string}> => {
	try {
		const value = fn();
		return ok(value);
	} catch (error) {
		return err({message: error instanceof Error ? error.message : String(error)});
	}
};

/**
 * Unwraps a result with a default value for errors.
 * Note: The unwrap function is already provided by @ryanatkn/belt/result.js
 */
export const unwrap_or = <T extends {value?: unknown}, E extends object>(
	result: Result<T, E>,
	default_value: T['value'],
): T['value'] => {
	if (result.ok && 'value' in result) {
		return result.value;
	}
	return default_value;
};