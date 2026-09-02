Add a "Danny Hope product" in the footer or somewhere else inconspicuous in all my products.
**Readiness:** built
**Completed:** 2026-02-19
**Done when:** `popup.html` and `full-list.html` both have a subtle footer link "A Danny Hope product" pointing to https://dannyhope.co.uk, styled as muted text that brightens on hover.

## Implemented

- autoclose (2026-01-30)
- Bombay (2026-01-30)

## Auto-investigation
**Investigated:** 2026-02-09

### Findings
- **Status unclear:** Marked as implemented on 2026-01-30, but no "Danny Hope" branding found in current codebase
- Searched `src/` directory for "Danny Hope", "dannyhope" — no matches
- This is a **cross-project branding guideline** (applies to all Danny's projects)
- Similar to feedback link task — should be in global CLAUDE.md as standard requirement
- Examples could include: "A Danny Hope Product", link to dannyhope.co.uk, or subtle signature

### Scope
- **For autoclose specifically:**
  - `src/popup.html` — Add inconspicuous branding in footer
  - `src/full-list.html` — Add inconspicuous branding in footer
  - Consider link to: `https://dannyhope.co.uk` or `https://dannyhope.co.uk/products`
- **Estimated complexity:** Small (static text/link addition)

### Questions for refinement
1. **Attribution text** Which wording should appear in the footer: “A Danny Hope product”, “Made by Danny Hope”, “© Danny Hope”, or another phrase?
2. **Destination** Should the link go to the main Danny Hope website (`dannyhope.co.uk`) or to a specific page, such as the products page?
3. **Visual treatment** How subtle should the link be? For example, should it use small muted text in the footer without drawing attention away from the extension?
4. **Scope** Should this remain a task for Autoclose, or become a shared requirement documented once for all projects?

### Dependencies
- None in autoclose `.in/` directory
- **Recommendation:** Promote this to `~/.claude/CLAUDE.md` "Standard Project Requirements" section alongside feedback link requirement
