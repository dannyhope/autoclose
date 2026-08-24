const STORAGE_KEY = 'autoclose-dev-storage';

const defaultStore: Record<string, unknown> = {
  storageVersion: 1,
  safeUrls: [
    '/Users/dannyhope/Desktop/Tagsonomy/index.html',
    'affiliate-program.amazon.co.uk'
  ],
  neverCloseUrls: [],
  alwaysCloseDupes: true,
  alwaysCloseBookmarked: true,
  listToggleState: true,
  neverCloseListToggleState: false
};

type Tab = chrome.tabs.Tab;

function loadStore(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...defaultStore, ...JSON.parse(raw) };
    }
  } catch {
    // Use defaults when localStorage is unavailable or corrupt.
  }
  return { ...defaultStore };
}

function saveStore(store: Record<string, unknown>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

let tabs: Tab[] = [
  {
    id: 1,
    url: 'file:///Users/dannyhope/Desktop/Tagsonomy/index.html',
    title: 'Tagsonomy',
    active: true,
    windowId: 1,
    index: 0,
    pinned: false,
    highlighted: false,
    incognito: false,
    selected: true,
    discarded: false,
    autoDiscardable: true,
    groupId: -1
  },
  {
    id: 2,
    url: 'https://affiliate-program.amazon.co.uk/home',
    title: 'Amazon Associates',
    active: false,
    windowId: 1,
    index: 1,
    pinned: false,
    highlighted: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1
  },
  {
    id: 3,
    url: 'https://www.bbc.co.uk/news',
    title: 'BBC News',
    active: false,
    windowId: 1,
    index: 2,
    pinned: false,
    highlighted: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1
  }
];
let nextTabId = 4;

const tabListeners = {
  updated: [] as Array<(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: Tab) => void>,
  removed: [] as Array<(tabId: number) => void>,
  created: [] as Array<(tab: Tab) => void>
};

function eventApi<T extends (...args: never[]) => void>(list: T[]) {
  return {
    addListener(fn: T) {
      list.push(fn);
    },
    removeListener(fn: T) {
      const index = list.indexOf(fn);
      if (index >= 0) {
        list.splice(index, 1);
      }
    }
  };
}

function withCallback<T>(result: T, callback?: (value: T) => void) {
  if (typeof callback === 'function') {
    queueMicrotask(() => callback(result));
    return undefined;
  }
  return Promise.resolve(result);
}

async function handleRuntimeMessage(message: { action?: string }) {
  if (message?.action === 'closeTabs') {
    const { getSafeUrls, getNeverCloseUrls, getSetting, STORAGE_KEYS } = await import(
      '../js/lib/storage.js'
    );
    const { findMatchingTabs, getDuplicateTabIds } = await import('../js/lib/tab-actions.js');
    const { matchesUrlPattern } = await import('../js/lib/url-utils.js');
    const [safeUrls, neverCloseUrls] = await Promise.all([getSafeUrls(), getNeverCloseUrls()]);
    const matching = findMatchingTabs(tabs, safeUrls).filter(
      (tab: Tab) => !neverCloseUrls.some((pattern: string) => matchesUrlPattern(tab.url, String(pattern || '')))
    );
    const ids = new Set(
      matching.map((tab: Tab) => tab.id).filter((id: number | undefined): id is number => typeof id === 'number')
    );
    if (await getSetting(STORAGE_KEYS.ALWAYS_CLOSE_DUPES, false)) {
      getDuplicateTabIds(tabs).forEach((id: number) => ids.add(id));
    }
    const toRemove = [...ids];
    tabs = tabs.filter((tab) => !toRemove.includes(tab.id as number));
    toRemove.forEach((id) => tabListeners.removed.forEach((fn) => fn(id)));
    return { count: toRemove.length };
  }
  if (message?.action === 'tileTabs') {
    return { success: true, preview: true };
  }
  return { success: true };
}

function installChromeShim() {
  if (typeof globalThis.chrome?.runtime?.id === 'string' && globalThis.chrome.runtime.id !== 'dev-preview') {
    return;
  }

  const chromeShim = {
    runtime: {
      id: 'dev-preview',
      lastError: undefined as chrome.runtime.LastError | undefined,
      getURL(resourcePath: string) {
        return new URL(resourcePath, location.href).href;
      },
      sendMessage(message: { action?: string }, callback?: (response: unknown) => void) {
        return handleRuntimeMessage(message).then((response) => {
          if (typeof callback === 'function') {
            callback(response);
            return undefined;
          }
          return response;
        });
      },
      onMessage: {
        addListener() {},
        removeListener() {}
      }
    },
    storage: {
      sync: {
        get(
          keys?: string | string[] | Record<string, unknown> | null,
          callback?: (items: Record<string, unknown>) => void
        ) {
          const store = loadStore();
          let out: Record<string, unknown> = {};
          if (keys == null) {
            out = { ...store };
          } else if (Array.isArray(keys)) {
            for (const key of keys) {
              if (key in store) {
                out[key] = store[key];
              }
            }
          } else if (typeof keys === 'string') {
            if (keys in store) {
              out[keys] = store[keys];
            }
          } else if (typeof keys === 'object') {
            out = { ...keys };
            for (const key of Object.keys(keys)) {
              if (key in store) {
                out[key] = store[key];
              }
            }
          }
          return withCallback(out, callback);
        },
        set(values: Record<string, unknown>, callback?: () => void) {
          saveStore({ ...loadStore(), ...values });
          return withCallback(undefined, callback);
        }
      }
    },
    tabs: {
      query(info: chrome.tabs.QueryInfo = {}, callback?: (result: Tab[]) => void) {
        let result = [...tabs];
        if (info.active) {
          result = result.filter((tab) => tab.active);
        }
        if (info.currentWindow || info.lastFocusedWindow) {
          result = result.filter((tab) => tab.windowId === 1);
        }
        return withCallback(result, callback);
      },
      remove(id: number | number[], callback?: () => void) {
        const ids = Array.isArray(id) ? id : [id];
        tabs = tabs.filter((tab) => !ids.includes(tab.id as number));
        ids.forEach((removedId) => {
          tabListeners.removed.forEach((fn) => fn(removedId));
        });
        return withCallback(undefined, callback);
      },
      create({ url }: { url?: string } = {}, callback?: (tab: Tab) => void) {
        const tab: Tab = {
          id: nextTabId,
          url,
          title: url,
          active: false,
          windowId: 1,
          index: tabs.length,
          pinned: false,
          highlighted: false,
          incognito: false,
          selected: false,
          discarded: false,
          autoDiscardable: true,
          groupId: -1
        };
        nextTabId += 1;
        tabs.push(tab);
        tabListeners.created.forEach((fn) => fn(tab));
        return withCallback(tab, callback);
      },
      sendMessage() {
        return Promise.resolve();
      },
      onUpdated: eventApi(tabListeners.updated),
      onRemoved: eventApi(tabListeners.removed),
      onCreated: eventApi(tabListeners.created)
    },
    bookmarks: {
      getTree(callback?: (results: chrome.bookmarks.BookmarkTreeNode[]) => void) {
        return withCallback([{ id: '0', title: '', children: [] }], callback);
      }
    },
    windows: {
      getAll() {
        return Promise.resolve([]);
      },
      create() {
        return Promise.resolve({});
      },
      update() {
        return Promise.resolve({});
      },
      remove() {
        return Promise.resolve({});
      }
    },
    action: {
      setBadgeText() {
        return Promise.resolve();
      },
      setBadgeBackgroundColor() {
        return Promise.resolve();
      }
    }
  };

  globalThis.chrome = chromeShim as unknown as typeof chrome;
}

installChromeShim();
