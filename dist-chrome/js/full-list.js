import { getSafeUrls } from './lib/storage.js';
import { matchesUrlPattern, parseUrlParts } from './lib/url-utils.js';

document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
  const timestampEl = document.getElementById('fullListTimestamp');
  if (timestampEl) {
    timestampEl.textContent = new Date().toLocaleString();
  }
  await renderFullList();
}

async function renderFullList() {
  const listEl = document.getElementById('fullUrlList');
  const statusEl = document.getElementById('fullListStatus');

  if (!listEl || !statusEl) {
    return;
  }

  try {
    const [safeUrls, tabs] = await Promise.all([
      getSafeUrls(),
      chrome.tabs.query({})
    ]);

    if (!safeUrls.length) {
      statusEl.textContent = 'Your list is empty. Add some URLs from the popup first.';
      listEl.innerHTML = '';
      return;
    }

    const items = safeUrls.map((url) => {
      const isOpen = tabs.some((tab) => tab.url && matchesUrlPattern(tab.url, String(url || '')));
      const parts = parseUrlParts(url);
      return {
        url,
        display: `${parts.hostname || ''}${parts.displayPath}`,
        isOpen
      };
    });

    items.sort((a, b) => {
      if (a.isOpen !== b.isOpen) {
        return a.isOpen ? -1 : 1;
      }
      return a.display.localeCompare(b.display);
    });

    listEl.innerHTML = '';
    items.forEach((item) => listEl.appendChild(createListItem(item)));

    const openCount = items.filter((item) => item.isOpen).length;
    statusEl.textContent = `${openCount} of ${items.length} pattern(s) are currently open in some tab.`;
  } catch (error) {
    console.error('Error building full list view', error);
    statusEl.textContent = 'There was a problem loading the full list.';
  }
}

function createListItem(item) {
  const li = document.createElement('li');
  li.className = 'px-2 py-1 rounded flex justify-between items-center';
  li.classList.add(item.isOpen ? 'bg-green-50' : 'bg-gray-50');

  const textSpan = document.createElement('span');
  textSpan.textContent = item.display;
  textSpan.className = 'truncate mr-2';

  const statusSpan = document.createElement('span');
  statusSpan.className = 'text-[11px] font-medium';
  statusSpan.textContent = item.isOpen ? 'open' : 'not open';
  statusSpan.classList.add(item.isOpen ? 'text-green-700' : 'text-gray-500');

  li.appendChild(textSpan);
  li.appendChild(statusSpan);
  return li;
}

