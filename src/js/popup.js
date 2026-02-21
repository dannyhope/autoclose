import { addSafeUrl, addSafeUrls, getSafeUrls, removeSafeUrl, addNeverCloseUrl, getNeverCloseUrls, removeNeverCloseUrl, STORAGE_KEYS } from './lib/storage.js';
import { escapeHtml, matchesUrlPattern, parseUrlParts, toPatternFromTabUrl } from './lib/url-utils.js';
import { findMatchingTabs, getDuplicateTabIds } from './lib/tab-actions.js';
import { getUIState, setUIState, toggleUIState, UI_STATE_KEYS } from './lib/ui-state.js';
import { getAllBookmarks, findBookmarkedTabs, findBlankTabs } from './lib/bookmark-utils.js';

const POPUP_COLLAPSED_HEIGHT = 160;
const POPUP_EXPANDED_HEIGHT = 600;

const OPTION_TEXT = {
  ADD_SINGLE_DEFAULT: 'Add tab to list',
  ADD_SINGLE_ALT: 'Add tab to list and close',
  ADD_ALL_DEFAULT: 'Add all tabs to list',
  ADD_ALL_ALT: 'Add all tabs to list and close'
};

const context = {
  state: {
    highlightedTabIds: [],
    isOptionPressed: false
  },
  refs: {}
};

let openCounts = new Map();
let refreshTimeout = null;

function updateToggleIndicator(isOpen) {
  const indicator = context.refs.toggleListLink?.querySelector('.toggle-indicator');
  if (!indicator) {
    return;
  }
  indicator.setAttribute('data-open', String(Boolean(isOpen)));
  indicator.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(-90deg)';
}

function updateNeverCloseToggleIndicator(isOpen) {
  const indicator = context.refs.toggleNeverCloseListLink?.querySelector('.toggle-indicator');
  if (!indicator) {
    return;
  }
  indicator.setAttribute('data-open', String(Boolean(isOpen)));
  indicator.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(-90deg)';
}

function collectRefs() {
  context.refs = {
    addCurrentUrlButton: document.getElementById('addCurrentUrl'),
    addAllTabsButton: document.getElementById('addAllTabs'),
    urlList: document.getElementById('urlList'),
    closeTabsButton: document.getElementById('closeTabs'),
    closeTabsText: document.getElementById('closeTabsText'),
    alwaysCloseDupesCheckbox: document.getElementById('alwaysCloseDupes'),
    alwaysCloseBookmarkedCheckbox: document.getElementById('alwaysCloseBookmarked'),
    toggleListLink: document.getElementById('toggleList'),
    urlListSection: document.getElementById('urlListSection'),
    tileTabsButton: document.getElementById('tileTabs'),
    toggleNeverCloseListLink: document.getElementById('toggleNeverCloseList'),
    neverCloseListSection: document.getElementById('neverCloseListSection'),
    neverCloseList: document.getElementById('neverCloseList'),
    addCurrentUrlToNeverCloseButton: document.getElementById('addCurrentUrlToNeverClose')
  };
}

function initPopupLayout() {
  scheduleExpandedHeightUpdate();
  window.addEventListener('resize', scheduleExpandedHeightUpdate);
  setListCollapsedState();
}

function scheduleExpandedHeightUpdate() {
  requestAnimationFrame(updateExpandedHeight);
}

function debouncedRefresh(delay = 150) {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  refreshTimeout = setTimeout(() => {
    refreshUi();
    refreshTimeout = null;
  }, delay);
}

function updateExpandedHeight() {
  const refs = context.refs;
  const safeHidden = refs.urlListSection?.classList.contains('hidden');
  const neverCloseHidden = refs.neverCloseListSection?.classList.contains('hidden');
  const anyListOpen = !safeHidden || !neverCloseHidden;
  const height = anyListOpen ? POPUP_EXPANDED_HEIGHT : POPUP_COLLAPSED_HEIGHT;
  setPopupHeight(height);
}

function setPopupHeight(height) {
  document.documentElement.style.setProperty('--popup-expanded-height', `${height}px`);
}

function setListCollapsedState() {
  const refs = context.refs;
  const safeHidden = refs.urlListSection?.classList.contains('hidden');
  const neverCloseHidden = refs.neverCloseListSection?.classList.contains('hidden');
  const anyListOpen = !safeHidden || !neverCloseHidden;
  const shouldCollapse = !anyListOpen;
  document.documentElement.classList.toggle('list-collapsed', shouldCollapse);
  document.body.classList.toggle('list-collapsed', shouldCollapse);
}

