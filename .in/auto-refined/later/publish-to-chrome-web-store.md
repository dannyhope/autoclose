Autoclose: get it into the Chrome web store. Ask me questions until you have everything the Chrome Web Store might ask for

## Auto-investigation
**Investigated:** 2026-02-13

### Findings

**Current extension state:**
- Name: "Auto-close tabs"
- Version: 1.0 (in `src/manifest.json`)
- Manifest V3 compliant
- Permissions: storage, tabs, bookmarks, favicon
- Icons available: 16px, 48px, 128px, 2048px (in `src/icons/`)
- Data storage: Uses `chrome.storage.sync` for URL list and settings only — **no external data collection**
- Recent work: White List UI, import/export, loose URL matching, footer attribution
- README mentions planned Chrome Web Store submission

**Existing assets:**
- Icons: ✅ 16, 48, 128, 2048px PNGs in `src/icons/`
- Screenshots: ❌ None found for store listing
- Privacy policy: ❌ Not found
- Store listing copy: ❌ Not prepared
- Promotional images: ❌ 440×280 and 920×680 tiles not created

**Data privacy stance (from code review):**
- Extension stores user's "White List" URLs locally via `chrome.storage.sync`
- No analytics, tracking, or external API calls
- No user data leaves the browser
- Syncs via Chrome's built-in sync (Google handles this)

### Scope

**Files that would need creating or modifying:**

1. **Store listing assets** (new files to create):
   - Screenshots (1280×800 or 640×400): need 1-5 showing popup, White List, import/export
   - Promotional images: 440×280 small tile, 920×680 large tile (optional)
   - Privacy policy document (can be markdown + hosted on GitHub, or separate page)

2. **Manifest adjustments** (`src/manifest.json`):
   - Consider bumping version from 1.0 to 1.0.0 (semantic versioning)
   - May want to expand the `description` field (currently 81 chars, could be more compelling)

3. **Store listing content** (written in Chrome Web Store Developer Dashboard):
   - Detailed description (up to 16,000 chars) — can adapt from README
   - Single purpose statement: "Manage a list of URLs safe to auto-close and close matching tabs on demand"
   - Category: Productivity
   - Support email and/or website URL

4. **Privacy disclosure**:
   - Privacy policy URL (required if using storage permission)
   - Data use certification in Developer Dashboard

**Estimated complexity:** Medium (mostly content creation + asset generation, not code changes)

### Questions for refinement

1. **Developer account:** Do you already have a Chrome Web Store developer account, or do you need to register? (One-time $5 fee, requires 2FA)

2. **Privacy policy hosting:** Where should the privacy policy live? Options:
   - GitHub repo (e.g., `PRIVACY.md` at repo root, link to raw or GitHub Pages)
   - Separate website (dannyhope.co.uk?)
   - Simple Google Doc or Notion page

3. **Screenshots:** What key features should screenshots highlight?
   - Popup with White List
   - Adding a URL
   - Closing matching tabs
   - Import/Export feature
   - Settings/options

4. **Extension name:** Keep "Auto-close tabs" or rebrand? (Current manifest says "Auto-close tabs", but repo and references use "Autoclose")

5. **Pricing:** This will be a free extension, correct?

6. **Support contact:** What email should be listed for support? (GitHub Issues link already in footer, but Chrome Web Store requires contact info)

7. **Version strategy:** Publish as v1.0 or bump to v1.0.0 for the Web Store launch?

8. **Target audience:** General users, power users, or specific use case? (Helps frame store description and category)

### Dependencies

- The blog post `blog/posts/2026-01-31-whats-new.md` mentions "We're working on getting Autoclose into the Chrome Web Store" — completing this task resolves that statement
- No blocking tasks found in `.in/` directories