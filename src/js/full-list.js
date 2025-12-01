document.addEventListener('DOMContentLoaded', async function() {
  const fullUrlList = document.getElementById('fullUrlList');
  const fullListStatus = document.getElementById('fullListStatus');
  const fullListTimestamp = document.getElementById('fullListTimestamp');

  if (fullListTimestamp) {
    fullListTimestamp.textContent = new Date().toLocaleString();
  }

  try {
    const result = await chrome.storage.sync.get(['safeUrls']);
    const safeUrls = result.safeUrls || [];

    if (!safeUrls.length) {
      fullListStatus.textContent = 'Your list is empty. Add some URLs from the popup first.';
      return;
    }

    const tabs = await chrome.tabs.query({});

    // Reuse similar logic to popup: a tab matches if its URL includes any safe URL (case-insensitive)
    const items = safeUrls.map(function(urlStr) {
      const isOpen = tabs.some(function(tab) {
        if (!tab.url) return false;
        return tab.url.toLowerCase().includes(urlStr.toLowerCase());
      });

      return { url: urlStr, isOpen: isOpen };
    });

    // Sort: open first, then alphabetically
    items.sort(function(a, b) {
      if (a.isOpen !== b.isOpen) {
        return a.isOpen ? -1 : 1;
      }
      return a.url.localeCompare(b.url);
    });

    fullUrlList.innerHTML = '';

    items.forEach(function(item) {
      const li = document.createElement('li');
      li.className = 'px-2 py-1 rounded flex justify-between items-center';

      if (item.isOpen) {
        li.classList.add('bg-green-50');
      } else {
        li.classList.add('bg-gray-50');
      }

      const textSpan = document.createElement('span');
      textSpan.textContent = item.url;
      textSpan.className = 'truncate mr-2';

      const statusSpan = document.createElement('span');
      statusSpan.className = 'text-[11px] font-medium';
      statusSpan.textContent = item.isOpen ? 'open' : 'not open';
      if (item.isOpen) {
        statusSpan.classList.add('text-green-700');
      } else {
        statusSpan.classList.add('text-gray-500');
      }

      li.appendChild(textSpan);
      li.appendChild(statusSpan);
      fullUrlList.appendChild(li);
    });

    const openCount = items.filter(function(i) { return i.isOpen; }).length;
    fullListStatus.textContent = openCount + ' of ' + items.length + ' pattern(s) are currently open in some tab.';
  } catch (e) {
    console.error('Error building full list view', e);
    fullListStatus.textContent = 'There was a problem loading the full list.';
  }
});
