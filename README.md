# Idea

You tell it which tabs you often have open which you consider always safe to close and it gives you a button to close them all at once.

## Architecture Overview

- **Manifest (MV3)**: `src/manifest.json` wires the popup UI, background service worker, and optional content script. Permissions are limited to `tabs` and `storage`.
- **Popup UI**: `src/popup.html` + `src/js/popup.js` render the list of safe patterns, expose buttons to add/close tabs, and persist UI settings (`listToggleState`, `alwaysCloseDupes`) via the centralized UI-state module.
- **Background service worker**: `src/js/background.js` receives close requests, matches tabs against stored patterns, and enforces duplicate-closing rules.
- **Full list page**: `src/full-list.html` + `src/js/full-list.js` provide a larger review surface with status indicators and timestamps.
- **Storage model**: Sync storage keys are `safeUrls` (array of strings), and UI settings managed through `src/js/lib/ui-state.js` (`alwaysCloseDupes`, `listToggleState`, future toggles). Storage access helpers plus schema versioning live in `src/js/lib/storage.js`.

## Install / Run Locally

You can try this extension before it’s in the Chrome Web Store, by:
1. download Autoclose.zip – https://github.com/dannyhope/autoclose/archive/refs/heads/main.zip  
2. unzip it  
3. open Chrome  
4. select Window > Extensions  
5. toggle dev mode on (the switch is in the top right of the Extensions page)  
6. choose Load unpacked  
7. pick the `src` folder in the autoclose directory  
8. the icon should appear  
9. right click the icon and select Pin

## Build, Test, Debug

- **Build**: No bundler yet—HTML files reference scripts directly. Use the steps above to load the raw `src` folder. When we introduce Vite/Alpine (see `docs/ideas.md`) we’ll add `npm run build`.
- **Testing**: Manual for now. Use Chrome’s Extensions panel → “service worker” link to view background logs, and DevTools within the popup to inspect storage payloads. Testing automation backlog is tracked in `docs/tech-debt.md`.
- **Debug mode**: Planned “development mode” toggle will surface storage state and build timestamps in the popup so screenshots carry context. Until then, rely on console logs and the timestamp footer in modal views.

## Feature Flags / Behaviors

| Flag / Setting | Storage Key | Description |
| --- | --- | --- |
| List section toggle | `listToggleState` | Managed by `ui-state.js`. Remembers whether the safe-list accordion is expanded. |
| Deduplicate tabs | `alwaysCloseDupes` | Managed by `ui-state.js`. When true, duplicate URLs collapse to a single tab any time a close action runs. |
| (Planned) Dev mode HUD | `devModeEnabled` (not yet stored) | Will enable inline debug data per usability-feedback requirements. |

## Documentation

Supporting docs live in `/docs`:
- `requirements.md` – product contract
- `tech-debt.md` – current debt + remediation ideas
- `ideas.md` – frameworks, tooling, UX inspirations
- `user-stories.md` – scenarios + moderated testing tasks
