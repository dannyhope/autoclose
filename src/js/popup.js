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

  // Restore toggle state
  chrome.storage.sync.get(['listToggleState'], function(result) {
    const isOpen = result.listToggleState || false;
    urlListSection.classList.toggle('hidden', !isOpen);
    toggleListLink.querySelector('.toggle-indicator').innerHTML = isOpen ? '&#9660;' : '&#9654;';
  });

  // Toggle URL list visibility
  toggleListLink.addEventListener('click', function(e) {
    e.preventDefault();
    const indicator = this.querySelector('.toggle-indicator');
    urlListSection.classList.toggle('hidden');
    const isOpen = !urlListSection.classList.contains('hidden');
    indicator.innerHTML = isOpen ? '&#9660;' : '&#9654;';
    chrome.storage.sync.set({ listToggleState: isOpen });
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

  function formatUrlDisplay(urlStr) {
    try {
      const url = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
      const domain = url.hostname.replace(/^www\./, '');
      
      // Get the page title from the pathname
      let title = url.pathname === '/' 
        ? domain 
        : url.pathname.split('/').pop() || domain;
      
      // Clean up the title
      title = title
        .replace(/[-_]/g, ' ')  // Replace dashes and underscores with spaces
        .replace(/\.[^/.]+$/, '') // Remove file extension
        .trim();
      
      // Capitalize first letter of each word
      title = title.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Truncate if too long
      if (title.length > 30) {
        title = title.substring(0, 27) + '...';
      }
      
      return `${title} (${domain})`;
    } catch (error) {
      console.error('Error formatting URL:', error);
      return urlStr;
    }
  }

  function loadUrls() {
    chrome.storage.sync.get(['safeUrls'], async function(result) {
      const urls = result.safeUrls || [];
      
      // Clear existing list
      urlList.innerHTML = '';

      // Show/hide toggle link based on whether there are URLs
      toggleListLink.style.display = urls.length === 0 ? 'none' : 'block';
      
      // Update the list count
      updateListCount();
      
      // Get the current tab
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Populate the list
      urls.forEach(url => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between py-2 px-3 border-b border-gray-200';
        
        const urlText = document.createElement('span');
        urlText.className = 'flex-grow mr-2 text-gray-700';
        urlText.textContent = formatUrlDisplay(url);
        if (currentTab && currentTab.url.includes(url)) {
          const currentTag = document.createElement('span');
          currentTag.className = 'text-xs text-gray-500 ml-2';
          currentTag.textContent = 'CURRENT';
          urlText.appendChild(currentTag);
        }
        li.appendChild(urlText);
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        const img = document.createElement('img');
        img.src = 'icons/bin.svg';
        img.className = 'w-4 h-4 transition-opacity duration-200';
        img.alt = 'Delete';
        
        // Add hover effect
        deleteButton.addEventListener('mouseenter', () => {
          img.src = 'icons/bin-darker.svg';  // Switch to darker version on hover
        });
        
        deleteButton.addEventListener('mouseleave', () => {
          img.src = 'icons/bin.svg';  // Switch back to regular version
        });
        
        deleteButton.appendChild(img);
        deleteButton.addEventListener('click', () => deleteUrl(url));
        li.appendChild(deleteButton);
        
        urlList.appendChild(li);
      });
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
      }
    } catch (error) {
      console.error('Error deleting URL:', error);
    }
  }

  document.addEventListener('keydown', function(e) {
    if (e.altKey) {
      addAllTabsButton.classList.remove('hidden');
      addCurrentUrlButton.classList.add('hidden');
    }
  });

  document.addEventListener('keyup', function(e) {
    if (!e.altKey) {
      addAllTabsButton.classList.add('hidden');
      addCurrentUrlButton.classList.remove('hidden');
    }
  });

  // Call updateCounts initially and whenever URLs are loaded or tabs might change
  loadUrls();
  updateListCount();
  updateMatchingTabsCount();
  chrome.tabs.onUpdated.addListener(updateMatchingTabsCount);
  chrome.tabs.onRemoved.addListener(updateMatchingTabsCount);
  chrome.tabs.onCreated.addListener(updateMatchingTabsCount);
});
