import { describe, it, expect } from 'vitest';
import { findMatchingTabs, getDuplicateTabIds } from '../src/js/lib/tab-actions.js';

const makeTabs = (entries) =>
	entries.map(([id, url]) => ({ id, url }));

describe('findMatchingTabs', () => {
	const tabs = makeTabs([
		[1, 'https://example.com/page'],
		[2, 'https://other.com/docs'],
		[3, 'https://example.com/page/sub'],
		[4, 'https://test.org/'],
	]);

	it('finds tabs matching a suffix pattern (endsWith, not prefix)', () => {
		// Suffix matching uses url.endsWith(pattern), so /page/sub does NOT match
		const result = findMatchingTabs(tabs, ['example.com/page']);
		expect(result.map(t => t.id)).toEqual([1]);
	});

	it('returns empty for no patterns', () => {
		expect(findMatchingTabs(tabs, [])).toEqual([]);
	});

	it('returns empty for null/undefined safeUrls', () => {
		expect(findMatchingTabs(tabs, null)).toEqual([]);
		expect(findMatchingTabs(tabs, undefined)).toEqual([]);
	});

	it('filters out tabs without ids or urls', () => {
		const badTabs = [
			{ id: 1, url: 'https://example.com/' },
			{ id: undefined, url: 'https://example.com/' },
			{ url: 'https://example.com/' },
			{ id: 2 },
			null,
		];
		const result = findMatchingTabs(badTabs, ['example.com/']);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(1);
	});

	it('matches multiple patterns', () => {
		const result = findMatchingTabs(tabs, ['example.com/page', 'test.org/']);
		expect(result.map(t => t.id)).toEqual([1, 4]);
	});

	it('matches full URL pattern', () => {
		const result = findMatchingTabs(tabs, ['https://other.com/docs']);
		expect(result.map(t => t.id)).toEqual([2]);
	});
});

describe('getDuplicateTabIds', () => {
	it('identifies duplicate URLs (keeps first, marks rest)', () => {
		const tabs = makeTabs([
			[1, 'https://example.com/page'],
			[2, 'https://example.com/page'],
			[3, 'https://other.com/'],
			[4, 'https://example.com/page'],
		]);
		const dupes = getDuplicateTabIds(tabs);
		expect(dupes).toContain(2);
		expect(dupes).toContain(4);
		expect(dupes).not.toContain(1);
		expect(dupes).not.toContain(3);
	});

	it('returns empty when no duplicates exist', () => {
		const tabs = makeTabs([
			[1, 'https://a.com/'],
			[2, 'https://b.com/'],
		]);
		expect(getDuplicateTabIds(tabs)).toEqual([]);
	});

	it('normalizes URLs for comparison (trailing slash)', () => {
		const tabs = makeTabs([
			[1, 'https://example.com/page'],
			[2, 'https://example.com/page/'],
		]);
		const dupes = getDuplicateTabIds(tabs);
		expect(dupes).toContain(2);
	});

	it('handles empty input', () => {
		expect(getDuplicateTabIds([])).toEqual([]);
		expect(getDuplicateTabIds()).toEqual([]);
	});

	it('skips tabs without valid ids or urls', () => {
		const tabs = [
			{ id: 1, url: 'https://example.com/' },
			{ id: undefined, url: 'https://example.com/' },
			null,
			{ id: 2, url: 'https://example.com/' },
		];
		const dupes = getDuplicateTabIds(tabs);
		expect(dupes).toEqual([2]);
	});
});
