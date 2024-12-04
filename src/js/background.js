chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "closeTabs") {
    handleCloseTabs().then(count => {
      sendResponse({ count: count });
    });
    return true; // Required for async response
  }
});

async function handleCloseTabs() {
  try {
    const result = await chrome.storage.sync.get(['safeUrls']);
    const safeUrls = result.safeUrls || [];
    const tabs = await chrome.tabs.query({});
    
    let closedCount = 0;
    const tabsToClose = tabs.filter(tab => {
      return safeUrls.some(url => tab.url.toLowerCase().includes(url.toLowerCase()));
    });

    if (tabsToClose.length > 0) {
      const tabIds = tabsToClose.map(tab => tab.id);
      await chrome.tabs.remove(tabIds);
      closedCount = tabIds.length;
    }

    return closedCount;
  } catch (error) {
    console.error('Error closing tabs:', error);
    return 0;
  }
}
