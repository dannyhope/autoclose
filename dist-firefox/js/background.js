import { getSafeUrls, getNeverCloseUrls, getSetting, STORAGE_KEYS } from './lib/storage.js';
import { findMatchingTabs, getDuplicateTabIds } from './lib/tab-actions.js';
import { matchesUrlPattern } from './lib/url-utils.js';
import { getAllBookmarks, findBookmarkedTabs, findBlankTabs } from './lib/bookmark-utils.js';
import { tileAllTabs } from './lib/window-tiling.js';
import { extensionApi } from './lib/browser-api.js';

// Consolidated message handler
extensionApi.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
function isNeverCloseTab(tab, neverCloseUrls) {
  if (!tab?.url || !neverCloseUrls.length) return false;
  return neverCloseUrls.some((pattern) => matchesUrlPattern(tab.url, String(pattern || '')));
}

async function getTabIdsToClose() {
  const [safeUrls, neverCloseUrls, tabs] = await Promise.all([
    getSafeUrls(),
    getNeverCloseUrls(),
      extensionApi.tabs.query({})
  ]);
  const alwaysCloseDupes = await getSetting(STORAGE_KEYS.ALWAYS_CLOSE_DUPES, false);
  const alwaysCloseBookmarked = await getSetting(STORAGE_KEYS.ALWAYS_CLOSE_BOOKMARKED, false);

  const matchingTabs = findMatchingTabs(tabs, safeUrls);
  const tabIds = new Set(
    matchingTabs
      .filter((tab) => !isNeverCloseTab(tab, neverCloseUrls))
      .map((tab) => tab.id)
      .filter((id) => typeof id === 'number')
  );

  if (alwaysCloseDupes) {
    getDuplicateTabIds(tabs).forEach((id) => {
      const tab = tabs.find((t) => t.id === id);
      if (tab && !isNeverCloseTab(tab, neverCloseUrls)) {
        tabIds.add(id);
      }
    });
  }

  if (alwaysCloseBookmarked) {
    const bookmarks = await getAllBookmarks();
    const bookmarkUrls = bookmarks.map((b) => b.normalizedUrl);
    const bookmarkedTabs = findBookmarkedTabs(tabs, bookmarkUrls);
    const blankTabs = findBlankTabs(tabs);
    [...bookmarkedTabs, ...blankTabs].forEach((tab) => {
      if (typeof tab.id === 'number' && !isNeverCloseTab(tab, neverCloseUrls)) {
        tabIds.add(tab.id);
      }
    });
  }

  return tabIds;
}

async function updateBadge() {
  try {
    const tabIds = await getTabIdsToClose();
    const count = tabIds.size;

    if (count === 0) {
      await extensionApi.action?.setBadgeText?.({ text: '' });
      await extensionApi.action?.setBadgeBackgroundColor?.({ color: '#8C979C' });
    } else {
      await extensionApi.action?.setBadgeText?.({ text: count.toString() });
      await extensionApi.action?.setBadgeBackgroundColor?.({ color: '#ED5600' });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

async function handleCloseTabs() {
  try {
    const tabIds = await getTabIdsToClose();
    if (tabIds.size === 0) return 0;

    await extensionApi.tabs.remove(Array.from(tabIds));
    return tabIds.size;
  } catch (error) {
    console.error('Error closing tabs:', error);
    return 0;
  }
}

// Update badge when tabs change
extensionApi.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    updateBadge();
  }
});

extensionApi.tabs.onRemoved.addListener(updateBadge);
extensionApi.tabs.onCreated.addListener(updateBadge);

// Initial badge update
updateBadge();
