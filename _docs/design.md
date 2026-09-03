# Autoclose — Design

> Living document. Update whenever visual design changes. Last updated: 2026-08-31.
>
> **This file is the source of truth for how Autoclose should look.**

Popup and full-list UI are **Vite + React + Tailwind + shadcn/ui** (Radix). Quiet utility chrome that subordinates to the task. British English, sentence-case labels. Background, content script, and `src/js/lib` stay vanilla modules.

## Palette and type

Autoclose uses the browser-extension token set from
`~/.claude/skills/design-system/references/brand.md`: near-white and soft grey
in light mode, near-black and dark grey in dark mode, plus accent `#C9003A`.
No green status fills, multi-hue colours, gradients, glow, or invented hex
values.

- Follow OS light/dark (`prefers-color-scheme`). No appearance picker.
- Type: system stack only (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`), 14–15px body text, regular and medium weights only.

No decorative horizontal rules. Separate the lists from the controls with spacing, not a full-width hairline.

## Local development

Run `npm run dev` to view the app at `http://autoclose.local:<port>/`. The port
is selected from the committed `.dev-port`, falling forward when that port is
busy; the dev command ensures `autoclose.local` resolves to `127.0.0.1`.

## Popup

- Width **400px** (within the 400–420px standard). Height is content-sized
  for the current job; there is no fixed 600px wall.
- Use an 8px spacing grid, 12–16px button padding, and 24–32px between
  sections. The hierarchy is one primary action, secondary actions, toggles,
  then accordion lists.
- Accordion headers sit with their lists, not in the action grid. **Protect this tab** lives on the never-close header.
- **Close *n* matching tabs** is the consequential action; disabled state uses
  the muted token on the soft-grey surface.
- Lists fill the remaining popup height (footer does not grow). Near-white
  panel, 16px favicon, ellipsis on long URLs, small delete control. Group by
  domain only when that domain has more than one pattern; a lone pattern is a
  single row. File URLs still share “This computer” when there is more than
  one.
- Footer: muted “Feedback” (left) and “A Danny Hope product” (right) →
  https://dannyhope.co.uk. Use the muted token at 11px with no extra opacity.
  No GitHub URLs.

Settings do not live in the popup. If settings are added, they belong in
`options.html`.

## Cross-browser packaging

Chrome, Firefox, and Safari use the same popup geometry and tokens. Browser
compatibility is kept in `src/js/lib/browser-api.js` and target manifests;
unsupported actions use the existing quiet error path rather than introducing
browser-specific product chrome. Favicon loading also uses the shared runtime
URL resolver so Safari and Firefox do not depend on a Chrome-only extension
scheme.

Store screenshots should show this real popup geometry (narrow card), not a marketing-page mock.

## Full-list page

- Same utility look and a 400–420px reading column when opened as an extension page.
- Status line for last refresh. Open and not-open states use neutral surfaces
  and explicit text; the page does not introduce a second status colour.
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

## Isolation and motion

- Autoclose currently injects only document-title prefixes. Any future
  injected UI must mount in a shadow root, match host density, and respect the
  OS colour scheme.
- Motion is functional only: popup height, accordion chevron rotation, and
  button hover/pressed feedback. Honour `prefers-reduced-motion: reduce` with
  instant height/transform. Do not show a spinner on first paint.

## What to avoid

- Plasmo rewrite, or a second component library beside shadcn
- Title-case buttons
- Prototype Panels / Flags in the end-user popup
- Invented hex outside brand.md
- Fixed 600px popup walls, decorative rules, gradients, glow, or multiple
  component libraries
- Public GitHub or Gmail hrefs in the footer
