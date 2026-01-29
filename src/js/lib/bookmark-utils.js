// Marketing and analytics parameters that should be ignored
const IGNORED_PARAMS = new Set([
  // Google Analytics & UTM
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',

  // Microsoft/Bing
  'msclkid',

  // Facebook
  'fbclid', 'fb_action_ids', 'fb_action_types', 'fb_source', 'fb_ref',

  // Other Social Media
  'igshid', 'twclid', 'pinid',

  // Email Marketing
  'mc_cid', 'mc_eid', 'yclid', '_hsenc', '_hsmi',

  // General Marketing/Analytics
  'gclid', 'dclid', 'gbraid', 'wbraid', '_ga', '_gl', 'ref', 'source',
  'affiliate_id', 'campaign_id',

  // Session/User Tracking
  'sid', 'uid', 'visitor_id', 'session_id',

  // E-commerce
  'cjevent', 'zanpid', 'affid', 'aff', 'clickid'
]);

// Common URL parts to normalize
const URL_PATTERNS = {
  // Common language/locale path segments
  localePaths: new Set([
    'en', 'en-gb', 'en-us', 'de', 'fr', 'es', 'it',
    'en-GB', 'en-US', 'de-DE', 'fr-FR', 'es-ES', 'it-IT'
  ]),

  // Common subdomains to ignore
  ignoredSubdomains: new Set([
    'www', 'm', 'mobile', 'shop'
  ])
};

/**
 * Strips common variable parts from a URL while preserving unique identifiers
 */
function stripCommonUrlParts(url) {
  // Remove common subdomains
  const hostParts = url.hostname.split('.');
  const cleanHost = hostParts
    .filter(part => !URL_PATTERNS.ignoredSubdomains.has(part))
    .join('.');

  // Split path into segments
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Remove locale segments
  const cleanPath = pathParts
    .filter(part => !URL_PATTERNS.localePaths.has(part))
    .join('/');

  return `${cleanHost}${cleanPath ? '/' + cleanPath : ''}`;
}

/**
 * Normalizes URLs by removing tracking parameters and handling special cases
 * for different platforms (Google Docs, Amazon, etc.)
 */
export function normalizeBookmarkUrl(urlString) {
  try {
    const url = new URL(urlString);

    // Special handling for Google Docs URLs
    if (url.hostname.includes('docs.google.com')) {
      return url.pathname;
    }

    // Special handling for calculatorstudio.co and grid.is URLs
    if (url.hostname.includes('calculatorstudio.co') || url.hostname.includes('grid.is')) {
      return url.pathname;
    }

    // Special handling for Amazon URLs
    if (url.hostname.includes('amazon.')) {
      // Extract just the product path (e.g., /dp/B087CX6XFQ)
      const productMatch = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]+)/);
      if (productMatch) {
        return productMatch[1];
      }
    }

    // Special handling for eBay URLs
    if (url.hostname.includes('ebay.')) {
      // Handle eBay item pages
      const itemMatch = url.pathname.match(/\/itm\/(\d+)/);
      if (itemMatch) {
        return itemMatch[1];
      }

      // Handle eBay watchlist URLs
      if (url.pathname.toLowerCase().includes('watchlist') ||
          url.pathname.toLowerCase().includes('myebay')) {
        const searchParams = new URLSearchParams(url.search);
        const currentPage = searchParams.get('CurrentPage');
        return `ebay-watchlist${currentPage ? `-${currentPage}` : ''}`;
      }
    }

    // Special handling for Notion URLs
    if (url.hostname.includes('notion.so')) {
      // Extract the 32-character ID from the end of the URL
      const notionIdMatch = url.pathname.match(/[a-f0-9]{32}$/i);
      if (notionIdMatch) {
        return notionIdMatch[0];
      }
    }

    // For other URLs, keep query params that aren't in the ignored list
    const searchParams = new URLSearchParams(url.search);
    const filteredParams = new URLSearchParams();

    for (const [key, value] of searchParams) {
      if (!IGNORED_PARAMS.has(key.toLowerCase())) {
        filteredParams.append(key, value);
      }
    }

    const queryString = filteredParams.toString();
    const normalizedUrl = stripCommonUrlParts(url) +
                         (queryString ? '?' + queryString : '');

    return normalizedUrl;
  } catch (error) {
    console.warn(`Failed to parse URL: ${urlString}`, error);
    return urlString;
  }
}

/**
 * Recursively retrieves all bookmarks from the Chrome bookmarks tree
 * @returns {Promise<Array<{title: string, url: string, normalizedUrl: string}>>}
 */
export async function getAllBookmarks() {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      const collectedBookmarks = [];

      function traverseBookmarkTree(nodes) {
        for (const node of nodes) {
          if (node.url) {
            collectedBookmarks.push({
              title: node.title,
              url: node.url,
              normalizedUrl: normalizeBookmarkUrl(node.url)
            });
          }
          if (node.children) {
            traverseBookmarkTree(node.children);
          }
        }
      }

      traverseBookmarkTree(bookmarkTreeNodes);
      resolve(collectedBookmarks);
    });
  });
}

/**
 * Finds tabs that match bookmarked URLs (after normalization)
 * @param {Array} tabs - Array of Chrome tab objects
 * @param {Array<string>} normalizedBookmarkUrls - Array of normalized bookmark URLs
 * @returns {Array} Array of tabs that match bookmarks
 */
export function findBookmarkedTabs(tabs, normalizedBookmarkUrls) {
  return tabs.filter(tab => {
    if (!tab.url) return false;
    const normalizedTabUrl = normalizeBookmarkUrl(tab.url);
    return normalizedBookmarkUrls.includes(normalizedTabUrl);
  });
}

/**
 * Finds blank tabs (about:blank and chrome://newtab)
 * @param {Array} tabs - Array of Chrome tab objects
 * @returns {Array} Array of blank tabs
 */
export function findBlankTabs(tabs) {
  return tabs.filter(tab => {
    const isBlankTab = tab.url === 'about:blank'
      || tab.url === 'chrome://newtab/'
      || tab.pendingUrl === 'about:blank'
      || tab.pendingUrl === 'chrome://newtab/';
    return isBlankTab;
  });
}
