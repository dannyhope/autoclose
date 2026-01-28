# Rebuild Autoclose v2.0.0 with modern stack

**Refined:** 2026-01-27

## Summary

Complete rewrite of Autoclose using the preferred browser extension stack (from `~/.claude/skills/browser-extension-dev.md`):

**Stack:** Plasmo + React + TypeScript + shadcn/ui + Tailwind + pnpm + Manifest V3

## Approach

- Fresh start: new Plasmo project, port features one by one
- Version: 2.0.0 (major version for complete rewrite)
- Goal: Full modernisation (developer experience + UI quality)

## Features to port

1. **Safe URLs list** - add/remove URL patterns, close matching tabs
2. **Close matching tabs button** - closes tabs matching patterns in list
3. **Deduplicate tabs checkbox** - when closing, also close duplicate tabs
4. **Close bookmarked checkbox** - when closing, also close bookmarked/blank tabs
5. **Add tab to list** - adds current tab's URL pattern (Option+click to add & close)
6. **Badge count** - shows number of closeable tabs on extension icon

## Features to drop

- Tile all tabs (removed in v2)

## Testing requirements

- **E2E tests:** Puppeteer for extension loading and user flows
- **Unit tests:** Jest for utility functions and hooks
- **BDD specs:** Behaviour specifications for each feature

## Technical notes

- Use `@plasmohq/storage` instead of raw `chrome.storage`
- Use `@plasmohq/messaging` instead of raw `chrome.runtime`
- shadcn/ui components for all UI elements
- TypeScript strict mode, no `any`
- Minimal permissions
