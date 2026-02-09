Add a "Danny Hope product" in the footer or somewhere else inconspicuous in all my products.

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
1. What exact text/format should be used: "A Danny Hope Product", "Made by Danny Hope", "© Danny Hope", or something else?
2. Should it link to dannyhope.co.uk or a specific products page?
3. How inconspicuous? Font size, colour, placement constraints?
4. Should this task be **moved to global CLAUDE.md** as a standard requirement rather than duplicated across projects?

### Dependencies
- None in autoclose `.in/` directory
- **Recommendation:** Promote this to `~/.claude/CLAUDE.md` "Standard Project Requirements" section alongside feedback link requirement
