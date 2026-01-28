import { updateBadge } from "~/background/messages/update-badge"
import { getSafeUrls } from "~/hooks/use-safe-urls"
import { getSetting, STORAGE_KEYS } from "~/hooks/use-ui-settings"
import { findMatchingTabs, getDuplicateTabIds, type ChromeTab } from "~/lib/tab-actions"
import { findBookmarkedTabs, findBlankTabs, getAllBookmarks } from "~/lib/bookmark-utils"

interface Message {
  name: string
  body?: unknown
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (message.name === "update-badge") {
    updateBadge()
      .then(count => sendResponse({ success: true, count }))
      .catch(() => sendResponse({ success: false }))
    return true
  }

  if (message.name === "close-tabs") {
    handleCloseTabs()
      .then(count => sendResponse({ count }))
      .catch(() => sendResponse({ count: 0 }))
    return true
  }
})

async function handleCloseTabs(): Promise<number> {
  const [safeUrls, tabs] = await Promise.all([
    getSafeUrls(),
    chrome.tabs.query({})
  ])

  const alwaysCloseDupes = await getSetting(STORAGE_KEYS.ALWAYS_CLOSE_DUPES, false)
  const alwaysCloseBookmarked = await getSetting(STORAGE_KEYS.ALWAYS_CLOSE_BOOKMARKED, false)

  const matchingTabs = findMatchingTabs(tabs as ChromeTab[], safeUrls)
  const tabIdsToClose = new Set<number>(
    matchingTabs
      .map(tab => tab.id)
      .filter((id): id is number => typeof id === "number")
  )

  if (alwaysCloseDupes) {
    const duplicateIds = getDuplicateTabIds(tabs as ChromeTab[])
    duplicateIds.forEach(id => tabIdsToClose.add(id))
  }

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

  if (tabIdsToClose.size === 0) return 0

  await chrome.tabs.remove(Array.from(tabIdsToClose))
  return tabIdsToClose.size
}

// Update badge when tabs change
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    updateBadge()
  }
})

chrome.tabs.onRemoved.addListener(() => {
  updateBadge()
})

chrome.tabs.onCreated.addListener(() => {
  updateBadge()
})

// Initial badge update
updateBadge()

export {}
