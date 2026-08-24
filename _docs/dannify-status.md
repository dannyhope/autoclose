# Dannify status — Autoclose

> Living audit. Regenerated whenever `/dannify` runs. Last updated: 2026-08-21.
>
> What still needs doing, then what’s already up to spec. Do not treat this file as product truth — that’s `_docs/spec.md` and `_docs/design.md`.
>
> Detected: vanilla Manifest V3 Chrome extension (`src/manifest.json`). Stack kept. `/browser-extension` fed this audit; Plasmo migration is not listed.

## Improvements

### Must

- Add `_docs/spec.md` covering purpose, surfaces (popup, full-list page, content-script tab warning, background service worker), behaviour, priorities, non-goals, and a living-doc header. `_docs/requirements.md` is not that file and is stale (still names the product “Safe to Close”).
- Add `_docs/design.md` covering how the popup, full-list page, tab-warning overlay, and toolbar icon should look.
- Point public GitHub hrefs through hops: README zip download via `https://dannyhope.co.uk/autoclose` (create the hop); popup and full-list Feedback via the existing `https://dannyhope.co.uk/feedback` hop instead of `github.com/dannyhope/autoclose/issues/new`.
- Add a Chrome Web Store `publish/` pack (`publish/index.html`, MV3 zip, listing copy, screenshots, privacy URL, permission justifications). Inbox already has a ship-to-store task.

### Should

- Add `CLAUDE.md` with vanilla MV3 / load-unpacked development notes.
- State the accessibility level (honest “none” is fine) — in `_docs/spec.md` if that Must is also done.
- Add an Autoclose entry to `/Users/dannyhope/Dropbox/Bombay/projects.json`.
- Add the usability-test scaffold (`_docs/usability-tasks.json` + `usability-test.html`). Think-aloud notes in `_docs/user-stories.md` are not that runner.
- Redraw the toolbar icon as a mid-grey glyph on a transparent background (no light-blue rounded-square tile). `src/icons/icon.svg` currently fills a rounded rect with `#A1DCF4`.

## Already right

- Loadable package is Manifest V3 (`action`, `background.service_worker`)
- README opens with purpose, then load-unpacked steps (`src` folder)
- “A Danny Hope product” in popup and full-list footers → https://dannyhope.co.uk
- `.in/` inbox exists
- `.gitignore` includes `_vibing/` and `.DS_Store`; `_vibing/` directory exists
- `autoclose.code-workspace` exists (Peacock colour set)
- Extra `_docs/` with real content (`requirements.md`, `user-stories.md`, `storage-schema.md`, `tech-debt.md`, `ideas.md`)
- User-facing copy is already British English (no American spellings in labels)
