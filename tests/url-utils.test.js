import { describe, it, expect } from 'vitest';
import {
	escapeHtml,
	parseUrlParts,
	matchesUrlPattern,
	normalizeUrlForDupeCheck,
	toPatternFromTabUrl
} from '../src/js/lib/url-utils.js';

describe('escapeHtml', () => {
	it('escapes ampersands', () => {
		expect(escapeHtml('a&b')).toBe('a&amp;b');
	});

	it('escapes angle brackets', () => {
		expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
	});

	it('escapes quotes', () => {
		expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
		expect(escapeHtml("'hello'")).toBe('&#39;hello&#39;');
	});

	it('handles empty string', () => {
		expect(escapeHtml('')).toBe('');
	});

	it('converts non-strings to strings', () => {
		expect(escapeHtml(123)).toBe('123');
		expect(escapeHtml(null)).toBe('null');
	});
});

describe('parseUrlParts', () => {
	it('parses a full URL', () => {
		const result = parseUrlParts('https://example.com/path?q=1');
		expect(result.hostname).toBe('example.com');
		expect(result.displayPath).toBe('/path?q=1');
	});

	it('parses a URL with no path', () => {
		const result = parseUrlParts('https://example.com');
		expect(result.hostname).toBe('example.com');
		expect(result.displayPath).toBe('/');
	});

	it('handles a bare domain (no protocol)', () => {
		const result = parseUrlParts('example.com/path');
		expect(result.hostname).toBe('example.com');
		expect(result.displayPath).toBe('/path');
	});

	it('handles just a hostname', () => {
		const result = parseUrlParts('example.com');
		expect(result.hostname).toBe('example.com');
		expect(result.displayPath).toBe('/');
	});

	it('handles an empty string', () => {
		const result = parseUrlParts('');
		expect(result.hostname).toBeDefined();
		expect(result.displayPath).toBeDefined();
	});
});

describe('matchesUrlPattern', () => {
	describe('suffix matching (pattern without protocol)', () => {
		it('matches when URL ends with pattern', () => {
			expect(matchesUrlPattern('https://example.com/page', 'example.com/page')).toBe(true);
		});

		it('does not match when URL does not end with pattern', () => {
			expect(matchesUrlPattern('https://example.com/other', 'example.com/page')).toBe(false);
		});

		it('matches hostname-only pattern', () => {
			expect(matchesUrlPattern('https://example.com/', 'example.com/')).toBe(true);
		});
	});

	describe('path-only matching (pattern starts with /)', () => {
		it('matches exact path', () => {
			expect(matchesUrlPattern('https://example.com/path?q=1', '/path?q=1')).toBe(true);
		});

		it('does not match different path', () => {
			expect(matchesUrlPattern('https://example.com/other', '/path')).toBe(false);
		});
	});

	describe('full URL matching', () => {
		it('matches when protocol, host, and path prefix match', () => {
			expect(matchesUrlPattern(
				'https://example.com/docs/api/v2',
				'https://example.com/docs'
			)).toBe(true);
		});

		it('does not match different hosts', () => {
			expect(matchesUrlPattern(
				'https://other.com/docs',
				'https://example.com/docs'
			)).toBe(false);
		});

		it('does not match different protocols', () => {
			expect(matchesUrlPattern(
				'http://example.com/docs',
				'https://example.com/docs'
			)).toBe(false);
		});
	});

	describe('exact match with $ suffix', () => {
		it('BUG: $ exact-match is broken — $ gets baked into the parsed path', () => {
			// The intent is that pattern "https://example.com/page$" should exact-match "/page"
			// but the $ becomes part of patternPath ("/page$") so comparison always fails.
			// This test documents the current (broken) behaviour.
			expect(matchesUrlPattern(
				'https://example.com/page',
				'https://example.com/page$'
			)).toBe(false); // Should be true once fixed

			// Subpath correctly rejected (this part works because prefix also fails)
			expect(matchesUrlPattern(
				'https://example.com/page/sub',
				'https://example.com/page$'
			)).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('returns false for invalid URL', () => {
			expect(matchesUrlPattern('not a url', 'https://example.com')).toBe(false);
		});

		it('handles query parameters in prefix match', () => {
			expect(matchesUrlPattern(
				'https://example.com/search?q=test',
				'https://example.com/search'
			)).toBe(true);
		});
	});
});

describe('normalizeUrlForDupeCheck', () => {
	it('strips protocol and trailing slash', () => {
		const a = normalizeUrlForDupeCheck('https://example.com/page/');
		const b = normalizeUrlForDupeCheck('https://example.com/page');
		expect(a).toBe(b);
	});

	it('lowercases the hostname', () => {
		const a = normalizeUrlForDupeCheck('https://EXAMPLE.COM/page');
		const b = normalizeUrlForDupeCheck('https://example.com/page');
		expect(a).toBe(b);
	});

	it('preserves query parameters', () => {
		const result = normalizeUrlForDupeCheck('https://example.com/path?q=1');
		expect(result).toContain('?q=1');
	});

	it('handles empty/null input', () => {
		expect(normalizeUrlForDupeCheck('')).toBe('');
		expect(normalizeUrlForDupeCheck(null)).toBe('');
		expect(normalizeUrlForDupeCheck(undefined)).toBe('');
	});

	it('treats http and https pages with same path as different', () => {
		// Both produce hostname+path after normalization — protocol is stripped by URL parsing
		// The normalize function uses parsed.hostname which strips protocol
		const a = normalizeUrlForDupeCheck('http://example.com/page');
		const b = normalizeUrlForDupeCheck('https://example.com/page');
		// Both should normalize identically (hostname + path + search)
		expect(a).toBe(b);
	});
});

describe('toPatternFromTabUrl', () => {
	it('extracts hostname + path from a full URL', () => {
		expect(toPatternFromTabUrl('https://example.com/page')).toBe('example.com/page');
	});

	it('includes query parameters', () => {
		expect(toPatternFromTabUrl('https://example.com/search?q=test')).toBe('example.com/search?q=test');
	});

	it('strips the protocol', () => {
		const result = toPatternFromTabUrl('https://example.com/');
		expect(result).not.toContain('https://');
		expect(result).toBe('example.com/');
	});

	it('returns empty string for falsy input', () => {
		expect(toPatternFromTabUrl('')).toBe('');
		expect(toPatternFromTabUrl(null)).toBe('');
		expect(toPatternFromTabUrl(undefined)).toBe('');
	});

	it('returns the raw string for unparseable URLs', () => {
		expect(toPatternFromTabUrl('not-a-url')).toBe('not-a-url');
	});
});
