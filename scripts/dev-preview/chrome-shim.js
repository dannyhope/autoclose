(() => {
  const storageKey = 'autoclose-dev-storage';
  const defaultStorage = {
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

  function loadStore() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        return { ...defaultStorage, ...JSON.parse(raw) };
      }
    } catch {
      // Use defaults when localStorage is unavailable or corrupt.
    }
    return { ...defaultStorage };
  }

  function saveStore(store) {
    localStorage.setItem(storageKey, JSON.stringify(store));
  }

  let tabs = [
    {
      id: 1,
      url: 'file:///Users/dannyhope/Desktop/Tagsonomy/index.html',
      title: 'Tagsonomy',
      active: true,
      windowId: 1
    },
    {
      id: 2,
      url: 'https://affiliate-program.amazon.co.uk/home',
      title: 'Amazon Associates',
      active: false,
      windowId: 1
    },
    {
      id: 3,
      url: 'https://news.bbc.co.uk/',
      title: 'BBC News',
      active: false,
      windowId: 1
    }
  ];
  let nextTabId = 4;

  const tabListeners = {
    updated: [],
    removed: [],
    created: []
  };

  function eventApi(list) {
    return {
      addListener(fn) {
        list.push(fn);
      },
      removeListener(fn) {
        const index = list.indexOf(fn);
        if (index >= 0) {
          list.splice(index, 1);
        }
      }
    };
  }

  function withCallback(result, callback) {
    if (typeof callback === 'function') {
      queueMicrotask(() => callback(result));
      return undefined;
    }
    return Promise.resolve(result);
  }

  globalThis.chrome = {
    runtime: {
      id: 'dev-preview',
      lastError: undefined,
      getURL(resourcePath) {
        return new URL(resourcePath, location.href).href;
      },
      sendMessage() {
        return Promise.resolve({});
      },
      onMessage: {
        addListener() {},
        removeListener() {}
      }
    },
    storage: {
      sync: {
        get(keys, callback) {
          const store = loadStore();
          let out = {};
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
        set(values, callback) {
          saveStore({ ...loadStore(), ...values });
          return withCallback(undefined, callback);
        }
      }
    },
    tabs: {
      query(info = {}, callback) {
        const query = typeof info === 'function' ? {} : info;
        const cb = typeof info === 'function' ? info : callback;
        let result = [...tabs];
        if (query.active) {
          result = result.filter((tab) => tab.active);
        }
        if (query.currentWindow || query.lastFocusedWindow) {
          result = result.filter((tab) => tab.windowId === 1);
        }
        return withCallback(result, cb);
      },
      remove(id, callback) {
        const ids = Array.isArray(id) ? id : [id];
        tabs = tabs.filter((tab) => !ids.includes(tab.id));
        ids.forEach((removedId) => {
          tabListeners.removed.forEach((fn) => fn(removedId));
        });
        return withCallback(undefined, callback);
      },
      create({ url } = {}, callback) {
        const tab = {
          id: nextTabId,
          url,
          title: url,
          active: false,
          windowId: 1
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
      getTree(callback) {
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
        return Promise.resolve();
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

  const rewriteFavicons = () => {
    document.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (!src.includes('_favicon/') || img.dataset.devFavicon === '1') {
        return;
      }
      img.dataset.devFavicon = '1';
      try {
        const pageUrl = new URL(src, location.href).searchParams.get('pageUrl');
        if (!pageUrl) {
          return;
        }
        const parsed = new URL(pageUrl);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          img.src = `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=16`;
        }
      } catch {
        img.hidden = true;
      }
    });
  };

  new MutationObserver(rewriteFavicons).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
