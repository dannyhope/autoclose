import { getSafeUrls, getSetting, STORAGE_KEYS } from './lib/storage.js';
import { findMatchingTabs, getDuplicateTabIds } from './lib/tab-actions.js';
import { getAllBookmarks, findBookmarkedTabs, findBlankTabs } from './lib/bookmark-utils.js';
import { tileAllTabs } from './lib/window-tiling.js';

// Consolidated message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request?.action) return;

  switch (request.action) {
    case 'closeTabs':
      handleCloseTabs()
        .then((count) => sendResponse({ count }))
        .catch((error) => {
          console.error('Error closing tabs:', error);
          sendResponse({ count: 0 });
        });
      return true;

    case 'updateBadge':
      updateBadge()
        .then(() => sendResponse({ success: true }))
        .catch((error) => {
          console.error('Error updating badge:', error);
          sendResponse({ success: false });
        });
      return true;

    case 'tileTabs':
      tileAllTabs()
        .then(() => sendResponse({ success: true }))
        .catch((error) => {
          console.error('Error tiling tabs:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
  }
});

// Shared logic for getting tab IDs to close
async function getTabIdsToClose() {
  const [safeUrls, tabs] = await Promise.all([
    getSafeUrls(),
    chrome.tabs.query({})
  ]);
  const alwaysCloseDupes = await getSetting(STORAGE_KEYS.ALWAYS_CLOSE_DUPES, false);
  const alwaysCloseBookmarked = await getSetting(STORAGE_KEYS.ALWAYS_CLOSE_BOOKMARKED, false);

  const matchingTabs = findMatchingTabs(tabs, safeUrls);
  const tabIds = new Set(
    matchingTabs
      .map((tab) => tab.id)
      .filter((id) => typeof id === 'number')
  );

  if (alwaysCloseDupes) {
    getDuplicateTabIds(tabs).forEach((id) => tabIds.add(id));
  }

  if (alwaysCloseBookmarked) {
    const bookmarks = await getAllBookmarks();
    const bookmarkUrls = bookmarks.map((b) => b.normalizedUrl);
    const bookmarkedTabs = findBookmarkedTabs(tabs, bookmarkUrls);
    const blankTabs = findBlankTabs(tabs);
    [...bookmarkedTabs, ...blankTabs].forEach((tab) => {
      if (typeof tab.id === 'number') tabIds.add(tab.id);
    });
  }

  return tabIds;
}

async function updateBadge() {
  try {
    const tabIds = await getTabIdsToClose();
    const count = tabIds.size;

    if (count === 0) {
      await chrome.action.setBadgeText({ text: '' });
      await chrome.action.setBadgeBackgroundColor({ color: '#8C979C' });
    } else {
      await chrome.action.setBadgeText({ text: count.toString() });
      await chrome.action.setBadgeBackgroundColor({ color: '#ED5600' });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

async function handleCloseTabs() {
  try {
    const tabIds = await getTabIdsToClose();
    if (tabIds.size === 0) return 0;

    await chrome.tabs.remove(Array.from(tabIds));
    return tabIds.size;
  } catch (error) {
    console.error('Error closing tabs:', error);
    return 0;
  }
}

// Update badge when tabs change
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    updateBadge();
  }
});

chrome.tabs.onRemoved.addListener(updateBadge);
chrome.tabs.onCreated.addListener(updateBadge);

// Initial badge update
updateBadge();
