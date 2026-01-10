import { getSafeUrls, getSetting, STORAGE_KEYS } from './lib/storage.js';
import { findMatchingTabs, getDuplicateTabIds } from './lib/tab-actions.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.action !== 'closeTabs') {
    return undefined;
  }
  handleCloseTabs()
    .then((count) => sendResponse({ count }))
    .catch((error) => {
      console.error('Error handling closeTabs action', error);
      sendResponse({ count: 0 });
    });
  return true;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.action === 'updateBadge') {
    updateBadge()
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error('Error updating badge', error);
        sendResponse({ success: false });
      });
    return true;
  }
  return undefined;
});

async function updateBadge() {
  try {
    const [safeUrls, tabs] = await Promise.all([
      getSafeUrls(),
      chrome.tabs.query({})
    ]);
    const alwaysCloseDupes = await getSetting(STORAGE_KEYS.ALWAYS_CLOSE_DUPES, false);

    const matchingTabs = findMatchingTabs(tabs, safeUrls);
    const tabIdsToClose = new Set(
      matchingTabs
        .map((tab) => tab.id)
        .filter((id) => typeof id === 'number')
    );

    if (alwaysCloseDupes) {
      const duplicateIds = getDuplicateTabIds(tabs);
      duplicateIds.forEach((id) => tabIdsToClose.add(id));
    }

    const count = tabIdsToClose.size;
    
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

async function handleCloseTabs() {
  try {
    const [safeUrls, tabs] = await Promise.all([
      getSafeUrls(),
      chrome.tabs.query({})
    ]);
    const alwaysCloseDupes = await getSetting(STORAGE_KEYS.ALWAYS_CLOSE_DUPES, false);

    const matchingTabs = findMatchingTabs(tabs, safeUrls);
    const tabIdsToClose = new Set(
      matchingTabs
        .map((tab) => tab.id)
        .filter((id) => typeof id === 'number')
    );

    if (alwaysCloseDupes) {
      const duplicateIds = getDuplicateTabIds(tabs);
      duplicateIds.forEach((id) => tabIdsToClose.add(id));
    }

    if (!tabIdsToClose.size) {
      return 0;
    }

    await chrome.tabs.remove(Array.from(tabIdsToClose));
    return tabIdsToClose.size;
  } catch (error) {
    console.error('Error closing tabs:', error);
    return 0;
  }
}

