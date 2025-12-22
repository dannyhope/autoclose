// content script to toggle a warning prefix on the page title based on messages from the extension
// keeps track of whether the warning is currently applied so we can restore the title

let tabWarningOriginalTitle = document.title;
let tabWarningActive = false;

function applyTabWarning() {
  if (tabWarningActive) return;
  tabWarningOriginalTitle = document.title;
  if (!tabWarningOriginalTitle.startsWith("🔴 ")) {
    document.title = "🔴 " + tabWarningOriginalTitle;
  }
  tabWarningActive = true;
}

function removeTabWarning() {
  if (!tabWarningActive && !document.title.startsWith("🔴 ")) return;
  const current = document.title;
  const cleaned = current.replace(/^🔴\s*/, "");
  document.title = cleaned || tabWarningOriginalTitle;
  tabWarningActive = false;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request || !request.action) return;

  if (request.action === "setTabWarning") {
    if (request.enabled) {
      applyTabWarning();
    } else {
      removeTabWarning();
    }
  }
});
