# Hide Import/Export options for now
**Readiness:** built
**Refined:** 2026-02-19
**Roadmap:** now
**Done when:** The Import and Export buttons no longer appear in the popup footer. The handler functions remain in the codebase, ready to uncomment.

Comment out the `appendImportExportButtons()` call in `renderUrlList()` at `src/js/popup.js:296`. Leave all handler functions (`handleExportClick`, `handleImportClick`, `appendImportExportButtons`) in place — this is a temporary hide.

![Screenshot](<../.in/autoclose- hide import :export options for now.png>)
