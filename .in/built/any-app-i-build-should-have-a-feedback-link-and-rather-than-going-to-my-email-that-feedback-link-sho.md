# Add feedback link to GitHub Issues
**Readiness:** built
**Refined:** 2026-02-17
**Done when:** `popup.html` and `full-list.html` both have a "Feedback" link in the footer that opens `https://github.com/dannyhope/autoclose/issues/new` in a new tab. Plain static link, no pre-filling.

Any app I build should have a Feedback link and rather than going to my email that feedback link should go to GitHub issues for that repository this way people's feedback can automatically be processed by AI.

## Notes
- Previously marked as implemented (2026-01-30) but not found in current codebase
- Plain `<a>` tag, opens in new tab (`target="_blank"`)
- Place in footer alongside the "A Danny Hope product" attribution
