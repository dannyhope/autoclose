import { matchesUrlPattern, normalizeUrlForDupeCheck } from "./url-utils"

export interface ChromeTab {
  id?: number
  url?: string
  title?: string
  pendingUrl?: string
}

/**
 * Finds tabs that match any of the given safe URL patterns
 */
export function findMatchingTabs(
  tabs: ChromeTab[] = [],
  safeUrls: string[] = []
): ChromeTab[] {
  if (!Array.isArray(safeUrls) || safeUrls.length === 0) {
    return []
  }

  return tabs.filter((tab) => {
    if (!tab || typeof tab.id !== "number" || !tab.url) {
      return false
    }
    return safeUrls.some((pattern) =>
      matchesUrlPattern(tab.url!, String(pattern || ""))
    )
  })
}

/**
 * Gets tab IDs that are duplicates (same normalized URL seen before)
 * The first occurrence is kept, subsequent ones are considered duplicates
 */
export function getDuplicateTabIds(tabs: ChromeTab[] = []): number[] {
  const seen = new Set<string>()
  const duplicates: number[] = []

  for (const tab of tabs) {
    if (!tab || typeof tab.id !== "number" || !tab.url) {
      continue
    }
    const key = normalizeUrlForDupeCheck(tab.url)
    if (!key) {
      continue
    }
    if (seen.has(key)) {
      duplicates.push(tab.id)
      continue
    }
    seen.add(key)
  }

  return duplicates
}
