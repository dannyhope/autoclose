import browser from 'webextension-polyfill';

export const extensionApi = browser;

export function sendTabMessage(tabId: number, message: any): Promise<any> {
  return browser.tabs.sendMessage(tabId, message).catch(() => undefined);
}

export function runtimeMessage(message: any): Promise<any> {
  return browser.runtime.sendMessage(message);
}

export function setBadgeText(text: string): Promise<void> {
  return browser.action.setBadgeText({ text });
}

export function setBadgeBackgroundColor(color: string): Promise<void> {
  return browser.action.setBadgeBackgroundColor({ color });
}

export function isUnsupportedUrl(url?: string): boolean {
  return /^(?:chrome|edge|about|moz-extension|safari-web-extension|file):/i.test(String(url || ''));
}
