import { updateBadge } from "~/background/messages/update-badge"
import { getTabIdsToClose } from "~/lib/get-tabs-to-close"

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
  const tabIds = await getTabIdsToClose()
  if (tabIds.size === 0) return 0

  await chrome.tabs.remove(Array.from(tabIds))
  return tabIds.size
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
