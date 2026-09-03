import { callbackApi, extensionApi } from './browser-api.js';

const STORAGE_KEYS = {
  SAFE_URLS: 'safeUrls',
  NEVER_CLOSE_URLS: 'neverCloseUrls',
  ALWAYS_CLOSE_DUPES: 'alwaysCloseDupes',
  ALWAYS_CLOSE_BOOKMARKED: 'alwaysCloseBookmarked',
  LIST_TOGGLE_STATE: 'listToggleState',
  NEVER_CLOSE_LIST_TOGGLE_STATE: 'neverCloseListToggleState'
};

const STORAGE_VERSION_KEY = 'storageVersion';
const STORAGE_VERSION = 1;

function storageGet(keys) {
  return callbackApi(extensionApi.storage.sync.get.bind(extensionApi.storage.sync), keys)
    .then((result) => result || {});
}

function storageSet(values) {
  return callbackApi(extensionApi.storage.sync.set.bind(extensionApi.storage.sync), values);
}

export async function ensureStorageVersion() {
  const result = await storageGet([STORAGE_VERSION_KEY]);
  if (typeof result[STORAGE_VERSION_KEY] !== 'number') {
    await storageSet({ [STORAGE_VERSION_KEY]: STORAGE_VERSION });
    return STORAGE_VERSION;
  }
  return result[STORAGE_VERSION_KEY];
}

export async function getSafeUrls() {
  await ensureStorageVersion();
  const result = await storageGet([STORAGE_KEYS.SAFE_URLS]);
  return result[STORAGE_KEYS.SAFE_URLS] || [];
}

export async function setSafeUrls(urls) {
  await storageSet({ [STORAGE_KEYS.SAFE_URLS]: urls });
}

export async function addSafeUrls(urlsToAdd = []) {
  if (!urlsToAdd.length) {
    return;
  }
  await ensureStorageVersion();
  const current = await getSafeUrls();
  const seen = new Set(current);
  const additions = [];

  for (const url of urlsToAdd) {
    if (!url || seen.has(url)) {
      continue;
    }
    seen.add(url);
    additions.push(url);
  }

  if (!additions.length) {
    return;
  }

  await setSafeUrls([...additions, ...current]);
}

export async function addSafeUrl(url) {
  if (!url) {
    return;
  }
  await addSafeUrls([url]);
}

export async function removeSafeUrl(url) {
  const current = await getSafeUrls();
  const next = current.filter((item) => item !== url);
  await setSafeUrls(next);
}

export async function getNeverCloseUrls() {
  await ensureStorageVersion();
  const result = await storageGet([STORAGE_KEYS.NEVER_CLOSE_URLS]);
  return result[STORAGE_KEYS.NEVER_CLOSE_URLS] || [];
}

export async function setNeverCloseUrls(urls) {
  await storageSet({ [STORAGE_KEYS.NEVER_CLOSE_URLS]: urls });
}

export async function addNeverCloseUrls(urlsToAdd = []) {
  if (!urlsToAdd.length) {
    return;
  }
  await ensureStorageVersion();
  const current = await getNeverCloseUrls();
  const seen = new Set(current);
  const additions = [];

  for (const url of urlsToAdd) {
    if (!url || seen.has(url)) {
      continue;
    }
    seen.add(url);
    additions.push(url);
  }

  if (!additions.length) {
    return;
  }

  await setNeverCloseUrls([...additions, ...current]);
}

export async function addNeverCloseUrl(url) {
  if (!url) {
    return;
  }
  await addNeverCloseUrls([url]);
}

export async function removeNeverCloseUrl(url) {
  const current = await getNeverCloseUrls();
  const next = current.filter((item) => item !== url);
  await setNeverCloseUrls(next);
}

export async function getSetting(key, fallback = false) {
  await ensureStorageVersion();
  const result = await storageGet([key]);
  if (!(key in result)) {
    return fallback;
  }
  return result[key];
}

export async function setSetting(key, value) {
  await storageSet({ [key]: value });
}

export { STORAGE_KEYS, STORAGE_VERSION, STORAGE_VERSION_KEY };