async function restoreSettings() {
  const refs = context.refs;
  const isOpen = await getUIState(UI_STATE_KEYS.LIST_OPEN);
  refs.urlListSection?.classList.toggle('hidden', !isOpen);
  updateToggleIndicator(isOpen);

  const isNeverCloseOpen = await getUIState(UI_STATE_KEYS.NEVER_CLOSE_LIST_OPEN);
  refs.neverCloseListSection?.classList.toggle('hidden', !isNeverCloseOpen);
  updateNeverCloseToggleIndicator(isNeverCloseOpen);

  setListCollapsedState();

  const alwaysCloseDupes = await getUIState(UI_STATE_KEYS.ALWAYS_CLOSE_DUPES);
  if (refs.alwaysCloseDupesCheckbox) {
    refs.alwaysCloseDupesCheckbox.checked = Boolean(alwaysCloseDupes);
  }

  const alwaysCloseBookmarked = await getUIState(UI_STATE_KEYS.ALWAYS_CLOSE_BOOKMARKED);
  if (refs.alwaysCloseBookmarkedCheckbox) {
    refs.alwaysCloseBookmarkedCheckbox.checked = Boolean(alwaysCloseBookmarked);
  }
}

function wireEvents() {
  const refs = context.refs;

  refs.toggleListLink?.addEventListener('click', (event) => {
    event.preventDefault();
    toggleListSection();
  });

  refs.alwaysCloseDupesCheckbox?.addEventListener('change', async () => {
    const value = Boolean(refs.alwaysCloseDupesCheckbox?.checked);
    await setUIState(UI_STATE_KEYS.ALWAYS_CLOSE_DUPES, value);
    await highlightMatchingTabs();
    await chrome.runtime.sendMessage({ action: 'updateBadge' });
  });

  refs.alwaysCloseBookmarkedCheckbox?.addEventListener('change', async () => {
    const value = Boolean(refs.alwaysCloseBookmarkedCheckbox?.checked);
    await setUIState(UI_STATE_KEYS.ALWAYS_CLOSE_BOOKMARKED, value);
    await highlightMatchingTabs();
    await chrome.runtime.sendMessage({ action: 'updateBadge' });
  });

  refs.addCurrentUrlButton?.addEventListener('click', () => handleAddCurrentUrl());
  refs.addAllTabsButton?.addEventListener('click', () => handleAddAllTabs());
  refs.closeTabsButton?.addEventListener('click', () => handleCloseTabsClick());
  refs.tileTabsButton?.addEventListener('click', () => handleTileTabsClick());

  refs.toggleNeverCloseListLink?.addEventListener('click', (event) => {
    event.preventDefault();
    toggleNeverCloseListSection();
  });
  refs.addCurrentUrlToNeverCloseButton?.addEventListener('click', () => handleAddCurrentUrlToNeverClose());

  document.addEventListener('keydown', handleOptionKeyDown);
  document.addEventListener('keyup', handleOptionKeyUp);

  window.addEventListener('beforeunload', () => clearHighlightedTabs());
  document.addEventListener('visibilitychange', () => handleVisibilityChange());
}

function handleOptionKeyDown(event) {
  if (event.key !== 'Alt' || context.state.isOptionPressed) {
    return;
  }
  context.state.isOptionPressed = true;
  document.body.classList.add('option-pressed');
  updateOptionButtonText();
}

function handleOptionKeyUp(event) {
  if (event.key !== 'Alt') {
    return;
  }
  context.state.isOptionPressed = false;
  document.body.classList.remove('option-pressed');
  updateOptionButtonText();
}

function updateOptionButtonText() {
  const refs = context.refs;
  const pressed = context.state.isOptionPressed;
  if (refs.addCurrentUrlButton) {
    refs.addCurrentUrlButton.textContent = pressed ? OPTION_TEXT.ADD_SINGLE_ALT : OPTION_TEXT.ADD_SINGLE_DEFAULT;
  }
  if (refs.addAllTabsButton) {
    refs.addAllTabsButton.textContent = pressed ? OPTION_TEXT.ADD_ALL_ALT : OPTION_TEXT.ADD_ALL_DEFAULT;
  }
}

