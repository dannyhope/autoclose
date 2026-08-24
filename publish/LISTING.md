# Auto-close tabs — Chrome Web Store listing copy (backup)

Use `publish/index.html` as the working guide. This file is a plain-text backup.

## Description

Auto-close tabs keeps a list of sites you consider always safe to close, then closes matching tabs when you press the button. It never closes tabs on its own.

- Add the current tab, or every tab in the window, to your safe-to-close list
- Close all matching tabs in one click
- Protect sites with a never-close list so they stay open
- Optionally also close duplicates and bookmarked tabs
- While the popup is open, matching tabs get a warning mark in the tab title

Privacy: no account, no analytics, no data sent to the developer. Your lists stay in Chrome sync storage on your profile.

## Category

Tools (leaf under the Productivity group)

## Language

English (United Kingdom)

## Graphic assets

| Asset | File |
|-------|------|
| Store icon | `icon-128.png` |
| Screenshot | `screenshot-1-1280x800.png` |
| Small promo | `promo-tile-440x280.png` |
| Marquee | `marquee-promo-tile-1400x560.png` |

## Additional fields

| Field | Value |
|-------|--------|
| Official URL | None (or dannyhope.co.uk if verified) |
| Homepage URL | https://dannyhope.co.uk/autoclose/ |
| Support URL | https://dannyhope.co.uk/autoclose/ |
| Mature content | No |
| Visibility | Unlisted |
| Item support | On |

## Single purpose

Let the user keep a list of URLs that are safe to close, and close matching tabs on demand.

## Permission justifications

**storage** — Saves your safe-to-close list, never-close list, and UI toggles in Chrome sync storage so they persist and can follow your Chrome profile. Nothing is sent to the developer.

**tabs** — Reads open tab URLs so the extension can match them against your lists, show how many tabs would close, update the toolbar badge, and close only the tabs you asked to close.

**bookmarks** — Used only when Close bookmarked is turned on, to compare open tabs with bookmark URLs so already-saved pages can be closed in the same pass.

**favicon** — Shows the site’s favicon next to each domain in the popup list so you can recognise patterns quickly. Favicons stay in the browser.

**Host access (http and https pages)** — A content script runs on ordinary web pages so that, while the popup is open, matching tab titles can show a warning prefix. It does not read page content for the developer and does not send anything off the device.

## Privacy questionnaire

- Collect personal data? No
- Data used for: Functionality only (URL lists and toggles in Chrome sync storage)
- Data sold? No
- Privacy policy URL: https://dannyhope.co.uk/autoclose/

## Support email

danny.hope@gmail.com
