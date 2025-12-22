document.addEventListener('DOMContentLoaded', function() {
  const addCurrentUrlButton = document.getElementById('addCurrentUrl');
  const addAllTabsButton = document.getElementById('addAllTabs');
  const urlList = document.getElementById('urlList');
  const closeTabsButton = document.getElementById('closeTabs');
  const alwaysCloseDupesCheckbox = document.getElementById('alwaysCloseDupes');
  const toggleListLink = document.getElementById('toggleList');
  const urlListSection = document.getElementById('urlListSection');
  const popupTimestamp = document.getElementById('popupTimestamp');

  let highlightedTabIds = [];

  // Load saved URLs
  loadUrls();
  highlightMatchingTabs();

  // Restore toggle state
  chrome.storage.sync.get(['listToggleState'], function(result) {
    const isOpen = result.listToggleState || false;
    urlListSection.classList.toggle('hidden', !isOpen);
    toggleListLink.querySelector('.toggle-indicator').innerHTML = isOpen ? '&#9660;' : '&#9654;';
  });

  // Restore "Always close dupes" state
  chrome.storage.sync.get(['alwaysCloseDupes'], function(result) {
    const alwaysCloseDupes = result.alwaysCloseDupes || false;
    if (alwaysCloseDupesCheckbox) {
      alwaysCloseDupesCheckbox.checked = Boolean(alwaysCloseDupes);
    }
  });

  if (alwaysCloseDupesCheckbox) {
    alwaysCloseDupesCheckbox.addEventListener('change', function() {
      chrome.storage.sync.set({ alwaysCloseDupes: Boolean(alwaysCloseDupesCheckbox.checked) });
    });
  }

  // Toggle URL list visibility
  toggleListLink.addEventListener('click', function(e) {
    e.preventDefault();
    const indicator = this.querySelector('.toggle-indicator');
    urlListSection.classList.toggle('hidden');
    const isOpen = !urlListSection.classList.contains('hidden');
    indicator.innerHTML = isOpen ? '&#9660;' : '&#9654;';
    chrome.storage.sync.set({ listToggleState: isOpen });
    if (isOpen) {
      urlListSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Handle option/alt key state
  let isOptionPressed = false;
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Alt' && !isOptionPressed) {
      isOptionPressed = true;
      addCurrentUrlButton.textContent = 'Add tab to list and close';
      addAllTabsButton.textContent = 'Add all tabs to list and close';
      addCurrentUrlButton.style.display = 'block';
      addAllTabsButton.style.display = 'block';
    }
  });

  document.addEventListener('keyup', function(e) {
    if (e.key === 'Alt') {
      isOptionPressed = false;
      addCurrentUrlButton.textContent = 'Add tab to list';
      addAllTabsButton.textContent = 'Add all tabs to list';
      addCurrentUrlButton.style.display = 'block';
      addAllTabsButton.style.display = 'block';
    }
  });

  // Ensure buttons are visible by default
  addCurrentUrlButton.style.display = 'block';
  addAllTabsButton.style.display = 'block';

  // Add current tab URL with optional close
  addCurrentUrlButton.addEventListener('click', async function() {
    await addCurrentTabUrl();
    await highlightMatchingTabs();
    if (isOptionPressed) {
      await chrome.runtime.sendMessage({ action: "closeTabs" });
      await clearHighlightedTabs();
    }
  });

  // Add all open tabs with optional close
  addAllTabsButton.addEventListener('click', async function() {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      for (const tab of tabs) {
        if (tab.url) {
          let fullUrl = tab.url;
          try {
            const parsed = new URL(tab.url);
            fullUrl = `${parsed.hostname}${parsed.pathname}${parsed.search}`;
          } catch (e) {
            // Fall back to the raw tab URL string if parsing fails
            fullUrl = tab.url;
          }
          await addUrl(fullUrl);
        }
      }
      await highlightMatchingTabs();
      if (isOptionPressed) {
        await chrome.runtime.sendMessage({ action: "closeTabs" });
        await clearHighlightedTabs();
      }
    } catch (error) {
      console.error('Error adding all tabs:', error);
    }
  });

  // Close matching tabs
  closeTabsButton.addEventListener('click', async function() {
    await chrome.runtime.sendMessage({ action: "closeTabs" });
    await clearHighlightedTabs();
  });

  async function addCurrentTabUrl() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        // Extract hostname/path/search when possible, but be safe with unusual URLs
        let fullUrl = tab.url;
        try {
          const parsed = new URL(tab.url);
          fullUrl = `${parsed.hostname}${parsed.pathname}${parsed.search}`;
        } catch (e) {
          fullUrl = tab.url;
        }
        await addUrl(fullUrl);
      }
    } catch (error) {
      console.error('Error adding current tab URL', error);
    }
  }

  async function addUrl(url) {
    try {
      const result = await chrome.storage.sync.get(['safeUrls']);
      const urls = result.safeUrls || [];
      if (!urls.includes(url)) {
        // Add URL to the beginning of the list
        urls.unshift(url);
        await chrome.storage.sync.set({ safeUrls: urls });
        loadUrls();
        updateListCount();
        updateMatchingTabsCount();
        await highlightMatchingTabs();
      }
    } catch (error) {
      console.error('Error adding URL', error);
    }
  }

  // Sort URLs by domain, path, and title
  function sortUrls(urls) {
    return urls.slice().sort((a, b) => String(a).localeCompare(String(b)));
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Format URL for display with open indicator (favicon is shown at domain level)
  async function formatUrlDisplay(urlStr, isOpen) {
    try {
      let hostname;
      let pathname;

      try {
        const parsed = new URL(urlStr);
        hostname = parsed.hostname;
        pathname = parsed.pathname + parsed.search;
      } catch (e) {
        const withoutProto = urlStr.replace(/^https?:\/\//, '');
        const parts = withoutProto.split('/');
        hostname = parts[0] || urlStr;
        const rest = parts.slice(1).join('/');
        pathname = rest ? '/' + rest : '';
      }

      const displayUrl = pathname || '/';
      const openTag = isOpen ? '<span class="open-tag">🔴</span>' : '<span class="open-tag"></span>';

      return `
        <div class="url-item flex items-center gap-2 pl-8 pr-2 py-1.5">
          <span class="url-text flex-1 truncate whitespace-nowrap" role="button" tabindex="0" data-url="${escapeHtml(urlStr)}" title="${escapeHtml(urlStr)}">${displayUrl}</span>
          <span class="flex-none w-4 text-center">${openTag}</span>
          <button class="delete-btn flex-none text-gray-500 hover:text-red-600 px-1" data-url="${urlStr}" title="Remove this pattern"><img src="icons/bin-darker.svg" alt="Remove" class="w-4 h-4 mx-auto" /></button>
        </div>
      `;
    } catch (e) {
      console.error('Error formatting URL:', e);
      return urlStr;
    }
  }

  // Update loadUrls to use the new sorting and formatting
  async function loadUrls() {
    console.log('Loading URLs...');
    chrome.storage.sync.get(['safeUrls'], async function(result) {
      console.log('Retrieved URLs from storage:', result);
      const urls = result.safeUrls || [];
      const sortedUrls = sortUrls(urls);
      const tabs = await chrome.tabs.query({});

      // Build flat list with open state
      const items = sortedUrls.map(url => {
        const isOpen = tabs.some(tab => tab.url && tab.url.toLowerCase().includes(String(url).toLowerCase()));
        return { url, isOpen };
      });

      // Derive domain/hostname for grouping
      const itemsWithDomain = items.map(item => {
        let hostname;
        try {
          const parsed = new URL(String(item.url));
          hostname = parsed.hostname;
        } catch (e) {
          const withoutProto = String(item.url).replace(/^https?:\/\//, '');
          const parts = withoutProto.split('/');
          hostname = parts[0] || String(item.url);
        }
        return { ...item, domain: hostname };
      });

      // Group by domain
      const domainMap = new Map();
      itemsWithDomain.forEach(item => {
        const key = String(item.domain || '').toLowerCase();
        if (!domainMap.has(key)) {
          domainMap.set(key, { domain: item.domain, items: [] });
        }
        domainMap.get(key).items.push(item);
      });

      // Sort domains alphabetically
      const domainGroups = Array.from(domainMap.values()).sort((a, b) => {
        return String(a.domain).localeCompare(String(b.domain));
      });

      // Within each domain: open first, then alphabetically by URL
      domainGroups.forEach(group => {
        group.items.sort((a, b) => {
          if (a.isOpen !== b.isOpen) {
            return a.isOpen ? -1 : 1;
          }
          return String(a.url).localeCompare(String(b.url));
        });
      });

      urlList.innerHTML = '';

      for (const group of domainGroups) {
        // Domain header
        const headerLi = document.createElement('li');
        headerLi.className = 'flex items-center gap-2 text-[11px] text-gray-500 mt-3 mb-0 px-1';

        const faviconImg = document.createElement('img');
        faviconImg.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(group.domain)}&sz=16`;
        faviconImg.alt = '';
        faviconImg.className = 'w-4 h-4 flex-none';
        faviconImg.title = group.domain;

        const domainSpan = document.createElement('span');
        domainSpan.textContent = group.domain;
        domainSpan.title = group.domain;

        headerLi.appendChild(faviconImg);
        headerLi.appendChild(domainSpan);
        urlList.appendChild(headerLi);

        // URLs under this domain
        for (const item of group.items) {
          const li = document.createElement('li');
          li.innerHTML = await formatUrlDisplay(item.url, item.isOpen);
          urlList.appendChild(li);

          const urlText = li.querySelector('.url-text');
          if (urlText) {
            const handleOpen = () => openUrlInNewTab(item.url);
            urlText.addEventListener('click', handleOpen);
            urlText.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpen();
              }
            });
          }

          // Add click handler for delete button
          const deleteBtn = li.querySelector('.delete-btn');
          if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteUrl(item.url));
          }
        }
      }
      
      updateListCount();
      updateMatchingTabsCount();
    });
  }

  function updateListCount() {
    chrome.storage.sync.get(['safeUrls'], function(result) {
      const urls = result.safeUrls || [];
      document.getElementById('listCount').textContent = `${urls.length}`;
    });
  }

  async function updateMatchingTabsCount() {
    try {
      const result = await chrome.storage.sync.get(['safeUrls']);
      const safeUrls = result.safeUrls || [];
      
      const tabs = await chrome.tabs.query({});
      const matchingTabsCount = tabs.filter(tab => 
        safeUrls.some(url => tab.url.toLowerCase().includes(url.toLowerCase()))
      ).length;

      document.getElementById('matchingTabsCount').textContent = `${matchingTabsCount}`;
    } catch (error) {
      console.error('Error counting matching tabs:', error);
      document.getElementById('matchingTabsCount').textContent = '0';
    }
  }

  async function deleteUrl(url) {
    try {
      const result = await chrome.storage.sync.get(['safeUrls']);
      const urls = result.safeUrls || [];
      const index = urls.indexOf(url);
      if (index > -1) {
        urls.splice(index, 1);
        await chrome.storage.sync.set({ safeUrls: urls });
        loadUrls();
        updateListCount();
        updateMatchingTabsCount();
        await highlightMatchingTabs();
      }
    } catch (error) {
      console.error('Error deleting URL:', error);
    }
  }

  async function openUrlInNewTab(urlStr) {
    try {
      let targetUrl = String(urlStr || '');
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }
      await chrome.tabs.create({ url: targetUrl });
    } catch (error) {
      console.error('Error opening URL in new tab', error);
    }
  }

  async function getMatchingTabs() {
    try {
      const result = await chrome.storage.sync.get(['safeUrls']);
      const safeUrls = result.safeUrls || [];
      if (!safeUrls.length) {
        return [];
      }

      const tabs = await chrome.tabs.query({});
      return tabs.filter(tab => {
        if (!tab.url) return false;
        const urlLower = tab.url.toLowerCase();
        return safeUrls.some(safeUrl => urlLower.includes(String(safeUrl).toLowerCase()));
      });
    } catch (e) {
      console.error('Error finding matching tabs for warnings', e);
      return [];
    }
  }

  async function highlightMatchingTabs() {
    try {
      await clearHighlightedTabs();
      const matchingTabs = await getMatchingTabs();
      const tabIds = matchingTabs.map(tab => tab.id).filter(id => typeof id === 'number');
      highlightedTabIds = tabIds;

      for (const id of tabIds) {
        chrome.tabs.sendMessage(id, { action: "setTabWarning", enabled: true });
      }
    } catch (e) {
      console.error('Error highlighting matching tabs', e);
    }
  }

  async function clearHighlightedTabs() {
    try {
      const ids = highlightedTabIds || [];
      highlightedTabIds = [];
      for (const id of ids) {
        chrome.tabs.sendMessage(id, { action: "setTabWarning", enabled: false });
      }
    } catch (e) {
      console.error('Error clearing highlighted tabs', e);
    }
  }

  // Call updateCounts initially and whenever URLs are loaded or tabs might change
  loadUrls();
  updateListCount();
  updateMatchingTabsCount();
  chrome.tabs.onUpdated.addListener(updateMatchingTabsCount);
  chrome.tabs.onRemoved.addListener(updateMatchingTabsCount);
  chrome.tabs.onCreated.addListener(updateMatchingTabsCount);

  if (popupTimestamp) {
    popupTimestamp.textContent = new Date().toLocaleString();
  }

  window.addEventListener('beforeunload', () => {
    clearHighlightedTabs();
  });
});