async function toggleListSection() {
  const refs = context.refs;
  const section = refs.urlListSection;
  if (!section) {
    return;
  }
  const nextIsOpen = await toggleUIState(UI_STATE_KEYS.LIST_OPEN);
  section.classList.toggle('hidden', !nextIsOpen);
  setListCollapsedState();
  updateToggleIndicator(nextIsOpen);
  scheduleExpandedHeightUpdate();
}

async function toggleNeverCloseListSection() {
  const refs = context.refs;
  const section = refs.neverCloseListSection;
  if (!section) {
    return;
  }
  const nextIsOpen = await toggleUIState(UI_STATE_KEYS.NEVER_CLOSE_LIST_OPEN);
  section.classList.toggle('hidden', !nextIsOpen);
  setListCollapsedState();
  updateNeverCloseToggleIndicator(nextIsOpen);
  scheduleExpandedHeightUpdate();
}

async function handleAddCurrentUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    return;
  }
  const pattern = toPatternFromTabUrl(tab.url);
  await removeNeverCloseUrl(pattern);
  await addSafeUrl(pattern);
  await refreshUi();

  if (context.state.isOptionPressed && typeof tab.id === 'number') {
    await chrome.tabs.remove(tab.id);
  }
  await chrome.runtime.sendMessage({ action: 'updateBadge' });
}

async function handleAddAllTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const patterns = tabs
    .map((tab) => toPatternFromTabUrl(tab.url))
    .filter(Boolean);

  await addSafeUrls(patterns);
  await refreshUi();

  if (context.state.isOptionPressed) {
    await chrome.runtime.sendMessage({ action: 'closeTabs' });
    await clearHighlightedTabs();
  }
  await chrome.runtime.sendMessage({ action: 'updateBadge' });
}

async function handleAddCurrentUrlToNeverClose() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    return;
  }
  const pattern = toPatternFromTabUrl(tab.url);
  await removeSafeUrl(pattern);
  await addNeverCloseUrl(pattern);
  await refreshUi();
  await chrome.runtime.sendMessage({ action: 'updateBadge' });
}

async function handleCloseTabsClick() {
  await chrome.runtime.sendMessage({ action: 'closeTabs' });
  await clearHighlightedTabs();
  await refreshUi();
}

async function updateAddCurrentUrlButtonState() {
  const refs = context.refs;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const pattern = tab?.url ? toPatternFromTabUrl(tab.url) : null;

  if (refs.addCurrentUrlButton) {
    const safeUrls = pattern ? await getSafeUrls() : [];
    const isInSafe = pattern && safeUrls.includes(pattern);
    refs.addCurrentUrlButton.disabled = Boolean(isInSafe);
    refs.addCurrentUrlButton.classList.toggle('opacity-50', Boolean(isInSafe));
    refs.addCurrentUrlButton.classList.toggle('cursor-not-allowed', Boolean(isInSafe));
  }

  if (refs.addCurrentUrlToNeverCloseButton) {
    const neverCloseUrls = pattern ? await getNeverCloseUrls() : [];
    const isInNeverClose = pattern && neverCloseUrls.includes(pattern);
    refs.addCurrentUrlToNeverCloseButton.disabled = Boolean(isInNeverClose);
    refs.addCurrentUrlToNeverCloseButton.classList.toggle('opacity-50', Boolean(isInNeverClose));
    refs.addCurrentUrlToNeverCloseButton.classList.toggle('cursor-not-allowed', Boolean(isInNeverClose));
  }
}

async function refreshUi() {
  await renderUrlList();
  await renderNeverCloseList();
  await updateMatchingTabsCount();
  await highlightMatchingTabs();
  await updateAddCurrentUrlButtonState();
  await chrome.runtime.sendMessage({ action: 'updateBadge' });
  scheduleExpandedHeightUpdate();
}

