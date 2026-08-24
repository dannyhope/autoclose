import { describe, it, expect } from 'vitest';
import { normalizeBookmarkUrl, findBookmarkedTabs, findBlankTabs } from '../src/js/lib/bookmark-utils.js';

describe('normalizeBookmarkUrl', () => {
	describe('standard URLs', () => {
		it('strips tracking parameters', () => {
			const result = normalizeBookmarkUrl('https://example.com/page?utm_source=twitter&id=123');
			expect(result).not.toContain('utm_source');
			expect(result).toContain('id=123');
		});

		it('strips www subdomain', () => {
			const result = normalizeBookmarkUrl('https://www.example.com/page');
			expect(result).not.toContain('www.');
		});

		it('strips mobile subdomain', () => {
			const result = normalizeBookmarkUrl('https://m.example.com/page');
			expect(result).not.toContain('m.');
		});
	});

	describe('Google Docs', () => {
		it('returns only the pathname', () => {
			const result = normalizeBookmarkUrl('https://docs.google.com/document/d/1abc123/edit?tab=t.0');
			expect(result).toBe('/document/d/1abc123/edit');
		});
	});

	describe('Amazon', () => {
		it('extracts product ASIN from /dp/ URL', () => {
			const result = normalizeBookmarkUrl('https://www.amazon.co.uk/dp/B087CX6XFQ?ref=something');
			expect(result).toBe('B087CX6XFQ');
		});

		it('extracts product ASIN from /gp/product/ URL', () => {
			const result = normalizeBookmarkUrl('https://www.amazon.com/gp/product/B087CX6XFQ/ref=abc');
			expect(result).toBe('B087CX6XFQ');
		});
	});

	describe('eBay', () => {
		it('extracts item ID', () => {
			const result = normalizeBookmarkUrl('https://www.ebay.co.uk/itm/123456789?hash=item123');
			expect(result).toBe('123456789');
		});

		it('normalizes watchlist URL', () => {
			const result = normalizeBookmarkUrl('https://www.ebay.co.uk/myebay/watchlist');
			expect(result).toContain('ebay-watchlist');
		});
	});

	describe('Notion', () => {
		it('extracts 32-char hex ID', () => {
			const result = normalizeBookmarkUrl('https://www.notion.so/My-Page-abcdef1234567890abcdef1234567890');
			expect(result).toBe('abcdef1234567890abcdef1234567890');
		});
	});

	describe('edge cases', () => {
		it('handles invalid URL gracefully', () => {
			const result = normalizeBookmarkUrl('not a url');
			expect(result).toBe('not a url');
		});

		it('strips multiple tracking params at once', () => {
			const result = normalizeBookmarkUrl('https://example.com/page?fbclid=abc&gclid=def&real=yes');
			expect(result).not.toContain('fbclid');
			expect(result).not.toContain('gclid');
			expect(result).toContain('real=yes');
		});
	});
});

describe('findBookmarkedTabs', () => {
	it('finds tabs whose normalized URLs match bookmarks', () => {
		const tabs = [
			{ id: 1, url: 'https://www.example.com/page?utm_source=twitter' },
			{ id: 2, url: 'https://other.com/' },
		];
		// Pre-normalize both bookmark and tab URLs to match
		const bookmarkUrls = [normalizeBookmarkUrl('https://www.example.com/page')];
		const result = findBookmarkedTabs(tabs, bookmarkUrls);
		expect(result.map(t => t.id)).toContain(1);
	});

	it('returns empty when no matches', () => {
		const tabs = [{ id: 1, url: 'https://unmatched.com/' }];
		const bookmarkUrls = [normalizeBookmarkUrl('https://other.com/')];
		const result = findBookmarkedTabs(tabs, bookmarkUrls);
		expect(result).toEqual([]);
	});

	it('skips tabs without URLs', () => {
		const tabs = [{ id: 1 }, { id: 2, url: '' }];
		const result = findBookmarkedTabs(tabs, ['anything']);
		expect(result).toEqual([]);
	});
});

describe('findBlankTabs', () => {
	it('finds about:blank tabs', () => {
		const tabs = [
			{ id: 1, url: 'about:blank' },
			{ id: 2, url: 'https://example.com' },
		];
		const result = findBlankTabs(tabs);
		expect(result.map(t => t.id)).toEqual([1]);
	});

	it('finds chrome://newtab/ tabs', () => {
		const tabs = [
			{ id: 1, url: 'chrome://newtab/' },
			{ id: 2, url: 'https://example.com' },
		];
		const result = findBlankTabs(tabs);
		expect(result.map(t => t.id)).toEqual([1]);
	});

	it('finds tabs with pending blank URLs', () => {
		const tabs = [
			{ id: 1, url: 'https://example.com', pendingUrl: 'about:blank' },
			{ id: 2, url: 'https://example.com' },
		];
		const result = findBlankTabs(tabs);
		expect(result.map(t => t.id)).toEqual([1]);
	});

	it('returns empty when no blank tabs', () => {
		const tabs = [
			{ id: 1, url: 'https://example.com' },
		];
		expect(findBlankTabs(tabs)).toEqual([]);
	});
});
