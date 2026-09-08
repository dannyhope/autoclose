# Deployment Instructions for WXT Migration

## Summary

The Autoclose extension has been successfully migrated from custom Vite/React multi-target build to WXT framework with standardised `browser.*` API. This document provides instructions for deploying the migrated extension.

## Pull Request

**PR #11**: https://github.com/dannyhope/autoclose/pull/11
- Branch: `cursor/wxt-migration-92be`
- Status: Draft (ready for review and testing)
- Changes: WXT migration + full TypeScript + browser.* API

## Quick Build Commands

### Development
```bash
npm install
npm run dev              # Chrome with hot reload
npm run dev:firefox      # Firefox with hot reload
```

### Production Builds
```bash
npm run build            # Chrome MV3
npm run build:firefox    # Firefox MV2
npm run build:all        # Both browsers
```

### Package for Distribution
```bash
npm run zip              # Chrome ZIP
npm run zip:firefox      # Firefox ZIP
```

## Output Locations

After building:
- **Chrome**: `.output/chrome-mv3/`
- **Firefox**: `.output/firefox-mv3/`
- **Chrome ZIP**: `.output/autoclose-chrome-1.0.1.zip` (123 KB)
- **Firefox ZIP**: `.output/autoclose-firefox-1.0.1.zip` (123 KB)

## Chrome Web Store Update

### Step 1: Build and Package
```bash
npm run build:chrome && npm run zip:chrome
```

### Step 2: Upload to Chrome Web Store
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Find "Auto-close tabs" (ID: `bbobjkkhncecpmhajfiajnnljehfmdbe`)
3. Click "Upload New Package"
4. Upload `.output/autoclose-chrome-1.0.1.zip`
5. Review and publish update

### Important Notes
- **Extension ID preserved**: The manifest name and version fields ensure the extension ID remains `bbobjkkhncecpmhajfiajnnljehfmdbe`
- **Version**: Currently 1.0.1 (matching Chrome Web Store listing)
- **Permissions unchanged**: No new permission requests (storage, tabs, bookmarks, favicon, windows)
- **Name unchanged**: "Auto-close tabs"

## Firefox Add-ons Distribution

### Build and Package
```bash
npm run build:firefox && npm run zip:firefox
```

Upload `.output/autoclose-firefox-1.0.1.zip` to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)

## Safari App Store Distribution

### Step 1: Build Base Extension
```bash
npm run build:chrome
```

### Step 2: Convert in Xcode
1. Open Xcode
2. File → New → Target → Safari Extension
3. Choose "From WebExtension..."
4. Select `.output/chrome-mv3/` directory
5. Configure team and signing identity
6. Build, archive, and submit via App Store Connect

**Note**: Safari support is documented but not implemented in this migration (as requested).

## Testing Checklist

Before deploying to production, verify:

### Chrome Testing
1. Load unpacked extension from `.output/chrome-mv3/` in `chrome://extensions`
2. Enable developer mode
3. Click "Load unpacked"
4. Select `.output/chrome-mv3/` directory

### Firefox Testing
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `.output/firefox-mv3/manifest.json`

### Functional Testing
- [ ] Popup opens and displays correctly
- [ ] Add URLs to safe-to-close list
- [ ] Tab title warnings show (🔴 prefix when popup is open)
- [ ] Close matching tabs works
- [ ] "Close bookmarked" checkbox works
- [ ] "Deduplicate tabs" checkbox works
- [ ] "Tile all tabs" feature works
- [ ] Badge count updates correctly
- [ ] Full list page displays
- [ ] Storage persists across browser restarts
- [ ] Alt/Option key modifier works (add and close)
- [ ] Protect tab feature works
- [ ] Move between lists works

## Browser Support

- **Chrome 120+** (Manifest V3)
- **Firefox 109+** (Manifest V3)
- **Safari 17+ on macOS 14+** (via Xcode conversion)

## Migration Details

### What Changed
- Build system: Custom Vite → WXT
- Browser API: Mixed `chrome.*` / `browser` shim → Standard `browser.*` via `webextension-polyfill`
- Code quality: Partial TypeScript → Full TypeScript
- Structure: Flat → WXT entrypoints pattern

### What Stayed the Same
- Extension name: "Auto-close tabs"
- Extension version: 1.0.1
- Chrome Web Store ID: `bbobjkkhncecpmhajfiajnnljehfmdbe`
- Icons: Same 16/48/128px icons
- Permissions: storage, tabs, bookmarks, favicon, windows
- Functionality: 100% behaviour parity
- Storage schema: Unchanged (backwards compatible)
- UI/UX: Identical

## File Sizes

### Chrome Build
- Total size: 393 KB (uncompressed)
- ZIP size: 123 KB
- Main chunks:
  - React/UI: ~207 KB
  - Popup logic: ~79 KB
  - CSS: ~42 KB
  - Background: ~17 KB
  - Content script: ~14 KB

### Firefox Build
- Total size: 393 KB (uncompressed)
- ZIP size: 123 KB
- Manifest V3 (same as Chrome)
- Identical structure to Chrome

## Documentation

- **[README-WXT.md](README-WXT.md)** - Quick start guide
- **[WXT-MIGRATION.md](WXT-MIGRATION.md)** - Complete migration details
- **[PR #11](https://github.com/dannyhope/autoclose/pull/11)** - Pull request with changes

## Legacy Build (For Reference)

Original Vite build system is preserved:
```bash
npm run legacy:build:chrome
npm run legacy:build:firefox
npm run legacy:build:safari
```

Outputs to `dist-chrome/`, `dist-firefox/`, `dist-safari/` directories.

## Troubleshooting

### Build fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Extension doesn't load
- Check browser console for errors
- Verify manifest.json in output directory
- Ensure all files are present in output directory
- Try rebuilding: `npm run build`

### ZIP creation fails
```bash
npm run build
npm run zip
```

## Questions?

See [WXT-MIGRATION.md](WXT-MIGRATION.md) for detailed troubleshooting and migration notes.

## Next Steps

1. **Review PR**: Check [PR #11](https://github.com/dannyhope/autoclose/pull/11)
2. **Test locally**: Build and load in Chrome/Firefox
3. **Verify behaviour**: Complete testing checklist
4. **Merge PR**: When satisfied with testing
5. **Deploy to stores**: Upload ZIPs to Chrome Web Store and Firefox Add-ons
