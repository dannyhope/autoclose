# Make sure the Autoclose plugin is in the Chrome Web Store and is shared with Halil Kaan Taskin
**Readiness:** auto-refined
**Roadmap:** now

Make sure that the auto Clowes plug-in is in the Google play store and is shared with Halil Kaan Taskin

## Auto-investigation
**Investigated:** 2026-02-18

### Findings

**Transcription issues detected (voice-to-text dictation):**
- "auto Clowes plug-in" → **Autoclose plugin** (homophone transcription error)
- "Google play store" → almost certainly **Chrome Web Store** (Autoclose is a Chrome extension, not a mobile app; there is no Android/iOS version)
- "Halil Kaan Tas" (filename cutoff) → likely **Halil Kaan Taşkın** (Turkish name, truncated to 250-char filename limit)

**This task has two distinct requirements:**
1. Publish Autoclose to the Chrome Web Store
2. Share developer access (or tester access) with Halil Kaan Taskin

**Requirement 1 — Chrome Web Store publishing:**
- Already covered by `publish-to-chrome-web-store.md` (`.in/auto-refined/later/`)
- That task has detailed investigation including: icons ✅, screenshots ❌, privacy policy ❌, store listing ❌
- Status: not yet published

**Requirement 2 — Sharing with Halil Kaan Taskin:**
- The Chrome Web Store Developer Dashboard supports two sharing mechanisms:
  - **Group publisher:** Add a Google account as a co-owner/developer of the publisher account (full access)
  - **Trusted tester:** Share an unpublished extension with specific Google accounts for private testing before public release
- It's unclear whether Halil Kaan Taskin should be a tester or co-owner
- Their Google account email is needed to share access

**Relationship to existing task:**
- This task is **overlapping** with `publish-to-chrome-web-store.md` — the publishing goal is identical
- The sharing requirement is **new and not covered** by that task
- Best approach: add the sharing requirement to the existing `publish-to-chrome-web-store.md` task rather than keeping this as a separate task

### Scope
- Files: no code changes required — this is entirely a Chrome Web Store Developer Dashboard action
- Estimated complexity: small (once the publishing task is done, sharing is a 2-minute dashboard action)
- Dependency: Halil Kaan Taskin's Google account email is needed

### Questions for refinement
1. **Correct name:** Is the full name "Halil Kaan Taşkın" (or another spelling)? What is their Google account email address for sharing?
2. **Access level:** Should they be a **trusted tester** (can install the pre-release extension) or a **group publisher / co-owner** (can edit and publish the listing)?
3. **Merge?** This task overlaps heavily with `publish-to-chrome-web-store.md` — shall I merge this into that task as an additional requirement, rather than tracking it separately?
4. **Timing:** Should sharing happen before or after public release? (Tester access makes sense before; co-owner access is typically ongoing)

### Documentation impact
- _(none — no code or behaviour changes)_

### Related items
- `publish-to-chrome-web-store.md` (`.in/auto-refined/later/publish-to-chrome-web-store.md`) — **overlapping** (same publishing goal; this task adds the sharing requirement)

### Suggested renames
1. `share-chrome-web-store-listing-with-halil-kaan-taskin.md` — isolates the new requirement (sharing) that isn't in the existing publish task
2. `publish-and-share-extension-with-halil-kaan-taskin.md` — captures both requirements in one name
