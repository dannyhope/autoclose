const browserApi = globalThis.browser ?? globalThis.chrome;

export const extensionApi = browserApi;

export function sendTabMessage(tabId, message) {
  return callbackApi(extensionApi.tabs.sendMessage.bind(extensionApi.tabs), tabId, message)
    .catch(() => undefined);
}

export function callbackApi(call, ...args) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    try {
      const result = call(...args, (value) => {
        const error = extensionApi.runtime?.lastError;
        if (error) {
          reject(new Error(error.message));
        } else {
          done(value);
        }
      });
      if (result && typeof result.then === 'function') {
        result.then(done, reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

export function runtimeMessage(message) {
  return callbackApi(extensionApi.runtime.sendMessage.bind(extensionApi.runtime), message);
}

export function isUnsupportedUrl(url) {
  return /^(?:chrome|edge|about|moz-extension|safari-web-extension|file):/i.test(String(url || ''));
}

