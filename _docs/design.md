# Autoclose — Design

> Living document. Update whenever visual design changes. Last updated: 2026-08-24.
>
> **This file is the source of truth for how Autoclose should look.**

Vanilla HTML/CSS popup (not shadcn). Quiet utility chrome that subordinates to the task. British English, sentence-case labels.

## Palette and type

Use Danny Hope Ltd Cool Grey and brand greens/reds from `~/.claude/skills/design-system/references/brand.md`. Tokens already in `src/styles/utilities.css` (`#F8F9FA` … `#1A272C`, `#D7FBC9`, `#006300`, `#C9003A`).

- Primary actions: muted grey buttons (`#F0F2F2` fill, `#C7D0D4` border, `#1A272C` text), not a vivid fill.
- Destructive / protect: brand red (`#FFD1CF` fill, `#FF9594` edge, `#8C0028` text).
- Follow OS light/dark (`prefers-color-scheme`). No appearance picker.
- Type: currently IBM Plex Sans with system fallbacks. Museo Sans is the brand face for new product UI; do not introduce a second competing face in one change.

No decorative horizontal rules. Separate the lists from the controls with spacing, not a full-width hairline.

## Popup

- Width **480px**. Height **600px** when a list is expanded, **160px** when both lists are collapsed. Height animates in ~200ms.
- Compact vertical form: two-column grid of actions, then toggles, then accordion lists.
- **Close *n* matching tabs** is the consequential action; disabled state uses Cool Grey (`#8C979C` on `#F0F2F2`).
- Lists: white panel, grouped by domain with 16px favicon, ellipsis on long URLs, small delete control.
- Footer: muted “Feedback” (left) and “A Danny Hope product” (right) → https://dannyhope.co.uk. Cool Grey `#8C979C`, hover `#616E73`. 11px. No GitHub URLs.

Store screenshots should show this real popup geometry (narrow card), not a marketing-page mock.

## Full-list page

- Same utility look and 480px-ish column when opened as an extension page.
- Status line for last refresh. Open patterns read as green; not-open as grey.
- Same footer attribution as the popup.

## Tab-warning overlay

Not a painted overlay. The content script only prefixes the **document title** (`🔴` / `🔴🔴`) so Chrome’s tab strip carries the warning. No host-page panel, no leaked CSS.

## Toolbar and store icon

The toolbar mark is a **mid-grey close X** (`#7B858A`) on a **transparent** canvas — no rounded-square tile, ~12% inset so it does not touch the edge.

| Size | Use |
|------|-----|
| 16 / 48 / 128 PNG | Package / toolbar (keep alpha) |
| 2048 PNG | Source raster |
| SVG | `src/icons/icon.svg` source |
| 128 store | `publish/icon-128.png` — 24-bit PNG, **no alpha**, flatten onto white |

## Motion

Functional only: popup height, accordion chevron rotate, button hover. Honour `prefers-reduced-motion: reduce` with instant height/transform.

## What to avoid

- Plasmo/shadcn restyle of this vanilla popup
- Title-case buttons
- Prototype Panels / Flags in the end-user popup
- Invented hex outside brand.md
- Public GitHub or Gmail hrefs in the footer
