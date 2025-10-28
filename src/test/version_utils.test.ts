import {describe, it, expect} from 'vitest';

import {
	is_wildcard,
	strip_version_prefix,
	get_version_prefix,
	normalize_version_for_comparison,
	needs_update,
	get_update_prefix,
	is_breaking_change,
	detect_bump_type,
} from '$lib/version_utils.js';

describe('version_utils', () => {
	describe('is_wildcard', () => {
		it('detects wildcard versions', () => {
			expect(is_wildcard('*')).toBe(true);
			expect(is_wildcard('^1.0.0')).toBe(false);
			expect(is_wildcard('1.0.0')).toBe(false);
		});
	});

	describe('strip_version_prefix', () => {
		it('removes caret prefix', () => {
			expect(strip_version_prefix('^1.2.3')).toBe('1.2.3');
		});

		it('removes tilde prefix', () => {
			expect(strip_version_prefix('~1.2.3')).toBe('1.2.3');
		});

		it('removes comparison prefixes', () => {
			expect(strip_version_prefix('>1.2.3')).toBe('1.2.3');
			expect(strip_version_prefix('>=1.2.3')).toBe('=1.2.3'); // only removes first char
		});

		it('leaves exact versions unchanged', () => {
			expect(strip_version_prefix('1.2.3')).toBe('1.2.3');
		});
	});

	describe('get_version_prefix', () => {
		it('extracts caret prefix', () => {
			expect(get_version_prefix('^1.2.3')).toBe('^');
		});

		it('extracts tilde prefix', () => {
			expect(get_version_prefix('~1.2.3')).toBe('~');
		});

		it('extracts comparison prefixes', () => {
			expect(get_version_prefix('>1.2.3')).toBe('>');
			expect(get_version_prefix('>=1.2.3')).toBe('>'); // only first char
		});

		it('returns empty string for exact versions', () => {
			expect(get_version_prefix('1.2.3')).toBe('');
		});
	});

	describe('normalize_version_for_comparison', () => {
		it('preserves wildcards', () => {
			expect(normalize_version_for_comparison('*')).toBe('*');
		});

		it('handles >= ranges', () => {
			expect(normalize_version_for_comparison('>=1.2.3')).toBe('1.2.3');
		});

		it('strips other prefixes', () => {
			expect(normalize_version_for_comparison('^1.2.3')).toBe('1.2.3');
			expect(normalize_version_for_comparison('~1.2.3')).toBe('1.2.3');
		});

		it('leaves exact versions unchanged', () => {
			expect(normalize_version_for_comparison('1.2.3')).toBe('1.2.3');
		});
	});

	describe('needs_update', () => {
		it('always updates wildcards', () => {
			expect(needs_update('*', '1.0.0')).toBe(true);
			expect(needs_update('*', '2.0.0')).toBe(true);
		});

		it('updates when normalized versions differ', () => {
			expect(needs_update('^1.0.0', '1.1.0')).toBe(true);
			expect(needs_update('~1.0.0', '1.0.1')).toBe(true);
		});

		it('does not update when normalized versions are same', () => {
			expect(needs_update('^1.0.0', '1.0.0')).toBe(false);
			expect(needs_update('~1.2.3', '1.2.3')).toBe(false);
		});

		it('handles different prefixes with same version', () => {
			expect(needs_update('^1.0.0', '~1.0.0')).toBe(false); // normalized to same
		});
	});

	describe('get_update_prefix', () => {
		it('uses caret for wildcard replacements', () => {
			expect(get_update_prefix('*', '^')).toBe('^');
			expect(get_update_prefix('*', '~')).toBe('^'); // always caret for wildcards
		});

		it('preserves existing prefix', () => {
			expect(get_update_prefix('^1.0.0')).toBe('^');
			expect(get_update_prefix('~1.0.0')).toBe('~');
		});

		it('uses default strategy when no prefix', () => {
			expect(get_update_prefix('1.0.0')).toBe('^'); // default is caret
			expect(get_update_prefix('1.0.0', '~')).toBe('~');
			expect(get_update_prefix('1.0.0', '')).toBe('');
		});
	});

	describe('is_breaking_change', () => {
		describe('pre-1.0 versions (0.x.x)', () => {
			it('treats minor bumps as breaking', () => {
				expect(is_breaking_change('0.1.0', 'minor')).toBe(true);
				expect(is_breaking_change('0.5.10', 'minor')).toBe(true);
			});

			it('treats major bumps as breaking', () => {
				expect(is_breaking_change('0.1.0', 'major')).toBe(true);
				expect(is_breaking_change('0.5.10', 'major')).toBe(true);
			});

			it('does not treat patch bumps as breaking', () => {
				expect(is_breaking_change('0.1.0', 'patch')).toBe(false);
				expect(is_breaking_change('0.5.10', 'patch')).toBe(false);
			});
		});

		describe('1.0+ versions', () => {
			it('treats only major bumps as breaking', () => {
				expect(is_breaking_change('1.0.0', 'major')).toBe(true);
				expect(is_breaking_change('2.5.10', 'major')).toBe(true);
			});

			it('does not treat minor bumps as breaking', () => {
				expect(is_breaking_change('1.0.0', 'minor')).toBe(false);
				expect(is_breaking_change('2.5.10', 'minor')).toBe(false);
			});

			it('does not treat patch bumps as breaking', () => {
				expect(is_breaking_change('1.0.0', 'patch')).toBe(false);
				expect(is_breaking_change('2.5.10', 'patch')).toBe(false);
			});
		});
	});

	describe('detect_bump_type', () => {
		it('detects major bumps', () => {
			expect(detect_bump_type('1.2.3', '2.0.0')).toBe('major');
			expect(detect_bump_type('0.5.0', '1.0.0')).toBe('major');
		});

		it('detects minor bumps', () => {
			expect(detect_bump_type('1.2.3', '1.3.0')).toBe('minor');
			expect(detect_bump_type('0.5.0', '0.6.0')).toBe('minor');
		});

		it('detects patch bumps', () => {
			expect(detect_bump_type('1.2.3', '1.2.4')).toBe('patch');
			expect(detect_bump_type('0.5.0', '0.5.1')).toBe('patch');
		});

		it('handles complex version changes', () => {
			// Major takes precedence even with other changes
			expect(detect_bump_type('1.2.3', '2.5.10')).toBe('major');
			// Minor takes precedence over patch
			expect(detect_bump_type('1.2.3', '1.5.0')).toBe('minor');
		});
	});
});