async function renderUrlList() {
  const refs = context.refs;
  if (!refs.urlList) {
    return;
  }

  const safeUrls = await getSafeUrls();
  const sorted = safeUrls.slice().sort((a, b) => String(a).localeCompare(String(b)));
  const tabs = await chrome.tabs.query({});
  const items = sorted.map((url) => ({
    url,
    isOpen: tabs.some((tab) => tab.url && matchesUrlPattern(tab.url, String(url || '')))
  }));

  // Track duplicates and mark only first instance
  const urlToTabsMap = new Map();
  tabs.forEach((tab) => {
    if (!tab.url) return;
    safeUrls.forEach((pattern) => {
      if (matchesUrlPattern(tab.url, String(pattern || ''))) {
        if (!urlToTabsMap.has(pattern)) {
          urlToTabsMap.set(pattern, []);
        }
        urlToTabsMap.get(pattern).push(tab);
      }
    });
  });

  openCounts = new Map();
  urlToTabsMap.forEach((tabList, pattern) => {
    openCounts.set(pattern, tabList.length);
  });

  const groups = groupByDomain(items);
  refs.urlList.innerHTML = '';

  groups.forEach((group) => {
    refs.urlList.appendChild(createDomainHeader(group.domain));
    group.items.forEach((item) => refs.urlList.appendChild(createDomainEntry(item, urlToTabsMap.get(item.url) || [])));
  });

  // appendImportExportButtons();
}

function groupByDomain(items) {
  const map = new Map();
  items.forEach((item) => {
    const { hostname } = parseUrlParts(item.url);
    const key = String(hostname || item.url || '').toLowerCase();
    if (!map.has(key)) {
      map.set(key, { domain: hostname || item.url, items: [] });
    }
    map.get(key).items.push(item);
  });
  return Array.from(map.values()).sort((a, b) => String(a.domain).localeCompare(String(b.domain)));
}

function createDomainHeader(domain) {
  const header = document.createElement('li');
  header.className = 'flex items-center gap-2 text-sm text-gray-500 mt-3 mb-0 px-1';

  const favicon = document.createElement('img');
  favicon.src = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=https://${encodeURIComponent(domain)}&size=16`;
  favicon.alt = '';
  favicon.className = 'w-4 h-4 flex-none';
  favicon.title = domain;

  const label = document.createElement('span');
  label.textContent = domain;
  label.title = domain;

  header.appendChild(favicon);
  header.appendChild(label);
  return header;
}

function createDomainEntry(item, matchingTabs = []) {
  const li = document.createElement('li');
  const count = matchingTabs.length;
  // Only show 🔴 for the first instance, not for all duplicates
  const dots = count > 0 ? '🔴' : '';
  li.innerHTML = `
    <div class="url-item flex items-center gap-2 pl-8 pr-2 py-1.5">
      <span class="url-text flex-1 truncate whitespace-nowrap" role="button" tabindex="0" data-url="${escapeHtml(item.url)}" title="${escapeHtml(item.url)}">${parseUrlParts(item.url).displayPath}</span>
      <span class="flex-none w-4 text-center">${dots ? `<span class="open-tag">${dots}</span>` : ''}</span>
      <button class="protect-btn flex-none px-1 text-xs text-gray-400 hover:text-red-600" data-url="${escapeHtml(item.url)}" title="Move to never-close list">&#x1F6E1;</button>
      <button class="delete-btn flex-none px-1" data-url="${escapeHtml(item.url)}" title="Remove this pattern">
        <img src="icons/bin-darker.svg" alt="Remove" class="w-4 h-4 mx-auto" />
      </button>
    </div>
  `;

  const urlText = li.querySelector('.url-text');
  const protectBtn = li.querySelector('.protect-btn');
  const deleteBtn = li.querySelector('.delete-btn');
  if (urlText) {
    attachUrlInteractions(urlText, item.url);
  }
  if (protectBtn) {
    protectBtn.addEventListener('click', () => handleMoveToNeverClose(item.url));
  }
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => handleDeleteUrl(item.url));
  }
  return li;
}

function attachUrlInteractions(element, url) {
  const open = () => openUrlInNewTab(url);
  element.addEventListener('click', open);
  element.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  });
}

async function handleDeleteUrl(url) {
  await removeSafeUrl(url);
  await refreshUi();
  await chrome.runtime.sendMessage({ action: 'updateBadge' });
}

async function handleDeleteNeverCloseUrl(url) {
  await removeNeverCloseUrl(url);
  await refreshUi();
  await chrome.runtime.sendMessage({ action: 'updateBadge' });
}

async function handleMoveToNeverClose(url) {
  await removeSafeUrl(url);
  await addNeverCloseUrl(url);
  await refreshUi();
  await chrome.runtime.sendMessage({ action: 'updateBadge' });
}

async function handleMoveToSafeClose(url) {
  await removeNeverCloseUrl(url);
  await addSafeUrl(url);
  await refreshUi();
  await chrome.runtime.sendMessage({ action: 'updateBadge' });
}

