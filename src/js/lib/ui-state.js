import { getSetting, setSetting, STORAGE_KEYS } from './storage.js';

export const UI_STATE_KEYS = {
  LIST_OPEN: 'listOpen',
  ALWAYS_CLOSE_DUPES: 'alwaysCloseDupes',
  ALWAYS_CLOSE_BOOKMARKED: 'alwaysCloseBookmarked'
};

const UI_STATE_CONFIG = {
  [UI_STATE_KEYS.LIST_OPEN]: {
    storageKey: STORAGE_KEYS.LIST_TOGGLE_STATE,
    defaultValue: false
  },
  [UI_STATE_KEYS.ALWAYS_CLOSE_DUPES]: {
    storageKey: STORAGE_KEYS.ALWAYS_CLOSE_DUPES,
    defaultValue: true
  },
  [UI_STATE_KEYS.ALWAYS_CLOSE_BOOKMARKED]: {
    storageKey: STORAGE_KEYS.ALWAYS_CLOSE_BOOKMARKED,
    defaultValue: true
  }
};

function getConfig(key) {
  const config = UI_STATE_CONFIG[key];
  if (!config) {
    throw new Error(`Unknown UI state key: ${key}`);
  }
  return config;
}

export async function getUIState(key) {
  const config = getConfig(key);
  return getSetting(config.storageKey, config.defaultValue);
}

export async function setUIState(key, value) {
  const config = getConfig(key);
  await setSetting(config.storageKey, value);
}

export async function toggleUIState(key) {
  const current = await getUIState(key);
  const next = !current;
  await setUIState(key, next);
  return next;
}

export function getUIStateDefaults() {
  return Object.entries(UI_STATE_CONFIG).reduce((acc, [key, config]) => {
    acc[key] = config.defaultValue;
    return acc;
  }, {});
}
