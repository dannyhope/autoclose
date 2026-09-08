import { matchesUrlPattern, normalizeUrlForDupeCheck } from './url-utils';
import type browser from 'webextension-polyfill';

export function findMatchingTabs(tabs: browser.Tabs.Tab[] = [], safeUrls: string[] = []): browser.Tabs.Tab[] {
  if (!Array.isArray(safeUrls) || safeUrls.length === 0) {
    return [];
  }

  return tabs.filter((tab) => {
    if (!tab || typeof tab.id !== 'number' || !tab.url) {
      return false;
    }
    return safeUrls.some((pattern) => matchesUrlPattern(tab.url!, String(pattern || '')));
  });
}

export function getDuplicateTabIds(tabs: browser.Tabs.Tab[] = []): number[] {
  const seen = new Set<string>();
  const duplicates: number[] = [];

  for (const tab of tabs) {
    if (!tab || typeof tab.id !== 'number' || !tab.url) {
      continue;
    }
    const key = normalizeUrlForDupeCheck(tab.url);
    if (!key) {
      continue;
    }
    if (seen.has(key)) {
      duplicates.push(tab.id);
      continue;
    }
    seen.add(key);
  }

  return duplicates;
}
