# Storage schema & import/export contract

## Goals
- Preserve a richer data model (labels, tags, timestamps) without breaking existing users.
- Keep storage writes deterministic and small enough for `chrome.storage.sync` limits.
- Provide an import/export format that can be wired to the future "share data" workflow with zero ambiguity.

## Storage schema v2

| Key | Type | Notes |
| --- | --- | --- |
| `storageVersion` | number | Increment to `2` after migration. Guards all future upgrades. |
| `safeListItems` | array<SafeListItem> | Replaces the legacy `safeUrls` string array. |
| `safeUrlsLegacy` | array<string> | Optional backup copy created during migration for safety/rollback. Purged after confidence window. |
| `uiSettings` | object | Namespaced bag for UI toggles (e.g., `alwaysCloseDupes`, `listToggleState`, `devModeEnabled`). Stored via `ui-state.js`. |

### SafeListItem shape

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string (UUID v4) | ✅ | Stable identifier to support future reordering/metadata updates. |
| `pattern` | string | ✅ | Canonical pattern (exact URL, suffix, or leading `/path`). |
| `displayName` | string | ⚪️ | User-friendly label. Defaults to hostname when migrated. |
| `tags` | array<string> | ⚪️ | Lightweight classification ("work", "news"). |
| `notes` | string | ⚪️ | Free-form comments/help for future self. |
| `addedAt` | ISO 8601 string | ✅ | Creation timestamp in UTC. |
| `lastMatchedAt` | ISO 8601 string | ⚪️ | Updated whenever a close/highlight action finds a match. |
| `closeBehavior` | enum (`"closeAll" \| "keepOne"`) | ⚪️ | Allows per-pattern overrides once duplicate-handling expands. |

### UI settings namespace
Store all toggle-like flags inside `uiSettings` to avoid scattering keys. Example structure:

```json
{
  "uiSettings": {
    "alwaysCloseDupes": true,
    "listToggleState": true,
    "devModeEnabled": false
  }
}
```

## Migration plan (v1 → v2)
1. **Gate on version:** During `ensureStorageVersion`, read `storageVersion`. If missing or `< 2`, run `upgradeToV2()`.
2. **Snapshot legacy data:** Read the existing `safeUrls` array and persist it under `safeUrlsLegacy` for quick rollback.
3. **Transform entries:** Map each string to a `SafeListItem` object:
   - `id`: `crypto.randomUUID()` (or equivalent polyfill).
   - `pattern`: original string.
   - `displayName`: hostname derived via `parseUrlParts()`.
   - `tags`: `[]`.
   - `notes`: `""`.
   - `addedAt`: current timestamp (ISO string).
   - `lastMatchedAt`: `null`.
4. **Persist new layout:** Write the `safeListItems` array, keep `safeUrls` for one release to assist downgrade paths, and bump `storageVersion` to `2`.
5. **Cleanup window:** After one stable release (or once telemetry confirms parity), delete `safeUrlsLegacy` + legacy `safeUrls` to reclaim quota.
6. **Future migrations:** Additional fields must use additive changes with defaults to keep step upgrades idempotent.

Pseudo-code sketch:
```js
async function upgradeToV2() {
  const legacy = await storageGet(['safeUrls']);
  const items = (legacy.safeUrls || []).map((pattern) => ({
    id: crypto.randomUUID(),
    pattern,
    displayName: parseUrlParts(pattern).hostname || pattern,
    tags: [],
    notes: '',
    addedAt: new Date().toISOString(),
    lastMatchedAt: null,
    closeBehavior: 'keepOne'
  }));
  await storageSet({
    safeListItems: items,
    safeUrlsLegacy: legacy.safeUrls,
    storageVersion: 2
  });
}
```

## Import/export contract
Two serialisation formats cover power users and spreadsheets. Both carry compatibility metadata so future schema bumps remain backwards compatible.

### JSON (preferred)
```json
{
  "format": "autoclose-safe-list",
  "version": 2,
  "generatedAt": "2026-01-02T10:00:00.000Z",
  "items": [
    {
      "id": "f3b8e1a2-9d40-4bf4-9a77-1cf92b7b8a2a",
      "pattern": "https://news.example.com/$",
      "displayName": "News homepage",
      "tags": ["news"],
      "notes": "Safe to close after reading",
      "addedAt": "2025-12-14T08:30:12.000Z",
      "lastMatchedAt": "2026-01-01T17:05:00.000Z",
      "closeBehavior": "keepOne"
    }
  ]
}
```
Validation rules:
1. `format` must equal `autoclose-safe-list`.
2. `version` matches `storageVersion`; older exports can be upgraded by reusing the migration pipeline.
3. Reject files where `items` exceeds the Chrome sync quota (~100 KB) and prompt users to trim/segment.

### CSV
When users prefer spreadsheets, provide a UTF-8 CSV template with the following columns:
`pattern,displayName,tags,notes,closeBehavior`
- `tags` is a pipe-delimited list (`work|email`).
- Missing optional columns fall back to defaults defined above.
- Dates are regenerated on import to keep timestamps trustworthy.

### Import flow expectations
1. Validate schema (JSON) or headers (CSV) before touching storage.
2. Deduplicate by `pattern` (case-insensitive) before merging with existing `safeListItems`.
3. For conflicts, prefer user-provided metadata but keep the existing `id` to avoid breaking references.
4. Persist via the same helpers used by the popup so UI state stays in sync.

### Export flow expectations
1. Read from `safeListItems` only; never emit legacy arrays.
2. Include `generatedAt` + `buildTimestamp` (from the global footer requirement) so screenshots/external reports capture provenance.
3. Offer both JSON and CSV buttons in the planned Import/Export panel.

## Open questions / next steps
- Decide on retention policy for `safeUrlsLegacy` (time-based vs. flag).
- Consider encrypting exports at rest if we later support cloud backups.
- Coordinate with the upcoming dev-mode HUD so it can display schema version + last migration run.
