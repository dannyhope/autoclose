Test the paste functionality with debug logging

## Steps
1. Build v2: `cd autoclose-v2 && npm run build`
2. Load the built extension from `autoclose-v2/build/chrome-mv3-prod/`
3. Open the v2 extension popup in Chrome
4. Right-click the popup → **Inspect** to open DevTools
5. Copy URLs from v1 (or use any newline-separated URL list)
6. Click Paste in v2
7. Check the Console tab for `[paste]` logs

## What to look for
- `[paste] Reading clipboard…` — confirms button clicked
- `[paste] Clipboard text length: X chars` — confirms clipboard was read
- `[paste] Parsed X URLs` — confirms parsing worked
- `[paste] Duplicates: X | New: Y` — shows if URLs were filtered as dupes
- `[paste] Error: ...` — if clipboard access failed, this shows why

## Context
Debug logging was added to `autoclose-v2/src/components/url-list.tsx` to diagnose why pasting URLs from v1 into v2 appeared to do nothing.
