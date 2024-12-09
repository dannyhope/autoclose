document.addEventListener('DOMContentLoaded', function() {
  const urlInput = document.getElementById('urlInput');
  const addUrlButton = document.getElementById('addUrl');
  const addCurrentUrlButton = document.getElementById('addCurrentUrl');
  const addAllTabsButton = document.getElementById('addAllTabs');
  const urlList = document.getElementById('urlList');
  const closeTabsButton = document.getElementById('closeTabs');
  const toggleListLink = document.getElementById('toggleList');
  const urlListSection = document.getElementById('urlListSection');

  // Load saved URLs
  loadUrls();

  // Toggle URL list visibility
  toggleListLink.addEventListener('click', function(e) {
    e.preventDefault();
    const indicator = this.querySelector('.toggle-indicator');
    urlListSection.classList.toggle('hidden');
    indicator.innerHTML = urlListSection.classList.contains('hidden') ? '&#9654;' : '&#9660;';
  });

  // Add URL when clicking the add button
  addUrlButton.addEventListener('click', addCurrentUrl);

  // Add current tab URL
  addCurrentUrlButton.addEventListener('click', addCurrentTabUrl);

  // Add all open tabs
  addAllTabsButton.addEventListener('click', async function() {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      for (const tab of tabs) {
        if (tab.url) {
          const url = new URL(tab.url);
          const fullUrl = `${url.hostname}${url.pathname}${url.search}`;
          await addUrl(fullUrl);
        }
      }
    } catch (error) {
      console.error('Error adding all tabs:', error);
    }
  });

  // Add URL when pressing Enter in the input field
  urlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addCurrentUrl();
    }
  });

  // Close matching tabs
  closeTabsButton.addEventListener('click', async function() {
    await chrome.runtime.sendMessage({ action: "closeTabs" });
  });

  function addCurrentUrl() {
    const url = urlInput.value.trim();
    if (url) {
      addUrl(url);
    }
  }

  async function addCurrentTabUrl() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        // Extract full URL, including query string
        const url = new URL(tab.url);
        const fullUrl = `${url.hostname}${url.pathname}${url.search}`;
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
        urlInput.value = '';
        updateListCount();
        updateMatchingTabsCount();
      }
    } catch (error) {
      console.error('Error adding URL', error);
    }
  }

  function loadUrls() {
    chrome.storage.sync.get(['safeUrls'], function(result) {
      const urls = result.safeUrls || [];
      
      // Clear existing list
      urlList.innerHTML = '';

      // Show/hide toggle link based on whether there are URLs
      toggleListLink.style.display = urls.length === 0 ? 'none' : 'block';
      
      // Update the list count
      updateListCount();
      
      // Populate the list
      urls.forEach(url => {
        const li = document.createElement('li');
        
        const urlLink = document.createElement('a');
        urlLink.href = url.startsWith('http') ? url : `https://${url}`;
        urlLink.target = '_blank';
        
        try {
          // Try to get a readable page name
          const urlObj = new URL(urlLink.href);
          const pageName = urlObj.pathname === '/' 
            ? urlObj.hostname.replace(/^www\./, '')
            : urlObj.pathname.split('/').pop() || urlObj.hostname.replace(/^www\./, '');
          
          urlLink.textContent = pageName;
          urlLink.title = url; // Show full URL on hover
        } catch (e) {
          urlLink.textContent = url;
        }
        
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
        deleteButton.classList.add('delete-url');
        deleteButton.addEventListener('click', () => deleteUrl(url));

        li.appendChild(urlLink);
        li.appendChild(deleteButton);
        urlList.appendChild(li);
      });
      updateMatchingTabsCount();
    });
  }

  function updateListCount() {
    chrome.storage.sync.get(['safeUrls'], function(result) {
      const urls = result.safeUrls || [];
      document.getElementById('listCount').textContent = `(${urls.length})`;
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

      document.getElementById('matchingTabsCount').textContent = `(${matchingTabsCount})`;
    } catch (error) {
      console.error('Error counting matching tabs:', error);
      document.getElementById('matchingTabsCount').textContent = '(0)';
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
      }
    } catch (error) {
      console.error('Error deleting URL:', error);
    }
  }

  // Call updateCounts initially and whenever URLs are loaded or tabs might change
  loadUrls();
  updateListCount();
  updateMatchingTabsCount();
  chrome.tabs.onUpdated.addListener(updateMatchingTabsCount);
  chrome.tabs.onRemoved.addListener(updateMatchingTabsCount);
  chrome.tabs.onCreated.addListener(updateMatchingTabsCount);
});
