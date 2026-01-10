# Technical Debt & Optimisation Targets

## Recently addressed
- Centralised UI-state persistence (`src/js/lib/ui-state.js`) now owns the popup’s accordion + dupe-toggle state.
- Shared helpers (`storage.js`, `url-utils.js`, `tab-actions.js`) eliminated the inconsistent matching logic across popup/background/full-list.
- README expanded with architecture, storage keys, and docs index; unused CSS bundle removed in favour of `styles/utilities.css`.
- UI consistency improved: white list area now has matching left padding (1rem) with the "Add tab to list" button for visual alignment.

## Remaining opportunities

### Data & Storage
1. **Storage metadata for safe URLs**: `safeUrls` is still a raw array; there’s no room for annotations (labels, tags, timestamps) or migrations beyond version `1`. Define a schema + upgrader so future features don’t require destructive edits.
2. **Bulk import/export contract**: No canonical JSON/CSV schema exists for sharing lists between users (ties into the global “Import/Export” expectation). Specify formats and build helpers so new UI can plug in quickly.

### Architecture & Code Structure
1. **Popup megafile**: `src/js/popup.js` (~500 lines) still mixes DOM wiring, storage orchestration, highlighting, and messaging. Split into focused modules (e.g., `popup-dom`, `popup-actions`, `popup-highlighting`) and keep functions <=3 nesting levels.
2. **UI-state consumers**: Only the popup reads the centralised UI-state API. The background worker still imports `getSetting` directly (@src/js/background.js) and should be switched to `ui-state.js` for parity once more toggles arrive.
3. **Tab-warning lifecycle**: Highlighting relies on a content script injected on every page. Replace the coarse `<http/https>` match list with a targeted opt-in (e.g., origin trials or temporary injection only while the popup is open) to reduce surface area.

### UI & UX polish
1. **Brand system adoption**: Popup still defaults to grey utility styles. Introduce the brand palette + typography rules, ensuring important actions inherit vivid accent colours while the rest remains muted.
2. **Keyboard shortcuts + tooltips audit**: Some buttons have titles, but we lack a documented shortcut layer and consistent tooltip text per the global usability rules.
3. **State persistence beyond popup**: Full-list page and any forthcoming options page do not persist filters/sorting preferences yet; extend the UI-state module to cover them.
4. **Visual consistency audit**: Recently improved list padding alignment, but continue systematic review of spacing, margins, and visual hierarchy across all UI elements.

### Tooling & Automation
1. **Toolchain bootstrap**: No npm scripts, bundler, linting, or formatter exist. Add `npm init`, `eslint`, `prettier`, and a simple `npm run build` that copies `src` to `dist` ahead of adding Vite/Alpine.
2. **Automated tests**: Introduce Web Test Runner (per ideas doc) with at least smoke tests for storage helpers and URL matching.
3. **CI workflow**: Wire GitHub Actions to run lint/tests on push so regressions are caught before manual verification.

### Documentation & Developer Experience
1. **Dev-mode HUD**: Requirements call for a development mode with inline debug data + timestamp footer. Implement the toggle, surface state in the UI, and document how to enable it.
2. **Docs for keyboard shortcuts & persistence**: Add a `/docs/shortcuts.md` (or README section) enumerating shortcuts, tooltips expectations, and saved-state behaviour.
3. **Contributor guide**: Provide a short “Contributing” section describing branching, formatting, and release steps to make the optimisation plan executable by others.
