autoclose should have a blacklist - to just closed multiple https://bbcmic.ro/ windows that all had different things going on in them

## Auto-investigation
**Investigated:** 2026-02-09

### Findings
- Autoclose currently has a **"safe URLs"** feature (inverted blacklist/whitelist) in `src/js/lib/storage.js`
- The term "blacklist" appears to describe wanting to **force-close** specific URLs/patterns, opposite of current "safe URLs" (which prevents closing)
- Current implementation: `getSafeUrls()`, `setSafeUrls()`, `addSafeUrl()`, `removeSafeUrl()`
- URL pattern matching exists: `matchesUrlPattern()` in `src/js/lib/url-utils.js` (supports hostname, pathname, exact match with `$`)
- Example use case: Close multiple `bbcmic.ro` windows automatically (URL shortener that creates many unique URLs)

### Scope
- **Files likely needing changes:**
  - `src/js/lib/storage.js` — Add `BLACKLIST_URLS` storage key and CRUD functions
  - `src/js/background.js` — Apply blacklist logic in tab close automation
  - `src/js/popup.js` — UI for managing blacklist entries
  - `src/popup.html` — Add blacklist section to UI
- **Estimated complexity:** Medium (existing URL pattern matching can be reused, but needs UI and storage mirroring safe URLs implementation)

### Questions for refinement
1. Should blacklisted tabs close **immediately on creation** or only when autoclose runs its duplicate/bookmark check?
2. Should blacklist use the same pattern syntax as safe URLs (hostname + path + optional `$` for exact match)?
3. Should there be a confirmation before closing blacklisted tabs, or silent auto-close?
4. Does "blacklist" mean "always close duplicates of this pattern" or "always close ANY tab matching this pattern (even first instance)"?

### Dependencies
- None identified in `.in/` directory
