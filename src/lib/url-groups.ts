import { parseUrlParts } from '../js/lib/url-utils.js';

export type UrlItem = {
  url: string;
  isOpen?: boolean;
  matchingTabs?: chrome.tabs.Tab[];
};

export type UrlGroup = {
  domain: string;
  sampleUrl: string;
  items: UrlItem[];
};

export function labelForUrl(url: string, { includeDomain = false } = {}) {
  const { hostname, displayPath } = parseUrlParts(url);
  if (!includeDomain) {
    return displayPath;
  }
  if (hostname === 'This computer') {
    return displayPath;
  }
  if (!displayPath || displayPath === '/') {
    return hostname;
  }
  return `${hostname}${displayPath}`;
}

export function groupByDomain(items: UrlItem[]): UrlGroup[] {
  const map = new Map<string, UrlGroup>();
  items.forEach((item) => {
    const { hostname } = parseUrlParts(item.url);
    const key = String(hostname || item.url || '').toLowerCase();
    if (!map.has(key)) {
      map.set(key, { domain: hostname || item.url, items: [], sampleUrl: item.url });
    }
    map.get(key)?.items.push(item);
  });
  return Array.from(map.values()).sort((a, b) => String(a.domain).localeCompare(String(b.domain)));
}

export function openUrlInNewTab(url: string) {
  let target = String(url || '');
  if (!/^https?:\/\//i.test(target) && !target.startsWith('file:') && !target.startsWith('/')) {
    target = `https://${target}`;
  } else if (target.startsWith('/')) {
    target = `file://${target}`;
  }
  return chrome.tabs.create({ url: target });
}
