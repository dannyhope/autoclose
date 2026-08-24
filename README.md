# Auto-close tabs

You tell it which tabs you often have open which you consider always safe to close and it gives you a button to close them all at once.

## Architecture overview

- **Manifest (MV3)**: `src/manifest.json` wires the popup UI, background service worker, and content script. Permissions: `tabs`, `storage`, `bookmarks`, `favicon`.
- **Popup UI**: `src/popup.html` + `src/js/popup.js` render the list of safe patterns, expose buttons to add/close tabs, and persist UI settings via the centralised UI-state module.
- **Background service worker**: `src/js/background.js` receives close requests, matches tabs against stored patterns, and enforces duplicate-closing and bookmark-closing rules.
- **Full list page**: `src/full-list.html` + `src/js/full-list.js` provide a larger review surface with status indicators and timestamps.
- **Content script**: `src/js/tab-warning.js` adds a visual warning prefix to tab titles when the popup is open, so you can see which tabs would be closed.
- **Storage model**: Sync storage keys are `safeUrls` (array of strings), and UI settings managed through `src/js/lib/ui-state.js` (`alwaysCloseDupes`, `alwaysCloseBookmarked`, `listToggleState`). Storage access helpers plus schema versioning live in `src/js/lib/storage.js`.

## Install / run locally

You can try this extension before it's in the Chrome Web Store:

1. Download [Autoclose.zip](https://dannyhope.co.uk/autoclose/source)
2. Unzip it
3. Open Chrome
4. Select Window > Extensions
5. Toggle dev mode on (the switch is in the top right of the Extensions page)
6. Choose Load unpacked
7. Pick the `src` folder in the autoclose directory
8. The icon should appear
9. Right click the icon and select Pin

## Build, test, debug

- **Build**: No bundler — HTML files reference scripts directly. Load the raw `src` folder as described above.
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
