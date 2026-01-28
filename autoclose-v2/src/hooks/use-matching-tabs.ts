import { useState, useEffect, useCallback } from "react"
import { findMatchingTabs, getDuplicateTabIds, type ChromeTab } from "~/lib/tab-actions"
import { findBookmarkedTabs, findBlankTabs, getAllBookmarks } from "~/lib/bookmark-utils"
import { useSafeUrls } from "./use-safe-urls"
import { useAlwaysCloseDupes, useAlwaysCloseBookmarked } from "./use-ui-settings"

export interface MatchingTabsResult {
  matchingTabs: ChromeTab[]
  totalCount: number
  refresh: () => Promise<void>
}

/**
 * Hook to get tabs that match safe URLs, duplicates, and bookmarked criteria
 */
export function useMatchingTabs(): MatchingTabsResult {
  const { safeUrls } = useSafeUrls()
  const { enabled: closeDupes } = useAlwaysCloseDupes()
  const { enabled: closeBookmarked } = useAlwaysCloseBookmarked()
  
  const [matchingTabs, setMatchingTabs] = useState<ChromeTab[]>([])
  const [tabIdsToClose, setTabIdsToClose] = useState<Set<number>>(new Set())

  const refresh = useCallback(async () => {
    const tabs = await chrome.tabs.query({})
    
    // Find tabs matching safe URLs
    const matching = findMatchingTabs(tabs, safeUrls)
    const idsToClose = new Set<number>(
      matching
        .map(tab => tab.id)
        .filter((id): id is number => typeof id === "number")
    )

    // Add duplicates if enabled
    if (closeDupes) {
      const dupeIds = getDuplicateTabIds(tabs)
      dupeIds.forEach(id => idsToClose.add(id))
    }

    // Add bookmarked tabs if enabled
    if (closeBookmarked) {
      try {
        const bookmarks = await getAllBookmarks()
        const bookmarkUrls = bookmarks.map(b => b.normalizedUrl)
        const bookmarkedTabs = findBookmarkedTabs(tabs, bookmarkUrls)
        const blankTabs = findBlankTabs(tabs)
        
        bookmarkedTabs.forEach(tab => {
          if (typeof tab.id === "number") idsToClose.add(tab.id)
        })
        blankTabs.forEach(tab => {
          if (typeof tab.id === "number") idsToClose.add(tab.id)
        })
      } catch {
        // Bookmark permission might not be granted
        console.warn("Could not access bookmarks")
      }
    }

    setMatchingTabs(matching)
    setTabIdsToClose(idsToClose)
  }, [safeUrls, closeDupes, closeBookmarked])

  // Refresh on mount and when dependencies change
  useEffect(() => {
    refresh()
  }, [refresh])

  // Set up tab change listeners
  useEffect(() => {
    const handleTabChange = () => {
      refresh()
    }

    chrome.tabs.onUpdated.addListener(handleTabChange)
    chrome.tabs.onRemoved.addListener(handleTabChange)
    chrome.tabs.onCreated.addListener(handleTabChange)

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabChange)
      chrome.tabs.onRemoved.removeListener(handleTabChange)
      chrome.tabs.onCreated.removeListener(handleTabChange)
    }
  }, [refresh])

  return {
    matchingTabs,
    totalCount: tabIdsToClose.size,
    refresh
  }
}
