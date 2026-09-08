# WXT Migration Guide

This document describes the migration from custom Vite/React multi-target build to WXT framework.

## What Changed

### Build System
- **Before**: Custom Vite build with `build-targets.mjs` script
- **After**: WXT framework with standardised extension build pipeline

### Browser API
- **Before**: Mixed `chrome.*` / `browser` shim via `src/js/lib/browser-api.js`
- **After**: Standardised `browser.*` API via `webextension-polyfill`

### Project Structure
- **Before**: 
  - Entrypoints: `src/popup.html`, `src/full-list.html`
  - Background: `src/js/background.js`
  - Content: `src/js/tab-warning.js`
  
- **After**:
  - Entrypoints: `src/entrypoints/popup/`, `src/entrypoints/full-list/`
  - Background: `src/entrypoints/background.ts`
  - Content: `src/entrypoints/content.ts`

### Manifest
- **Before**: Three separate manifests (`src/manifest.json`, `targets/firefox/manifest.json`, `targets/safari/manifest.json`)
- **After**: Single manifest configuration in `wxt.config.ts`, WXT generates browser-specific manifests

### TypeScript
- **Before**: Partial TypeScript (UI components only)
- **After**: Full TypeScript migration for all extension code

## Building

### Chrome
```bash
npm run build
# or
npm run build:chrome
```

Output: `.output/chrome-mv3/`

### Firefox
```bash
npm run build:firefox
```

Output: `.output/firefox-mv2/`

Note: WXT targets Firefox MV2 by default as Firefox MV3 support is still stabilising. The extension uses the same modern `browser.*` API for both targets.

### Both
```bash
npm run build:all
```

### Development
```bash
# Chrome
npm run dev

# Firefox
npm run dev:firefox
```

### Packaging for Distribution
```bash
# Create ZIP files for upload
npm run zip           # Chrome
npm run zip:firefox   # Firefox
```

ZIPs are created in `.output/` directory.

## Chrome Web Store Update

To update the Chrome Web Store listing:

1. Build the Chrome extension:
   ```bash
   npm run build:chrome
   ```

2. Create a ZIP:
   ```bash
   npm run zip:chrome
   ```

3. Upload `.output/autoclose-chrome-1.0.1.zip` to the Chrome Web Store Developer Dashboard

**Important**: The extension ID (`bbobjkkhncecpmhajfiajnnljehfmdbe`) is preserved through the `name` and `version` fields in the manifest. Do not change these without coordinating with the store listing.

## Safari Packaging

Safari requires conversion via Xcode's Safari Web Extension Converter:

1. Build the extension (Chrome build works as base):
   ```bash
   npm run build:chrome
   ```

2. In Xcode:
   - File → New → Target → Safari Extension (from WebExtension)
   - Point to `.output/chrome-mv3/` directory
   - Configure signing identity
   - Build and archive

3. Submit via App Store Connect

**Note**: Safari MV3 support requires Safari 17+ on macOS 14+. The `browser.*` API is fully compatible.

## API Changes

All code now uses `browser.*` API exclusively:

- `chrome.tabs.*` → `browser.tabs.*`
- `chrome.runtime.*` → `browser.runtime.*`
- `chrome.storage.*` → `browser.storage.*`
- `chrome.bookmarks.*` → `browser.bookmarks.*`

The `webextension-polyfill` provides a Promise-based API that works identically in Chrome and Firefox.

## File Structure

```
src/
├── entrypoints/
│   ├── background.ts         # Background service worker
│   ├── content.ts            # Content script
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   └── full-list/
│       ├── index.html
│       ├── main.tsx
│       └── App.tsx
├── lib/                      # Shared utilities (TypeScript)
│   ├── storage.ts
│   ├── tab-actions.ts
│   ├── url-utils.ts
│   ├── bookmark-utils.ts
│   ├── window-tiling.ts
│   ├── ui-state.ts
│   └── browser-api.ts
├── components/               # React components
│   └── ui/
├── styles/                   # CSS
│   ├── globals.css
│   └── utilities.css
└── icons/                    # Extension icons
```

## Backwards Compatibility

The legacy Vite build system is preserved for reference:

```bash
npm run legacy:dev
npm run legacy:build
npm run legacy:build:chrome
npm run legacy:build:firefox
npm run legacy:build:safari
```

These scripts use the old `vite.config.ts` and `build-targets.mjs` approach.

## Testing

Run the test suite (unchanged):

```bash
npm test
```

Manual testing checklist:
- [ ] Load unpacked extension in Chrome (`chrome://extensions`)
- [ ] Load temporary add-on in Firefox (`about:debugging`)
- [ ] Verify popup opens and displays correctly
- [ ] Add URLs to safe-to-close list
- [ ] Verify tab title warnings appear (🔴 prefix)
- [ ] Close matching tabs
- [ ] Test "Close bookmarked" checkbox
- [ ] Test "Deduplicate tabs" checkbox
- [ ] Test "Tile all tabs" feature
- [ ] Verify badge count updates
- [ ] Test full list page
- [ ] Verify storage persists across sessions

## Dependencies

New dependencies added:
- `wxt` - Extension build framework
- `@wxt-dev/module-react` - React integration for WXT
- `webextension-polyfill` - Cross-browser API
- `@types/webextension-polyfill` - TypeScript definitions

## Known Differences

### Firefox Manifest Version
WXT builds Firefox extensions as MV2 by default because Firefox's MV3 implementation is still evolving. This is intentional and maintains full compatibility with Firefox 109+. The code uses the same modern `browser.*` API regardless of manifest version.

### Icon Files
WXT automatically copies icons from `public/icons/` to the output directory. The original `src/icons/` structure is preserved but icons are now referenced via the public directory.

### Chrome vs. Firefox Differences Handled by WXT
- Background script: Service worker (Chrome MV3) vs. persistent script (Firefox MV2)
- Action API: `action` (Chrome MV3) vs. `browser_action` (Firefox MV2)
- Host permissions: Handled automatically per browser requirements

## Troubleshooting

### Build fails with TypeScript errors
Ensure `@types/webextension-polyfill` and `wxt` types are installed and `tsconfig.json` includes `.wxt` in the `include` array.

### Extension doesn't load in browser
Check the console in `chrome://extensions` or `about:debugging` for specific errors. Verify manifest.json in the output directory matches expected format.

### Storage/API calls fail
Verify all `chrome.*` calls have been migrated to `browser.*`. Search the codebase for any remaining `chrome.` references in TypeScript/JavaScript files.

### Icons missing
Ensure icons exist in `public/icons/` and are referenced correctly in `wxt.config.ts` manifest configuration.
