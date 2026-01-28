import type { PlasmoMessaging } from "@plasmohq/messaging"
import { getSafeUrls } from "~/hooks/use-safe-urls"
import { getSetting, STORAGE_KEYS } from "~/hooks/use-ui-settings"
import { findMatchingTabs, getDuplicateTabIds, type ChromeTab } from "~/lib/tab-actions"
import { findBookmarkedTabs, findBlankTabs, getAllBookmarks } from "~/lib/bookmark-utils"

export interface UpdateBadgeRequest {}

export interface UpdateBadgeResponse {
  success: boolean
  count: number
}

async function calculateBadgeCount(): Promise<number> {
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

  return tabIdsToClose.size
}

export async function updateBadge(): Promise<number> {
  const count = await calculateBadgeCount()

  if (count === 0) {
    await chrome.action.setBadgeText({ text: "" })
    await chrome.action.setBadgeBackgroundColor({ color: "#8C979C" })
  } else {
    await chrome.action.setBadgeText({ text: count.toString() })
    await chrome.action.setBadgeBackgroundColor({ color: "#ED5600" })
  }

  return count
}

const handler: PlasmoMessaging.MessageHandler<UpdateBadgeRequest, UpdateBadgeResponse> = async (req, res) => {
  try {
    const count = await updateBadge()
    res.send({ success: true, count })
  } catch (error) {
    console.error("Error updating badge:", error)
    res.send({ success: false, count: 0 })
  }
}

export default handler
