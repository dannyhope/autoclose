# Autoclose — Product Spec

> Living document. Update whenever behaviour changes. Last updated: 2026-08-24.
>
> **This file is the source of truth for how Autoclose should work.**

## Browser support

Autoclose ships one shared WebExtensions implementation with target manifests:
Chrome 120+ uses MV3 service workers, Firefox 109+ uses an MV3 background
script, and Safari 17+ on macOS 14+ uses a signed Safari Web Extension
converted in Xcode. The compatibility layer chooses `browser` or `chrome`
without changing product behaviour. Firefox and Safari use compatibility
wrappers for callback- and promise-style WebExtension APIs; bookmarks and
favicon access fall back quietly when unavailable. If a browser lacks window
management, tile-all-tabs reports unsupported; protected pages and file URLs do
not receive title warnings. Release signing is required for Firefox AMO and
Safari App Store distribution.

## Purpose

Autoclose (Chrome package name **Auto-close tabs**) lets you keep a list of sites you consider always safe to close, then close every matching tab in one click. Closing is always user-initiated. The extension does not close tabs on a timer or in the background without that click.

## Surfaces

| Surface | Role |
|---------|------|
| Toolbar **popup** (`src/popup.html`) | Primary UI: add patterns, close matching tabs, toggles, lists |
| **Service worker** (`src/js/background.js`) | Close matching tabs, tile windows, badge count |
| **Content script** (`src/js/tab-warning.js`) | While the popup is open, prefix matching tab titles so they stand out in the tab strip |
| **Full-list page** (`src/full-list.html`) | Larger review of every safe pattern and whether it is currently open. Present in the package; not wired as `options_page` and not linked from the popup |

There is no side panel.

## Behaviour

### Safe-to-close list

- Patterns persist in `chrome.storage.sync` (`safeUrls`).
- **Add tab to list** stores a pattern derived from the active tab URL.
- Hold **Option/Alt** while adding to add and then close matching tabs.
- **Add all tabs to list** (shown in the expanded chrome) adds every tab in the window; Option/Alt add-and-close applies here too.
- Patterns match loosely (hostname/path prefixes and suffix-style entries). See `src/js/lib/url-utils.js`.
- Removing a row drops that pattern. Lists group by domain only when that domain has more than one pattern; a lone pattern is a single row. File URLs still share “This computer” when there is more than one. Favicons come from Chrome’s favicon API.

### Never-close list

- Separate `neverCloseUrls` list. Matching tabs are **never** closed, even if they also match a safe pattern, duplicates, or bookmarks.
- **Protect this tab** adds the active tab to that list.

### Closing

- **Close *n* matching tabs** asks the service worker to close tabs that match the safe list (minus never-close).
- **Deduplicate tabs:** also close extras that share a URL, keeping one.
- **Close bookmarked:** also close tabs whose URL is bookmarked, plus blank tabs.
- The close button is disabled when the count is zero; the label states how many would close.
- The toolbar **badge** shows that count (orange when non-zero).

### While the popup is open

- Matching tabs get a `🔴` title prefix (level 1). Duplicate/bookmark extras get `🔴🔴` (level 2).
- Prefixes are removed when the popup hides.

### Tile all tabs

- Splits each tab into its own window and tiles those windows in a grid.

### Import / export

- Implemented in popup code but **not shown** (call site commented out). Do not advertise in the store listing until it is visible again.

## Priorities and fallbacks

1. Never close a never-close match.
2. User must click (or Option+add) to close.
3. Sync storage: if sync is unavailable, Chrome falls back to local behaviour of the Storage API; there is no custom cloud.
4. Content-script title prefixes fail silently on pages that cannot receive messages (`chrome://`, Web Store, and similar).

## Data and freshness

- Safe list, never-close list, and UI toggles live in `chrome.storage.sync`. Schema version is `1` (`storageVersion`).
- Badge and close-count refresh on tab create/update/remove.
- No analytics, no developer-operated server, no remote code.

## Non-goals

- Closing tabs automatically without a user action.
- Replacing Chrome’s tab search, groups, or session restore.
- A Plasmo/shadcn rewrite of the existing vanilla popup.
- Shipping import/export in the listing while the controls stay hidden.

## Permissions (declared)

`storage`, `tabs`, `bookmarks`, `favicon`, plus a content script on `http://*/*` and `https://*/*` for title warnings.

## Accessibility

No thought has been given to accessibility.
