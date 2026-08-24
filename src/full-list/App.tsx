import { useEffect, useState } from 'react';
import { PopupFooter } from '@/components/popup-footer';
import { getSafeUrls } from '../js/lib/storage.js';
import { matchesUrlPattern, parseUrlParts } from '../js/lib/url-utils.js';

type ListItem = {
  url: string;
  display: string;
  isOpen: boolean;
};

export function FullListApp() {
  const [status, setStatus] = useState('');
  const [items, setItems] = useState<ListItem[]>([]);
  const [stamp, setStamp] = useState('');

  useEffect(() => {
    setStamp(new Date().toLocaleString());
    (async () => {
      try {
        const [safeUrls, tabs] = await Promise.all([getSafeUrls(), chrome.tabs.query({})]);
        if (!safeUrls.length) {
          setStatus('Your list is empty. Add some URLs from the popup first.');
          setItems([]);
          return;
        }
        const next = safeUrls.map((url: string) => {
          const isOpen = tabs.some(
            (tab) => tab.url && matchesUrlPattern(tab.url, String(url || ''))
          );
          const parts = parseUrlParts(url);
          return {
            url,
            display: `${parts.hostname || ''}${parts.displayPath}`,
            isOpen
          };
        });
        next.sort((a: ListItem, b: ListItem) => {
          if (a.isOpen !== b.isOpen) {
            return a.isOpen ? -1 : 1;
          }
          return a.display.localeCompare(b.display);
        });
        setItems(next);
        const openCount = next.filter((item: ListItem) => item.isOpen).length;
        setStatus(`${openCount} of ${next.length} pattern(s) are currently open in some tab.`);
      } catch {
        setStatus('There was a problem loading the full list.');
      }
    })();
  }, []);

  return (
    <div className="mx-auto flex min-h-screen w-[480px] flex-col bg-background p-4 text-sm text-foreground">
      <h1 className="mb-2 text-lg font-semibold">Tabs that would be auto-closed</h1>
      <p className="mb-4 text-xs text-muted-foreground">
        Showing every URL pattern in your list, and whether it is currently open.
      </p>
      <div className="mb-2 text-xs text-muted-foreground">{status}</div>
      <ul className="m-0 flex-1 list-none space-y-1 p-0">
        {items.map((item) => (
          <li
            key={item.url}
            className={`flex items-center justify-between rounded px-2 py-1 ${
              item.isOpen ? 'bg-[#D7FBC9] text-[#006300]' : 'bg-muted text-muted-foreground'
            }`}
          >
            <span className="mr-2 truncate">{item.display}</span>
            <span className="text-[11px] font-medium">{item.isOpen ? 'open' : 'not open'}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Green items are currently open. Grey items are not open.</span>
        <span>{stamp}</span>
      </div>
      <PopupFooter />
    </div>
  );
}