async function renderNeverCloseList() {
  const refs = context.refs;
  if (!refs.neverCloseList) {
    return;
  }

  const neverCloseUrls = await getNeverCloseUrls();
  const sorted = neverCloseUrls.slice().sort((a, b) => String(a).localeCompare(String(b)));
  const items = sorted.map((url) => ({ url }));

  const groups = groupByDomain(items);
  refs.neverCloseList.innerHTML = '';

  groups.forEach((group) => {
    refs.neverCloseList.appendChild(createDomainHeader(group.domain));
    group.items.forEach((item) => refs.neverCloseList.appendChild(createNeverCloseEntry(item)));
  });
}

function createNeverCloseEntry(item) {
  const li = document.createElement('li');
  li.innerHTML = `
    <div class="url-item flex items-center gap-2 pl-8 pr-2 py-1.5">
      <span class="url-text flex-1 truncate whitespace-nowrap" role="button" tabindex="0" data-url="${escapeHtml(item.url)}" title="${escapeHtml(item.url)}">${parseUrlParts(item.url).displayPath}</span>
      <button class="move-btn flex-none px-1 text-xs text-gray-400 hover:text-green-600" data-url="${escapeHtml(item.url)}" title="Move to safe-to-close list">&#x2713;</button>
      <button class="delete-btn flex-none px-1" data-url="${escapeHtml(item.url)}" title="Remove this pattern">
        <img src="icons/bin-darker.svg" alt="Remove" class="w-4 h-4 mx-auto" />
      </button>
    </div>
  `;

  const urlText = li.querySelector('.url-text');
  const moveBtn = li.querySelector('.move-btn');
  const deleteBtn = li.querySelector('.delete-btn');
  if (urlText) {
    attachUrlInteractions(urlText, item.url);
  }
  if (moveBtn) {
    moveBtn.addEventListener('click', () => handleMoveToSafeClose(item.url));
  }
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => handleDeleteNeverCloseUrl(item.url));
  }
  return li;
}

function appendImportExportButtons() {
  const list = context.refs.urlList;
  if (!list) {
    return;
  }
  let container = document.getElementById('importExportContainer');
  if (!container) {
    container = document.createElement('li');
    container.id = 'importExportContainer';
    container.className = 'flex justify-end gap-2 pt-2';

    const importButton = document.createElement('button');
    importButton.id = 'importList';
    importButton.title = 'Import URLs from file';
    importButton.className = 'bg-gray-200 text-gray-900 border border-gray-300 py-1 px-3 rounded hover:bg-gray-300 transition';
    importButton.textContent = 'Import';
    importButton.addEventListener('click', () => handleImportClick(importButton));
    container.appendChild(importButton);

    const exportButton = document.createElement('button');
    exportButton.id = 'exportList';
    exportButton.title = 'Export your list to file';
    exportButton.className = 'bg-gray-200 text-gray-900 border border-gray-300 py-1 px-3 rounded hover:bg-gray-300 transition';
    exportButton.textContent = 'Export';
    exportButton.addEventListener('click', () => handleExportClick(exportButton));
    container.appendChild(exportButton);
  }
  list.appendChild(container);
}

async function handleExportClick(button) {
  const safeUrls = await getSafeUrls();
  if (safeUrls.length === 0) {
    return;
  }
  const content = safeUrls.map((url) => String(url)).join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'autoclose-whitelist.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  const current = button.textContent;
  button.textContent = 'Exported!';
  setTimeout(() => (button.textContent = current), 1500);
}

async function handleImportClick(button) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt,.json';
  input.style.display = 'none';

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const urls = text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (urls.length > 0) {
        await addSafeUrls(urls);
        await refreshUi();
        await chrome.runtime.sendMessage({ action: 'updateBadge' });

        const current = button.textContent;
        button.textContent = 'Imported!';
        setTimeout(() => (button.textContent = current), 1500);
      }
    } catch (error) {
      console.error('Error importing URL list:', error);
    }
    document.body.removeChild(input);
  });

  document.body.appendChild(input);
  input.click();
}

