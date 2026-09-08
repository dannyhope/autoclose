import browser from 'webextension-polyfill';

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_idle',
  main() {
    let tabWarningOriginalTitle = document.title;
    let tabWarningActive = false;

    function stripTabWarningPrefix(title: string): string {
      return String(title || '').replace(/^(🔴\s*){1,2}/, '');
    }

    function getTabWarningPrefix(level: number): string {
      if (level === 2) return '🔴🔴 ';
      if (level === 1) return '🔴 ';
      return '';
    }

    function applyTabWarning(level: number): void {
      const warningLevel = level === 2 ? 2 : 1;
      tabWarningOriginalTitle = stripTabWarningPrefix(document.title);
      document.title = getTabWarningPrefix(warningLevel) + tabWarningOriginalTitle;
      tabWarningActive = true;
    }

    function removeTabWarning(): void {
      if (!tabWarningActive && !document.title.startsWith('🔴')) return;
      const current = document.title;
      const cleaned = stripTabWarningPrefix(current);
      document.title = cleaned || tabWarningOriginalTitle;
      tabWarningActive = false;
    }

    browser.runtime.onMessage.addListener((request) => {
      if (!request || !request.action) return;

      if (request.action === 'setTabWarning') {
        const requestedLevel = typeof request.level === 'number' ? request.level : (request.enabled ? 1 : 0);
        if (requestedLevel >= 1) {
          applyTabWarning(requestedLevel);
          return;
        }
        removeTabWarning();
      }
    });
  }
});
