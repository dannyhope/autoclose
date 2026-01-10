import { addSafeUrl, addSafeUrls, getSafeUrls, removeSafeUrl, STORAGE_KEYS } from './lib/storage.js';
import { escapeHtml, matchesUrlPattern, parseUrlParts, toPatternFromTabUrl } from './lib/url-utils.js';
import { findMatchingTabs, getDuplicateTabIds } from './lib/tab-actions.js';
import { getUIState, setUIState, toggleUIState, UI_STATE_KEYS } from './lib/ui-state.js';

const POPUP_COLLAPSED_HEIGHT = 125;
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

function collectRefs() {
  context.refs = {
    addCurrentUrlButton: document.getElementById('addCurrentUrl'),
    addAllTabsButton: document.getElementById('addAllTabs'),
    urlList: document.getElementById('urlList'),
    closeTabsButton: document.getElementById('closeTabs'),
    closeTabsText: document.getElementById('closeTabsText'),
    alwaysCloseDupesCheckbox: document.getElementById('alwaysCloseDupes'),
    toggleListLink: document.getElementById('toggleList'),
    urlListSection: document.getElementById('urlListSection')
  };
}

function initPopupLayout() {
  scheduleExpandedHeightUpdate();
  window.addEventListener('resize', scheduleExpandedHeightUpdate);
  setListCollapsedState(false);
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
  const isHidden = refs.urlListSection?.classList.contains('hidden');
  const height = isHidden ? POPUP_COLLAPSED_HEIGHT : POPUP_EXPANDED_HEIGHT;
  setPopupHeight(height);
}

function setPopupHeight(height) {
  document.documentElement.style.setProperty('--popup-expanded-height', `${height}px`);
}

function setListCollapsedState(isListOpen) {
  const shouldCollapse = !isListOpen;
  document.documentElement.classList.toggle('list-collapsed', shouldCollapse);
  document.body.classList.toggle('list-collapsed', shouldCollapse);
}

async function restoreSettings() {
  const refs = context.refs;
  const isOpen = await getUIState(UI_STATE_KEYS.LIST_OPEN);
  refs.urlListSection?.classList.toggle('hidden', !isOpen);
  updateToggleIndicator(isOpen);
  setListCollapsedState(isOpen);

  const alwaysCloseDupes = await getUIState(UI_STATE_KEYS.ALWAYS_CLOSE_DUPES);
  if (refs.alwaysCloseDupesCheckbox) {
    refs.alwaysCloseDupesCheckbox.checked = Boolean(alwaysCloseDupes);
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

  refs.addCurrentUrlButton?.addEventListener('click', () => handleAddCurrentUrl());
  refs.addAllTabsButton?.addEventListener('click', () => handleAddAllTabs());
  refs.closeTabsButton?.addEventListener('click', () => handleCloseTabsClick());

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
  setListCollapsedState(nextIsOpen);
  updateToggleIndicator(nextIsOpen);
  scheduleExpandedHeightUpdate();
}

async function handleAddCurrentUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    return;
  }
  const pattern = toPatternFromTabUrl(tab.url);
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

async function handleCloseTabsClick() {
  await chrome.runtime.sendMessage({ action: 'closeTabs' });
  await clearHighlightedTabs();
  await refreshUi();
}

async function updateAddCurrentUrlButtonState() {
  const refs = context.refs;
  if (!refs.addCurrentUrlButton) {
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    refs.addCurrentUrlButton.disabled = false;
    refs.addCurrentUrlButton.classList.remove('opacity-50', 'cursor-not-allowed');
    return;
  }

  const pattern = toPatternFromTabUrl(tab.url);
  const safeUrls = await getSafeUrls();
  const isAlreadyInList = safeUrls.includes(pattern);

  if (isAlreadyInList) {
    refs.addCurrentUrlButton.disabled = true;
    refs.addCurrentUrlButton.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    refs.addCurrentUrlButton.disabled = false;
    refs.addCurrentUrlButton.classList.remove('opacity-50', 'cursor-not-allowed');
  }
}

async function refreshUi() {
  await renderUrlList();
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
  console.log('DEBUG: Retrieved safeUrls:', safeUrls);
  const sorted = safeUrls.slice().sort((a, b) => String(a).localeCompare(String(b)));
  console.log('DEBUG: Sorted URLs:', sorted);
  const tabs = await chrome.tabs.query({});
  const items = sorted.map((url) => ({
    url,
    isOpen: tabs.some((tab) => tab.url && matchesUrlPattern(tab.url, String(url || '')))
  }));
  console.log('DEBUG: Items with isOpen flag:', items);

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

  appendCopyListButton();
}

