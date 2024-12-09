document.addEventListener('DOMContentLoaded', function() {
  const urlInput = document.getElementById('urlInput');
  const addUrlButton = document.getElementById('addUrl');
  const addCurrentUrlButton = document.getElementById('addCurrentUrl');
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
    indicator.textContent = urlListSection.classList.contains('hidden') ? '▶' : '▼';
  });

  // Add URL when clicking the add button
  addUrlButton.addEventListener('click', addCurrentUrl);

  // Add current tab URL
  addCurrentUrlButton.addEventListener('click', addCurrentTabUrl);

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
    });
  }

  function deleteUrl(url) {
    chrome.storage.sync.get(['safeUrls'], function(result) {
      const urls = result.safeUrls || [];
      const updatedUrls = urls.filter(u => u !== url);
      
      chrome.storage.sync.set({ safeUrls: updatedUrls }, function() {
        loadUrls();
      });
    });
  }
});
