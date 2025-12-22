chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "closeTabs") {
    handleCloseTabs().then(count => {
      sendResponse({ count: count });
    });
    return true; // Required for async response
  }
});

function normalizeUrlForDupeCheck(url) {
  try {
    const parsed = new URL(String(url || ''));
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.replace(/\/+$/, '');
    const search = parsed.search;
    return hostname + pathname + search;
  } catch (e) {
    return String(url || '')
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/, '')
      .toLowerCase();
  }
}

function getDupeTabIdsToClose(tabs) {
  const seen = new Set();
  const tabIdsToClose = [];

  for (const tab of tabs) {
    if (!tab || typeof tab.id !== 'number' || !tab.url) {
      continue;
    }
    const key = normalizeUrlForDupeCheck(tab.url);
    if (!key) {
      continue;
    }
    if (seen.has(key)) {
      tabIdsToClose.push(tab.id);
      continue;
    }
    seen.add(key);
  }

  return tabIdsToClose;
}

async function handleCloseTabs() {
  try {
    const result = await chrome.storage.sync.get(['safeUrls', 'alwaysCloseDupes']);
    const safeUrls = result.safeUrls || [];
    const alwaysCloseDupes = Boolean(result.alwaysCloseDupes);
    const tabs = await chrome.tabs.query({});

    const tabIdsToClose = new Set();

    if (alwaysCloseDupes) {
      const dupeTabIdsToClose = getDupeTabIdsToClose(tabs);
      for (const id of dupeTabIdsToClose) {
        tabIdsToClose.add(id);
      }
    }

    const tabsMatchingSafeUrls = tabs.filter(tab => {
      if (!tab || typeof tab.id !== 'number' || !tab.url) {
        return false;
      }
      const tabUrlLower = tab.url.toLowerCase();
      return safeUrls.some(url => tabUrlLower.includes(String(url || '').toLowerCase()));
    });

    for (const tab of tabsMatchingSafeUrls) {
      tabIdsToClose.add(tab.id);
    }

    const tabIds = Array.from(tabIdsToClose);
    if (tabIds.length > 0) {
      await chrome.tabs.remove(tabIds);
    }

    return tabIds.length;
  } catch (error) {
    console.error('Error closing tabs:', error);
    return 0;
  }
}
