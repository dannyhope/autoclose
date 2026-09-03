# Auto-close tabs

Auto-close tabs is a Chrome extension for quickly clearing away tabs you already know you do not need. You define a list of safe-to-close tabs, review the matches, and use one button to close them all at once. It never closes tabs automatically: closing is always an action you initiate.

## Architecture overview

- **Manifest (MV3)**: `src/manifest.json` wires the popup UI, background service worker, and content script. Permissions: `tabs`, `storage`, `bookmarks`, `favicon`.
- **Popup UI**: React + shadcn in `src/popup/` (entry `src/popup.html`). List logic still uses `src/js/lib`.
- **Background service worker**: `src/js/background.js` receives close requests, matches tabs against stored patterns, and enforces duplicate-closing and bookmark-closing rules.
- **Full list page**: React + shadcn in `src/full-list/` (entry `src/full-list.html`).
- **Content script**: `src/js/tab-warning.js` adds a visual warning prefix to tab titles when the popup is open, so you can see which tabs would be closed.
- **Storage model**: Sync storage keys are `safeUrls` (array of strings), and UI settings managed through `src/js/lib/ui-state.js` (`alwaysCloseDupes`, `alwaysCloseBookmarked`, `listToggleState`). Storage access helpers plus schema versioning live in `src/js/lib/storage.js`.

## Preview the popup

For UI work you do **not** need `chrome://extensions`. From the repo:

```bash
npm run dev
```

That starts Vite with HMR at the preferred port in `.dev-port` (5200–5999). The popup opens in a normal Chrome tab with a fake `chrome.*` API so the lists render. Closing real tabs still needs the unpacked extension.

## Install / run locally

You can try this extension before it's in the Chrome Web Store:

1. Download [Autoclose.zip](https://dannyhope.co.uk/autoclose/source)
2. Unzip it
3. Open Chrome
4. Select Window > Extensions
5. Toggle dev mode on (the switch is in the top right of the Extensions page)
6. Choose Load unpacked
7. Run `npm run build`, then pick the `dist` folder in the autoclose directory
8. The icon should appear
9. Right click the icon and select Pin

## Build, test, debug

- **Build**: `npm run build` writes the bundled popup plus `manifest.json`, `js/`, and `icons/` into `dist/`. Load that folder unpacked.
- **Testing**: Manual for now. Use Chrome's Extensions panel > "service worker" link to view background logs, and DevTools within the popup to inspect storage payloads.
- **Debug mode**: Planned toggle to surface storage state and build timestamps in the popup so screenshots carry context.

## Feature flags / behaviours

| Flag / setting | Storage key | Description |
| --- | --- | --- |
| List section toggle | `listToggleState` | Remembers whether the safe-list accordion is expanded. |
| Deduplicate tabs | `alwaysCloseDupes` | When true, duplicate URLs collapse to a single tab when closing. |
| Close bookmarked | `alwaysCloseBookmarked` | When true, tabs already bookmarked are also closed. |

## Documentation

Supporting docs live in `_docs/`:
- `requirements.md` — product contract
- `tech-debt.md` — current debt + remediation ideas
- `ideas.md` — frameworks, tooling, UX inspirations
- `user-stories.md` — scenarios + moderated testing tasks
- `storage-schema.md` — storage schema and import/export contract
- `architecture.md` — architecture decisions
