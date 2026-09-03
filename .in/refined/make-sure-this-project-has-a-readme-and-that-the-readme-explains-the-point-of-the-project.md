# Make sure this project has a readme and that the readme explains the point of the project.
**Broadcast:** 70795f3f-cdb1-42df-9d2c-e24be4bb4e4b
**Readiness:** refined
**Roadmap:** now

## Auto-investigation
**Investigated:** 2026-08-28

### Findings
- A root `README.md` already exists and clearly explains the project's purpose: the Chrome extension maintains a user-defined list of tabs safe to close and provides a one-click close action.
- The README documents the current MV3 architecture, local preview/install flow, build/test guidance, and feature-flag storage keys.
- Its product description agrees with `_docs/spec.md`, which states that closing is always user-initiated and that the extension is packaged as “Auto-close tabs”.
- Relevant implementation locations include `src/popup/`, `src/js/background.js`, `src/js/tab-warning.js`, `src/full-list/`, and `src/js/lib/`; `_docs/design.md` documents the React/Tailwind/shadcn presentation conventions.
- The repository uses Vite (`package.json`) with preferred development port `5920` (`.dev-port`); the README describes this workflow.

### Scope
- No product-code changes are indicated. If this task is pursued, review or lightly revise only `README.md` to keep its purpose statement aligned with `_docs/spec.md`.
- Estimated complexity: small.
- Docs impact: README-only documentation work; no `_docs/` behaviour or design update is required unless the README's product description changes.

### Questions for refinement
1. **README outcome** Should we leave the README as it is, or add a short explanation of the main workflow and make it clear that Autoclose never closes tabs by itself?

   **Answer:**

### Documentation impact
- `README.md` already exists and covers the project's point; update it only if the desired audience-facing explanation needs to be expanded.
- `_docs/spec.md` and `_docs/design.md` are the living product sources of truth and should remain unchanged for a README clarification.

### Related items
- _(parent will fill)_
