import browser from 'webextension-polyfill';

export const STORAGE_KEYS = {
  SAFE_URLS: 'safeUrls',
  NEVER_CLOSE_URLS: 'neverCloseUrls',
  ALWAYS_CLOSE_DUPES: 'alwaysCloseDupes',
  ALWAYS_CLOSE_BOOKMARKED: 'alwaysCloseBookmarked',
  LIST_TOGGLE_STATE: 'listToggleState',
  NEVER_CLOSE_LIST_TOGGLE_STATE: 'neverCloseListToggleState'
};

const STORAGE_VERSION_KEY = 'storageVersion';
const STORAGE_VERSION = 1;

async function storageGet<T = any>(keys: string | string[]): Promise<Record<string, T>> {
  const result = await browser.storage.sync.get(keys);
  return result || {};
}

async function storageSet(values: Record<string, any>): Promise<void> {
  await browser.storage.sync.set(values);
}

export async function ensureStorageVersion(): Promise<number> {
  const result = await storageGet<number>([STORAGE_VERSION_KEY]);
  if (typeof result[STORAGE_VERSION_KEY] !== 'number') {
    await storageSet({ [STORAGE_VERSION_KEY]: STORAGE_VERSION });
    return STORAGE_VERSION;
  }
  return result[STORAGE_VERSION_KEY];
}

export async function getSafeUrls(): Promise<string[]> {
  await ensureStorageVersion();
  const result = await storageGet<string[]>([STORAGE_KEYS.SAFE_URLS]);
  return result[STORAGE_KEYS.SAFE_URLS] || [];
}

export async function setSafeUrls(urls: string[]): Promise<void> {
  await storageSet({ [STORAGE_KEYS.SAFE_URLS]: urls });
}

export async function addSafeUrls(urlsToAdd: string[] = []): Promise<void> {
  if (!urlsToAdd.length) {
    return;
  }
  await ensureStorageVersion();
  const current = await getSafeUrls();
  const seen = new Set(current);
  const additions: string[] = [];

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

export async function addSafeUrl(url: string): Promise<void> {
  if (!url) {
    return;
  }
  await addSafeUrls([url]);
}

export async function removeSafeUrl(url: string): Promise<void> {
  const current = await getSafeUrls();
  const next = current.filter((item) => item !== url);
  await setSafeUrls(next);
}

export async function getNeverCloseUrls(): Promise<string[]> {
  await ensureStorageVersion();
  const result = await storageGet<string[]>([STORAGE_KEYS.NEVER_CLOSE_URLS]);
  return result[STORAGE_KEYS.NEVER_CLOSE_URLS] || [];
}

export async function setNeverCloseUrls(urls: string[]): Promise<void> {
  await storageSet({ [STORAGE_KEYS.NEVER_CLOSE_URLS]: urls });
}

export async function addNeverCloseUrls(urlsToAdd: string[] = []): Promise<void> {
  if (!urlsToAdd.length) {
    return;
  }
  await ensureStorageVersion();
  const current = await getNeverCloseUrls();
  const seen = new Set(current);
  const additions: string[] = [];

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

export async function addNeverCloseUrl(url: string): Promise<void> {
  if (!url) {
    return;
  }
  await addNeverCloseUrls([url]);
}

export async function removeNeverCloseUrl(url: string): Promise<void> {
  const current = await getNeverCloseUrls();
  const next = current.filter((item) => item !== url);
  await setNeverCloseUrls(next);
}

export async function getSetting(key: string, fallback: any = false): Promise<any> {
  await ensureStorageVersion();
  const result = await storageGet([key]);
  if (!(key in result)) {
    return fallback;
  }
  return result[key];
}

export async function setSetting(key: string, value: any): Promise<void> {
  await storageSet({ [key]: value });
}

export { STORAGE_VERSION, STORAGE_VERSION_KEY };
