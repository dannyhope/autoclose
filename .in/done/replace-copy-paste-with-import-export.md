Replace copy/paste with import/export

## Goal
Replace the current clipboard-based copy/paste functionality with explicit import/export using file operations.

## Scope
- v1 extension
- v2 extension

## Why
Clipboard operations can be unreliable and opaque. File-based import/export is more explicit and debuggable.

## Acceptance criteria
- [ ] Export button saves whitelist URLs to a file (e.g. JSON or plain text)
- [ ] Import button loads URLs from a file
- [ ] Remove clipboard-based copy/paste buttons
- [ ] Works in both v1 and v2
