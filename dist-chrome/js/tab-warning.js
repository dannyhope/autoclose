// content script to toggle a warning prefix on the page title based on messages from the extension
// keeps track of whether the warning is currently applied so we can restore the title

let tabWarningOriginalTitle = document.title;
let tabWarningActive = false;

function stripTabWarningPrefix(title) {
  return String(title || '').replace(/^(🔴\s*){1,2}/, '');
}

function getTabWarningPrefix(level) {
  if (level === 2) return '🔴🔴 ';
  if (level === 1) return '🔴 ';
  return '';
}

function applyTabWarning(level) {
  const warningLevel = level === 2 ? 2 : 1;
  tabWarningOriginalTitle = stripTabWarningPrefix(document.title);
  document.title = getTabWarningPrefix(warningLevel) + tabWarningOriginalTitle;
  tabWarningActive = true;
}

function removeTabWarning() {
  if (!tabWarningActive && !document.title.startsWith("🔴")) return;
  const current = document.title;
  const cleaned = stripTabWarningPrefix(current);
  document.title = cleaned || tabWarningOriginalTitle;
  tabWarningActive = false;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request || !request.action) return;

  if (request.action === "setTabWarning") {
    const requestedLevel = typeof request.level === 'number' ? request.level : (request.enabled ? 1 : 0);
    if (requestedLevel >= 1) {
      applyTabWarning(requestedLevel);
      return;
    }
    removeTabWarning();
  }
});