function groupByDomain(items) {
  const map = new Map();
  items.forEach((item) => {
    const { hostname } = parseUrlParts(item.url);
    const key = String(hostname || item.url || '').toLowerCase();
    console.log('DEBUG: Grouping item:', item.url, '-> hostname:', hostname, '-> key:', key);
    if (!map.has(key)) {
      map.set(key, { domain: hostname || item.url, items: [] });
    }
    map.get(key).items.push(item);
  });
  const groups = Array.from(map.values()).sort((a, b) => String(a.domain).localeCompare(String(b.domain)));
  console.log('DEBUG: Final groups:', groups);
  return groups;
}

function createDomainHeader(domain) {
  const header = document.createElement('li');
  header.className = 'flex items-center gap-2 text-sm text-gray-500 mt-3 mb-0 px-1';

  const favicon = document.createElement('img');
  favicon.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=16`;
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
      <button class="delete-btn flex-none px-1" data-url="${escapeHtml(item.url)}" title="Remove this pattern">
        <img src="icons/bin-darker.svg" alt="Remove" class="w-4 h-4 mx-auto" />
      </button>
    </div>
  `;

  const urlText = li.querySelector('.url-text');
  const deleteBtn = li.querySelector('.delete-btn');
  if (urlText) {
    attachUrlInteractions(urlText, item.url);
  }
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => handleDeleteUrl(item.url));
  }
  return li;
}

function createDeleteButton(url) {
  const button = document.createElement('button');
  button.className = 'delete-btn flex-none px-1';
  button.dataset.url = url;
  button.title = 'Remove this pattern';
  const icon = document.createElement('img');
  icon.src = 'icons/bin-darker.svg';
  icon.alt = 'Remove';
  icon.className = 'w-4 h-4 mx-auto';
  button.appendChild(icon);
  button.addEventListener('click', () => handleDeleteUrl(url));
  return button;
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

function appendCopyListButton() {
  const list = context.refs.urlList;
  if (!list) {
    return;
  }
  let container = document.getElementById('copyListContainer');
  if (!container) {
    container = document.createElement('li');
    container.id = 'copyListContainer';
    container.className = 'flex justify-end pt-2';
    const button = document.createElement('button');
    button.id = 'copyList';
    button.title = 'Copy your list to clipboard';
    button.className = 'bg-gray-200 text-gray-900 border border-gray-300 py-1 px-3 rounded hover:bg-gray-300 transition';
    button.textContent = 'Copy list';
    button.addEventListener('click', () => handleCopyListClick(button));
    container.appendChild(button);
  }
  list.appendChild(container);
}

async function handleCopyListClick(button) {
  const safeUrls = await getSafeUrls();
  const blob = safeUrls.map((url) => String(url)).join('\n');
  try {
    await navigator.clipboard.writeText(blob);
    const current = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => (button.textContent = current), 1500);
  } catch (error) {
    console.error('Error copying URL list:', error);
  }
}

async function updateMatchingTabsCount() {
  const refs = context.refs;
  if (!refs.closeTabsButton || !refs.closeTabsText) {
    return;
  }
  const safeUrls = await getSafeUrls();
  const tabs = await chrome.tabs.query({});
  const matches = findMatchingTabs(tabs, safeUrls);
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
  const safeUrls = await getSafeUrls();
  if (!safeUrls.length) {
    await clearHighlightedTabs();
    return;
  }

  const tabs = await chrome.tabs.query({});
  const matching = findMatchingTabs(tabs, safeUrls);
  const matchingIds = new Set(matching.map((tab) => tab.id).filter((id) => typeof id === 'number'));
  const highlighted = new Set(matchingIds);

  const dupeEnabled = await getUIState(UI_STATE_KEYS.ALWAYS_CLOSE_DUPES);
  if (dupeEnabled) {
    const dupeIds = getDuplicateTabIds(tabs);
    dupeIds.forEach((id) => highlighted.add(id));
  }

  await clearHighlightedTabs();
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

function initialize() {
  collectRefs();
  initPopupLayout();
  restoreSettings().then(() => {
    wireEvents();
    refreshUi();
    setupTabListeners();
  });
}

document.addEventListener('DOMContentLoaded', initialize);
