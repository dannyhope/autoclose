# How Autoclose appears since removing the old version from the repo
**Readiness:** auto-refined
**Roadmap:** now

Screenshot evidence: [View screenshot](../.in/how autoclose appears since we removed the old version from the repo.png)

The screenshot shows a Chrome browser page displaying "Your file couldn't be accessed — ERR_FILE_NOT_FOUND". This documents the broken visual state of the Autoclose extension after files were reorganised in the repo.

## Auto-investigation
**Investigated:** 2026-02-18

### Findings

**Current extension state:**
- `src/` directory contains v1 extension files: `popup.html`, `full-list.html`, `manifest.json`, `js/` modules
- All referenced files exist on disk (`styles/utilities.css`, `js/popup.js`, `js/full-list.js`, `js/background.js`, `js/tab-warning.js`)
- The Plasmo v2 rebuild (`autoclose-v2/`) was added in commit `a33f535` but is **not present in the current working directory** — it was either never committed fully or removed later
- No `dist/` or `build/` directory exists (no built output)

**Likely cause of ERR_FILE_NOT_FOUND:**
Chrome loads an unpacked extension from a fixed local path. If:
1. The `autoclose-v2/` directory was the loaded extension source and was then deleted from the repo, Chrome loses its files → `ERR_FILE_NOT_FOUND`
2. Or: a tab was open using `chrome-extension://[id]/full-list.html` and the extension was reloaded/removed, breaking the URL

The v1 `src/` files appear intact. If Chrome is pointing at `src/` as the unpacked extension, popup and full-list should still work.

**Scope of issue:**
- This appears to be a dev environment issue (loading the extension as unpacked)
- Not a production issue (extension isn't in the Chrome Web Store yet)
- The screenshot was likely taken as a bug report / state documentation

### Scope
- No files need changing if v1 `src/` is the current canonical source
- If v2 (`autoclose-v2/`) was meant to be the current version, it needs to be committed or rebuilt
- Estimated complexity: small (clarification needed first)

### Questions for refinement
1. **Current version** Which folder should we treat as the version being developed: `src/`, or `autoclose-v2/`?
2. **Folder Chrome used** When the screenshot was taken, which folder had Chrome loaded as the unpacked extension: `src/` or `autoclose-v2/`?
3. **Desired outcome** What should we do next: fix the local extension setup, record this as background information, or take another action?
4. **Still happening?** Can you currently reload and use the extension successfully, or does the file-not-found error still appear?

### Documentation impact
- _(none — likely a dev environment issue, not a behaviour change)_

### Related items
- `publish-to-chrome-web-store.md` (`.in/auto-refined/later/publish-to-chrome-web-store.md`) — **complementary**: the ERR_FILE_NOT_FOUND issue may be resolved once the extension is published to the store rather than loaded as an unpacked extension
- `make-sure-that-the-auto-clowes-plug-in-is-in-the-google-play-store-and-is-shared-with-halil-kaan-tas.md` — **complementary**: same publishing theme

### Suggested renames
1. `investigate-err-file-not-found-after-repo-reorg.md` — outcome-oriented: what the task actually is
2. `fix-unpacked-extension-loading-after-v2-removal.md` — scoped to the likely cause
