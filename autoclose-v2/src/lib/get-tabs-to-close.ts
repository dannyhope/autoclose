import { getSafeUrls } from "~/hooks/use-safe-urls"
import { getSetting, STORAGE_KEYS } from "~/hooks/use-ui-settings"
import { findMatchingTabs, getDuplicateTabIds, type ChromeTab } from "~/lib/tab-actions"
import { findBookmarkedTabs, findBlankTabs, getAllBookmarks } from "~/lib/bookmark-utils"

/**
 * Shared logic for determining which tabs should be closed
 * Used by both badge count and close tabs functionality
 */
export async function getTabIdsToClose(): Promise<Set<number>> {
  const [safeUrls, tabs] = await Promise.all([
    getSafeUrls(),
    chrome.tabs.query({})
  ])

  const alwaysCloseDupes = await getSetting(STORAGE_KEYS.ALWAYS_CLOSE_DUPES, true)
  const alwaysCloseBookmarked = await getSetting(STORAGE_KEYS.ALWAYS_CLOSE_BOOKMARKED, true)
  const looseMatching = await getSetting(STORAGE_KEYS.LOOSE_MATCHING, true)
  const closeWhitelistItems = await getSetting(STORAGE_KEYS.CLOSE_WHITELIST_ITEMS, true)

  // Find tabs matching whitelist (only if closeWhitelistItems is enabled)
  const matchingTabs = closeWhitelistItems
    ? findMatchingTabs(tabs as ChromeTab[], safeUrls, looseMatching)
    : []
  const tabIds = new Set<number>(
    matchingTabs
      .map(tab => tab.id)
      .filter((id): id is number => typeof id === "number")
  )

  if (alwaysCloseDupes) {
    getDuplicateTabIds(tabs as ChromeTab[]).forEach(id => tabIds.add(id))
  }

  if (alwaysCloseBookmarked) {
    try {
      const bookmarks = await getAllBookmarks()
      const bookmarkUrls = bookmarks.map(b => b.normalizedUrl)
      const bookmarkedTabs = findBookmarkedTabs(tabs as ChromeTab[], bookmarkUrls)
      const blankTabs = findBlankTabs(tabs as ChromeTab[])
      
      ;[...bookmarkedTabs, ...blankTabs].forEach(tab => {
        if (typeof tab.id === "number") tabIds.add(tab.id)
      })
    } catch {
      console.warn("Could not access bookmarks")
    }
  }

  return tabIds
}
