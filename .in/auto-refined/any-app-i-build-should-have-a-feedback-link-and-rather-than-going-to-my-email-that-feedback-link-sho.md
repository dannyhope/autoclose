Any app I build should have a Feedback link and rather than going to my email that feedback link should go to GitHub issues for that repository this way people's feedback can automatically be processed by AI.

## Implemented

- autoclose (2026-01-30)
- Bombay (2026-01-30)

## Auto-investigation
**Investigated:** 2026-02-09

### Findings
- **Status unclear:** Marked as implemented on 2026-01-30, but no feedback link found in current codebase
- Searched `src/` directory for "feedback", "issues", "github" — no matches in HTML or JS files
- This is a **cross-project guideline task** (applies to all Danny's projects)
- Should be tracked in global CLAUDE.md or as a reusable skill/template, not per-project `.in/` files
- Example implementation needed: Link to `https://github.com/{owner}/{repo}/issues/new` in footer or settings

### Scope
- **For autoclose specifically:**
  - `src/popup.html` — Add feedback link in footer/header
  - `src/full-list.html` — Add feedback link in footer/header
  - `package.json` or `manifest.json` — Verify GitHub repo URL is defined
- **Estimated complexity:** Small (static link addition, no logic needed)

### Questions for refinement
1. Should the feedback link open in a new tab or same tab?
2. Should it pre-fill any information (browser version, extension version, current state)?
3. Where should the link appear: footer, header, settings page, or all of the above?
4. Should this task be **moved to global CLAUDE.md** as a standard requirement rather than living in each project's `.in/` directory?

### Dependencies
- None in autoclose `.in/` directory
- **Recommendation:** Promote this to `~/.claude/CLAUDE.md` "Standard Project Requirements" section