async function updateMatchingTabsCount() {
  const refs = context.refs;
  if (!refs.closeTabsButton || !refs.closeTabsText) {
    return;
  }
  const [safeUrls, neverCloseUrls] = await Promise.all([getSafeUrls(), getNeverCloseUrls()]);
  const tabs = await chrome.tabs.query({});
  const matches = findMatchingTabs(tabs, safeUrls).filter(
    (tab) => !neverCloseUrls.some((p) => matchesUrlPattern(tab.url, String(p || '')))
  );
  const count = matches.length;

  if (count === 0) {
    refs.closeTabsText.textContent = 'No tabs to close';
    refs.closeTabsButton.disabled = true;
    return;
  }

  const plural = count === 1 ? '' : 's';
  refs.closeTabsText.textContent = `Close ${count} matching tab${plural}`;
  refs.closeTabsButton.disabled = false;
}

async function highlightMatchingTabs() {
  const [safeUrls, neverCloseUrls] = await Promise.all([getSafeUrls(), getNeverCloseUrls()]);
  const tabs = await chrome.tabs.query({});
  const matching = findMatchingTabs(tabs, safeUrls).filter(
    (tab) => !neverCloseUrls.some((p) => matchesUrlPattern(tab.url, String(p || '')))
  );
  const matchingIds = new Set(matching.map((tab) => tab.id).filter((id) => typeof id === 'number'));
  const highlighted = new Set(matchingIds);

  const dupeEnabled = await getUIState(UI_STATE_KEYS.ALWAYS_CLOSE_DUPES);
  if (dupeEnabled) {
    const dupeIds = getDuplicateTabIds(tabs);
    dupeIds.forEach((id) => highlighted.add(id));
  }

  const bookmarkedEnabled = await getUIState(UI_STATE_KEYS.ALWAYS_CLOSE_BOOKMARKED);
  if (bookmarkedEnabled) {
    const bookmarks = await getAllBookmarks();
    const bookmarkUrls = bookmarks.map(b => b.normalizedUrl);
    const bookmarkedTabs = findBookmarkedTabs(tabs, bookmarkUrls);
    const blankTabs = findBlankTabs(tabs);
    bookmarkedTabs.forEach((tab) => {
      if (typeof tab.id === 'number') highlighted.add(tab.id);
    });
    blankTabs.forEach((tab) => {
      if (typeof tab.id === 'number') highlighted.add(tab.id);
    });
  }

  await clearHighlightedTabs();

  if (highlighted.size === 0) {
    return;
  }

  context.state.highlightedTabIds = Array.from(highlighted);

  context.state.highlightedTabIds.forEach((id) => {
    if (!id) {
      return;
    }
    const level = matchingIds.has(id) ? 1 : 2;
    chrome.tabs.sendMessage(id, { action: 'setTabWarning', enabled: true, level });
  });
}

async function clearHighlightedTabs() {
  const ids = context.state.highlightedTabIds || [];
  context.state.highlightedTabIds = [];
  ids.forEach((id) => {
    if (!id) {
      return;
    }
    chrome.tabs.sendMessage(id, { action: 'setTabWarning', enabled: false });
  });
}

function setupTabListeners() {
  const refresh = () => debouncedRefresh();

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (!changeInfo) {
      return;
    }
    if (typeof changeInfo.url === 'string' || changeInfo.status === 'complete') {
      refresh();
    }
  });

  chrome.tabs.onRemoved.addListener(refresh);
  chrome.tabs.onCreated.addListener(refresh);
}

async function handleVisibilityChange() {
  if (document.hidden) {
    await clearHighlightedTabs();
    return;
  }
  debouncedRefresh(100);
}

async function openUrlInNewTab(url) {
  let target = String(url || '');
  if (!/^https?:\/\//i.test(target)) {
    target = `https://${target}`;
  }
  await chrome.tabs.create({ url: target });
}


async function handleTileTabsClick() {
  const tabs = await chrome.tabs.query({});

  // Confirm for many tabs
  if (tabs.length > 10) {
    const button = context.refs.tileTabsButton;
    if (button) {
      button.textContent = `Tile ${tabs.length} tabs?`;
      button.classList.add('bg-orange-200');
      setTimeout(() => {
        button.textContent = 'Tile all tabs';
        button.classList.remove('bg-orange-200');
      }, 2000);
      return;
    }
  }

  await chrome.runtime.sendMessage({ action: 'tileTabs' });
  window.close();
}

async function initialize() {
  try {
    collectRefs();
    initPopupLayout();
    await restoreSettings();
    wireEvents();
    await refreshUi();
    setupTabListeners();
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
}

document.addEventListener('DOMContentLoaded', initialize);
