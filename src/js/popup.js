document.addEventListener('DOMContentLoaded', function() {
  const urlInput = document.getElementById('urlInput');
  const addUrlButton = document.getElementById('addUrl');
  const urlList = document.getElementById('urlList');
  const closeTabsButton = document.getElementById('closeTabs');
  const statusElement = document.getElementById('status');

  // Load saved URLs
  loadUrls();

  // Add URL when clicking the add button
  addUrlButton.addEventListener('click', addCurrentUrl);

  // Add URL when pressing Enter in the input field
  urlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addCurrentUrl();
    }
  });

  // Close matching tabs
  closeTabsButton.addEventListener('click', async function() {
    showStatus('Closing tabs...', 'info');
    const result = await chrome.runtime.sendMessage({ action: "closeTabs" });
    showStatus(`Closed ${result.count} tabs`, 'success');
  });

  function addCurrentUrl() {
    const url = urlInput.value.trim();
    if (url) {
      addUrl(url);
    }
  }

  async function addUrl(url) {
    try {
      const result = await chrome.storage.sync.get(['safeUrls']);
      const urls = result.safeUrls || [];
      if (!urls.includes(url)) {
        urls.push(url);
        await chrome.storage.sync.set({ safeUrls: urls });
        loadUrls();
        urlInput.value = '';
        showStatus('URL added successfully', 'success');
      } else {
        showStatus('URL already exists', 'error');
      }
    } catch (error) {
      showStatus('Error adding URL', 'error');
    }
  }

  async function loadUrls() {
    try {
      const result = await chrome.storage.sync.get(['safeUrls']);
      const urls = result.safeUrls || [];
      urlList.innerHTML = '';
      
      if (urls.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No URLs added yet';
        urlList.appendChild(emptyMessage);
        return;
      }

      urls.forEach(function(url) {
        const li = document.createElement('li');
        
        const urlText = document.createElement('span');
        urlText.textContent = url;
        urlText.className = 'url-text';
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '×';
        deleteButton.className = 'delete-button';
        deleteButton.title = 'Delete URL';
        deleteButton.onclick = function() {
          deleteUrl(url);
        };
        
        li.appendChild(urlText);
        li.appendChild(deleteButton);
        urlList.appendChild(li);
      });
    } catch (error) {
      showStatus('Error loading URLs', 'error');
    }
  }

  async function deleteUrl(url) {
    try {
      const result = await chrome.storage.sync.get(['safeUrls']);
      const urls = result.safeUrls || [];
      const newUrls = urls.filter(u => u !== url);
      await chrome.storage.sync.set({ safeUrls: newUrls });
      loadUrls();
      showStatus('URL deleted successfully', 'success');
    } catch (error) {
      showStatus('Error deleting URL', 'error');
    }
  }

  function showStatus(message, type) {
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    setTimeout(() => {
      statusElement.textContent = '';
      statusElement.className = 'status';
    }, 3000);
  }
});
