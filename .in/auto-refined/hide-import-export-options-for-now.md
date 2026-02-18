# Hide Import/Export options for now
**Readiness:** auto-refined
**Roadmap:** now

Screenshot shows Import and Export buttons in the popup footer that should be hidden temporarily.

![Screenshot](<../.in/autoclose- hide import :export options for now.png>)

## Auto-investigation
**Investigated:** 2026-02-18

### Findings
- Import/Export buttons are dynamically created in `appendImportExportButtons()` at `src/js/popup.js:374–402`
- Called from `renderUrlList()` at line 296 — appended to the bottom of the URL list
- Export handler (`handleExportClick`, lines 404–423) saves URLs to `autoclose-whitelist.txt`
- Import handler (`handleImportClick`, lines 425–460) reads `.txt` or `.json` files
- No existing feature flag or visibility toggle for these buttons
- The feature was recently implemented (replacing clipboard copy/paste) per `.in/closed/replace-copy-paste-with-import-export.md`

### Scope
- **Files to change:** `src/js/popup.js` — comment out or guard the call to `appendImportExportButtons()` at line 296
- **Estimated complexity:** small
- **Approach options:**
  1. Comment out the single `appendImportExportButtons()` call in `renderUrlList()` — simplest, easily reversible
  2. Add a feature flag in `ui-state.js` to toggle visibility — more structured but heavier for a temporary hide
  3. Wrap in a `DEV_MODE` or `SHOW_IMPORT_EXPORT` constant — middle ground

### Questions for refinement
1. Should the code be commented out (quick, temporary) or gated behind a feature flag (cleaner, easy to re-enable)?
2. Should the handler functions (`handleExportClick`, `handleImportClick`, `appendImportExportButtons`) be left in place, or removed entirely?

### Documentation impact
- _(none — cosmetic/UI visibility change, no behaviour change)_

### Related items
- `.in/closed/replace-copy-paste-with-import-export.md` — **predecessor** (the feature being hidden was built by this task)
- `.in/auto-refined/later/publish-to-chrome-web-store.md` — **complementary** (mentions import/export in screenshots section — hiding buttons may affect store listing screenshots)
