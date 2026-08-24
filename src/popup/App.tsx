import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PopupFooter } from '@/components/popup-footer';
import { UrlList } from '@/components/url-list';
import { groupByDomain, type UrlItem } from '@/lib/url-groups';
import { cn } from '@/lib/utils';
import {
  addSafeUrl,
  addSafeUrls,
  getSafeUrls,
  removeSafeUrl,
  addNeverCloseUrl,
  getNeverCloseUrls,
  removeNeverCloseUrl
} from '../js/lib/storage.js';
import { matchesUrlPattern, toPatternFromTabUrl } from '../js/lib/url-utils.js';
import { findMatchingTabs, getDuplicateTabIds } from '../js/lib/tab-actions.js';
import { getUIState, setUIState, UI_STATE_KEYS } from '../js/lib/ui-state.js';
import { getAllBookmarks, findBookmarkedTabs, findBlankTabs } from '../js/lib/bookmark-utils.js';

const OPTION_TEXT = {
  addSingle: 'Add tab to list',
  addSingleAlt: 'Add tab to list and close',
  addAll: 'Add all tabs to list',
  addAllAlt: 'Add all tabs to list and close'
};

export function App() {
  const [safeGroups, setSafeGroups] = useState<ReturnType<typeof groupByDomain>>([]);
  const [neverCloseGroups, setNeverCloseGroups] = useState<ReturnType<typeof groupByDomain>>([]);
  const [listOpen, setListOpen] = useState(false);
  const [neverCloseOpen, setNeverCloseOpen] = useState(false);
  const [closeBookmarked, setCloseBookmarked] = useState(true);
  const [dedupeTabs, setDedupeTabs] = useState(true);
  const [optionPressed, setOptionPressed] = useState(false);
  const [matchingCount, setMatchingCount] = useState(0);
  const [currentInSafe, setCurrentInSafe] = useState(false);
  const [currentInNeverClose, setCurrentInNeverClose] = useState(false);
  const [tileConfirm, setTileConfirm] = useState<string | null>(null);
  const highlightedIds = useRef<number[]>([]);
  const anyListOpen = listOpen || neverCloseOpen;

  const clearHighlights = useCallback(() => {
    highlightedIds.current.forEach((id) => {
      chrome.tabs.sendMessage(id, { action: 'setTabWarning', enabled: false });
    });
    highlightedIds.current = [];
  }, []);

  const refresh = useCallback(async () => {
    const [nextSafe, nextNeverClose, tabs] = await Promise.all([
      getSafeUrls(),
      getNeverCloseUrls(),
      chrome.tabs.query({})
    ]);

    const safeItems: UrlItem[] = nextSafe
      .slice()
      .sort((a: string, b: string) => a.localeCompare(b))
      .map((url: string) => {
        const matchingTabs = tabs.filter(
          (tab) => tab.url && matchesUrlPattern(tab.url, String(url || ''))
        );
        return { url, matchingTabs, isOpen: matchingTabs.length > 0 };
      });
    setSafeGroups(groupByDomain(safeItems));
    setNeverCloseGroups(
      groupByDomain(
        nextNeverClose
          .slice()
          .sort((a: string, b: string) => a.localeCompare(b))
          .map((url: string) => ({ url }))
      )
    );

    const matches = findMatchingTabs(tabs, nextSafe).filter(
      (tab: chrome.tabs.Tab) =>
        !nextNeverClose.some((pattern: string) => matchesUrlPattern(tab.url, String(pattern || '')))
    );
    setMatchingCount(matches.length);

    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    const pattern = active?.url ? toPatternFromTabUrl(active.url) : null;
    setCurrentInSafe(Boolean(pattern && nextSafe.includes(pattern)));
    setCurrentInNeverClose(Boolean(pattern && nextNeverClose.includes(pattern)));

    const matchingIds = new Set(
      matches
        .map((tab: chrome.tabs.Tab) => tab.id)
        .filter((id): id is number => typeof id === 'number')
    );
    const nextHighlighted = new Set(matchingIds);
    if (await getUIState(UI_STATE_KEYS.ALWAYS_CLOSE_DUPES)) {
      getDuplicateTabIds(tabs).forEach((id: number) => nextHighlighted.add(id));
    }
    if (await getUIState(UI_STATE_KEYS.ALWAYS_CLOSE_BOOKMARKED)) {
      const bookmarks = await getAllBookmarks();
      const bookmarkUrls = bookmarks.map(
        (bookmark: { normalizedUrl: string }) => bookmark.normalizedUrl
      );
      findBookmarkedTabs(tabs, bookmarkUrls).forEach((tab: chrome.tabs.Tab) => {
        if (typeof tab.id === 'number') {
          nextHighlighted.add(tab.id);
        }
      });
      findBlankTabs(tabs).forEach((tab: chrome.tabs.Tab) => {
        if (typeof tab.id === 'number') {
          nextHighlighted.add(tab.id);
        }
      });
    }

    clearHighlights();
    highlightedIds.current = Array.from(nextHighlighted);
    highlightedIds.current.forEach((id) => {
      chrome.tabs.sendMessage(id, {
        action: 'setTabWarning',
        enabled: true,
        level: matchingIds.has(id) ? 1 : 2
      });
    });
    await chrome.runtime.sendMessage({ action: 'updateBadge' });
  }, [clearHighlights]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [open, neverOpen, dupes, bookmarked] = await Promise.all([
        getUIState(UI_STATE_KEYS.LIST_OPEN),
        getUIState(UI_STATE_KEYS.NEVER_CLOSE_LIST_OPEN),
        getUIState(UI_STATE_KEYS.ALWAYS_CLOSE_DUPES),
        getUIState(UI_STATE_KEYS.ALWAYS_CLOSE_BOOKMARKED)
      ]);
      if (cancelled) {
        return;
      }
      setListOpen(Boolean(open));
      setNeverCloseOpen(Boolean(neverOpen));
      setDedupeTabs(Boolean(dupes));
      setCloseBookmarked(Boolean(bookmarked));
      await refresh();
    })();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Alt') {
        setOptionPressed(true);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Alt') {
        setOptionPressed(false);
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        clearHighlights();
      } else {
        refresh();
      }
    };
    const debounced = () => {
      window.setTimeout(() => refresh(), 150);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('visibilitychange', onVisibility);
    chrome.tabs.onUpdated.addListener(debounced);
    chrome.tabs.onRemoved.addListener(debounced);
    chrome.tabs.onCreated.addListener(debounced);
    return () => {
      cancelled = true;
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('visibilitychange', onVisibility);
      chrome.tabs.onUpdated.removeListener(debounced);
      chrome.tabs.onRemoved.removeListener(debounced);
      chrome.tabs.onCreated.removeListener(debounced);
      clearHighlights();
    };
  }, [clearHighlights, refresh]);

  useEffect(() => {
    document.documentElement.classList.toggle('list-collapsed', !anyListOpen);
    document.body.classList.toggle('list-collapsed', !anyListOpen);
  }, [anyListOpen]);

  async function handleAddCurrent() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) {
      return;
    }
    const pattern = toPatternFromTabUrl(tab.url);
    await removeNeverCloseUrl(pattern);
    await addSafeUrl(pattern);
    await refresh();
    if (optionPressed && typeof tab.id === 'number') {
      await chrome.tabs.remove(tab.id);
    }
    await chrome.runtime.sendMessage({ action: 'updateBadge' });
  }

  async function handleAddAll() {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const patterns = tabs.map((tab) => toPatternFromTabUrl(tab.url)).filter(Boolean);
    await addSafeUrls(patterns);
    await refresh();
    if (optionPressed) {
      await chrome.runtime.sendMessage({ action: 'closeTabs' });
      clearHighlights();
    }
    await chrome.runtime.sendMessage({ action: 'updateBadge' });
  }

  async function handleProtectCurrent() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) {
      return;
    }
    const pattern = toPatternFromTabUrl(tab.url);
    await removeSafeUrl(pattern);
    await addNeverCloseUrl(pattern);
    await refresh();
    await chrome.runtime.sendMessage({ action: 'updateBadge' });
  }

  async function handleCloseTabs() {
    await chrome.runtime.sendMessage({ action: 'closeTabs' });
    clearHighlights();
    await refresh();
  }

  async function handleTileTabs() {
    const tabs = await chrome.tabs.query({});
    if (tabs.length > 10 && !tileConfirm) {
      setTileConfirm(`Tile ${tabs.length} tabs?`);
      window.setTimeout(() => setTileConfirm(null), 2000);
      return;
    }
    setTileConfirm(null);
    await chrome.runtime.sendMessage({ action: 'tileTabs' });
    window.close();
  }

  const closeLabel = useMemo(() => {
    if (matchingCount === 0) {
      return 'No tabs to close';
    }
    return `Close ${matchingCount} matching tab${matchingCount === 1 ? '' : 's'}`;
  }, [matchingCount]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-3 px-4 pt-4 pb-3">
        <div className={cn('grid gap-3', optionPressed ? 'grid-cols-1' : 'grid-cols-2')}>
          <Button
            type="button"
            className="h-auto w-full py-3 font-semibold"
            title="Add the active tab to your list (hold Option/Alt to add and then close)"
            disabled={currentInSafe}
            onClick={handleAddCurrent}
          >
            {optionPressed ? OPTION_TEXT.addSingleAlt : OPTION_TEXT.addSingle}
          </Button>
          {optionPressed ? null : (
            <Button
              type="button"
              className="h-auto w-full py-3 font-semibold disabled:bg-[#F0F2F2] disabled:text-[#8C979C]"
              title="Close all tabs that match any pattern in your list"
              disabled={matchingCount === 0}
              onClick={handleCloseTabs}
            >
              {closeLabel}
            </Button>
          )}
        </div>
        <div className={cn('grid gap-3', anyListOpen ? 'grid-cols-2' : 'grid-cols-1')}>
          <Button
            type="button"
            size="sm"
            className={cn('w-full font-semibold', tileConfirm && 'bg-orange-200')}
            title="Separate each tab into its own window and tile them in a grid"
            onClick={handleTileTabs}
          >
            {tileConfirm ?? 'Tile all tabs'}
          </Button>
          {anyListOpen ? (
            <Button
              type="button"
              size="sm"
              className="w-full font-semibold"
              title="Add all tabs in this window to your list (hold Option/Alt to add and then close)"
              onClick={handleAddAll}
            >
              {optionPressed ? OPTION_TEXT.addAllAlt : OPTION_TEXT.addAll}
            </Button>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="flex items-center gap-2" title="When closing, also close tabs that are already bookmarked">
            <Checkbox
              checked={closeBookmarked}
              onCheckedChange={async (checked) => {
                const value = Boolean(checked);
                setCloseBookmarked(value);
                await setUIState(UI_STATE_KEYS.ALWAYS_CLOSE_BOOKMARKED, value);
                await refresh();
              }}
            />
            <span>Close bookmarked</span>
          </label>
          <label className="flex items-center gap-2" title="When closing, also close all but one duplicate tab (by URL)">
            <Checkbox
              checked={dedupeTabs}
              onCheckedChange={async (checked) => {
                const value = Boolean(checked);
                setDedupeTabs(value);
                await setUIState(UI_STATE_KEYS.ALWAYS_CLOSE_DUPES, value);
                await refresh();
              }}
            />
            <span>Deduplicate tabs</span>
          </label>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <UrlList
          title="Safe to close websites"
          open={listOpen}
          onOpenChange={async (next) => {
            setListOpen(next);
            await setUIState(UI_STATE_KEYS.LIST_OPEN, next);
          }}
          groups={safeGroups}
          onDelete={async (url) => {
            await removeSafeUrl(url);
            await refresh();
          }}
          onMove={async (url) => {
            await removeSafeUrl(url);
            await addNeverCloseUrl(url);
            await refresh();
          }}
          moveTitle="Move to never-close list"
          moveIcon="protect"
        />
        <UrlList
          title="Never close websites"
          open={neverCloseOpen}
          onOpenChange={async (next) => {
            setNeverCloseOpen(next);
            await setUIState(UI_STATE_KEYS.NEVER_CLOSE_LIST_OPEN, next);
          }}
          groups={neverCloseGroups}
          headerAction={
            <Button
              type="button"
              variant="protect"
              size="xs"
              title="Protect the active tab from being autoclosed"
              disabled={currentInNeverClose}
              onClick={handleProtectCurrent}
            >
              Protect this tab
            </Button>
          }
          onDelete={async (url) => {
            await removeNeverCloseUrl(url);
            await refresh();
          }}
          onMove={async (url) => {
            await removeNeverCloseUrl(url);
            await addSafeUrl(url);
            await refresh();
          }}
          moveTitle="Move to safe-to-close list"
          moveIcon="safe"
        />
      </div>

      <PopupFooter />
    </div>
  );
}
