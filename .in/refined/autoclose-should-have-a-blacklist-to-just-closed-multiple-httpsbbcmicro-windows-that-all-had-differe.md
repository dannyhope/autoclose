# Add "Never close" list and rename "Safe URLs" to "Safe to close"
**Readiness:** refined
**Refined:** 2026-02-17
**Done when:** Two mutually exclusive URL lists exist — "Safe to close" and "Never close" — with UI for managing both. Tabs matching "Never close" patterns are never autoclosed, even if bookmarked or duplicated. Adding a URL to one list removes it from the other. The old "safe URLs" terminology is replaced throughout.

## Context
Autoclose closed multiple `bbcmic.ro` windows that had different content. User needed a way to protect URL patterns from ever being autoclosed.

## Specification
- **"Safe to close"** (renamed from "safe URLs") — autoclose is allowed to close these
- **"Never close"** (new) — autoclose must never close these, regardless of bookmark/duplicate status
- **Mutual exclusivity:** adding a URL pattern to one list removes it from the other
- Same URL pattern syntax for both lists (hostname, pathname, optional `$` for exact match via existing `matchesUrlPattern()`)
- Works during normal autoclose cycle (not immediate on tab open)

## Scope
- `src/js/lib/storage.js` — Add `NEVER_CLOSE_URLS` storage key and CRUD functions; rename safe URL functions
- `src/js/background.js` — Check "Never close" list during autoclose logic
- `src/js/popup.js` — UI for managing both lists, enforce mutual exclusivity
- `src/popup.html` — Rename "Safe URLs" section, add "Never close" section
- `src/js/lib/url-utils.js` — Reuse existing `matchesUrlPattern()`, no changes expected
