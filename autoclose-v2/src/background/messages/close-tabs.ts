import type { PlasmoMessaging } from "@plasmohq/messaging"
import { getSafeUrls } from "~/hooks/use-safe-urls"
import { getSetting, STORAGE_KEYS } from "~/hooks/use-ui-settings"
import { findMatchingTabs, getDuplicateTabIds, type ChromeTab } from "~/lib/tab-actions"
import { findBookmarkedTabs, findBlankTabs, getAllBookmarks } from "~/lib/bookmark-utils"

export interface CloseTabsRequest {}

export interface CloseTabsResponse {
  count: number
}

const handler: PlasmoMessaging.MessageHandler<CloseTabsRequest, CloseTabsResponse> = async (req, res) => {
  try {
    const [safeUrls, tabs] = await Promise.all([
      getSafeUrls(),
      chrome.tabs.query({})
    ])

    const alwaysCloseDupes = await getSetting(STORAGE_KEYS.ALWAYS_CLOSE_DUPES, false)
    const alwaysCloseBookmarked = await getSetting(STORAGE_KEYS.ALWAYS_CLOSE_BOOKMARKED, false)

    // Find tabs matching safe URLs
    const matchingTabs = findMatchingTabs(tabs as ChromeTab[], safeUrls)
    const tabIdsToClose = new Set<number>(
      matchingTabs
        .map(tab => tab.id)
        .filter((id): id is number => typeof id === "number")
    )

    // Add duplicates if enabled
    if (alwaysCloseDupes) {
      const duplicateIds = getDuplicateTabIds(tabs as ChromeTab[])
      duplicateIds.forEach(id => tabIdsToClose.add(id))
    }

    // Add bookmarked tabs if enabled
    if (alwaysCloseBookmarked) {
      try {
        const bookmarks = await getAllBookmarks()
        const bookmarkUrls = bookmarks.map(b => b.normalizedUrl)
        const bookmarkedTabs = findBookmarkedTabs(tabs as ChromeTab[], bookmarkUrls)
        const blankTabs = findBlankTabs(tabs as ChromeTab[])

        bookmarkedTabs.forEach(tab => {
          if (typeof tab.id === "number") tabIdsToClose.add(tab.id)
        })
        blankTabs.forEach(tab => {
          if (typeof tab.id === "number") tabIdsToClose.add(tab.id)
        })
      } catch {
        console.warn("Could not access bookmarks")
      }
    }

    if (tabIdsToClose.size === 0) {
      res.send({ count: 0 })
      return
    }

    await chrome.tabs.remove(Array.from(tabIdsToClose))
    res.send({ count: tabIdsToClose.size })
  } catch (error) {
    console.error("Error closing tabs:", error)
    res.send({ count: 0 })
  }
}

export default handler
