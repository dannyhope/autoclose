# Ideas

## Future Features (from archived projects)
- **Closie integration**: Add ability to close tabs that are already bookmarked (bookmark-aware tab closing)
- **Tabble integration**: Add window tiling functionality to separate tabs into individual windows arranged in a grid layout

## Frameworks & Libraries
- **Alpine.js + minimal build step**: drop heavy custom DOM wiring in `popup.js` by adopting Alpine for declarative state while avoiding a full SPA rewrite.
- **Vite build pipeline**: introduces modern bundling, TypeScript opt-in (if ever needed), and hot reload for popup/background scripts while remaining lightweight.
- **Web Test Runner + Chrome Extension test harness**: enables automated UI regression tests against the popup without brittle Selenium setups.

## Tools & Services
- **Chrome Storage Inspector tooling**: document usage of Chrome DevTools > Extensions > Service Worker inspector to debug sync storage and background logs.
- **GitHub issue templates + Discussions**: integrate "Submit feedback" link (per product rules) with issue template for quick repro dumps, screenshots, and build timestamp confirmation.
- **Feature-voting microservice**: lightweight JSON store (e.g., Supabase) or Airtable to back the "Vote on features" requirement without building infrastructure.

## Architecture & Patterns
- **Central state module**: introduce a storage gateway that tracks `safeUrls`, `alwaysCloseDupes`, and UI toggles with change listeners, so popup/background/full-list stay in sync.
- **Pattern compiler**: pre-compile URL patterns into normalized matchers (suffix match, pathname-only, regex-ready) to reduce runtime branching and enable future regex support.
- **Domain grouping component**: encapsulate domain display logic (favicon fetch, open count) so popup and full-list share the same rendering rules.

## Process Improvements
- **Automated lint/test before release**: add npm scripts + GitHub Action gate to prevent shipping inconsistent storage logic.
- **Usability test playbook**: script tasks for think-aloud sessions (aligning with user-stories doc) and capture findings into `docs/ideas.md` for continuous UX evolution.
- **Dev mode/debug HUD**: implement a toggle that surfaces storage payloads, matcher decisions, and build timestamp directly in the popup to simplify issue screenshots.
- **Visual consistency system**: establish systematic spacing/margin guidelines (e.g., matching padding between button areas and content zones) to maintain visual hierarchy across all UI components.
