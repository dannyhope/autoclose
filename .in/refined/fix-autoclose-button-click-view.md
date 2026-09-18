# Fix autoclose button click view
**Type:** manual
**Readiness:** refined
**Roadmap:** now
**Dictated:** 2026-09-18T08:17:00+01:00
**Source:** session-prompt
**AI investigated:** 2026-09-18
**Helper:** _docs/reload-unpacked.html

## Request
Screenshot of what appears when clicking the autoclose toolbar icon: white vertical capsule with a red circle on lime green. Not the expected popup.

## Diagnosis (2026-09-18)
Chrome Default profile has two unpacked installs:
1. `…/autoclose/src` — Vite source; popup loads `.tsx` which Chrome cannot run
2. `…/autoclose/autoclose-v2/build/chrome-mv3-prod` — folder deleted → broken popup / missing files

Correct package is `dist-chrome/` (rebuilt 2026-09-18).

## Done when
- Old unpacked cards removed
- `dist-chrome/` loaded and pinned
- Toolbar click opens the real popup (lists + Close n matching tabs)

## Evidence
`~/.cursor/projects/Users-dannyhope-Dropbox-Autoclose-browser-plugin-Repos-autoclose/assets/image-6f2f50c6-f3af-4686-88b3-0bc83d32a26e.png`

## AI assistance
- Follow the tickable helper: open `_docs/reload-unpacked.html` in the browser (`file://` — no server needed).
- Before **Load unpacked**, run `npm run build:chrome` in the repo so `dist-chrome/` matches current source (optional if already built today).
- Copy the absolute `dist-chrome` path from the helper’s copy block — Chrome’s folder picker needs the built folder, not `src/`.
- After reload, if the popup still looks wrong, check `chrome://extensions` for duplicate Auto-close cards or Errors on the card.

### How to verify
1. Open `_docs/reload-unpacked.html` and work through each checkbox step.
2. On `chrome://extensions`, confirm exactly one **Auto-close tabs** card with no Errors.
3. Pin the extension, click the toolbar icon — expect the popup with URL lists and **Close n matching tabs** (not a blank capsule or lime/error page).

## Related items
- How Autoclose appears since removing the old version (`.in/closed/how-autoclose-appears-since-removing-old-version.md`) — **duplicate theme** (stale unpacked path / missing build output); superseded by this task’s diagnosis and helper.
- Publish Auto-close tabs to Chrome Web Store (`.in/refined/publish-auto-close-tabs-to-chrome-web-store.md`) — **complementary** (store install avoids local unpacked mistakes once published).
