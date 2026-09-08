# Auto-close tabs (WXT Build)

This extension has been migrated to WXT framework for improved cross-browser compatibility and standardised `browser.*` API usage.

## Quick Start

### Development
```bash
npm install
npm run dev              # Chrome
npm run dev:firefox      # Firefox
```

### Build
```bash
npm run build            # Chrome
npm run build:firefox    # Firefox
npm run build:all        # Both
```

### Package for Distribution
```bash
npm run zip              # Chrome ZIP
npm run zip:firefox      # Firefox ZIP
```

Output: `.output/autoclose-chrome-1.0.1.zip` and `.output/autoclose-firefox-1.0.1.zip`

## Chrome Web Store Update

1. Build and zip:
   ```bash
   npm run build:chrome && npm run zip:chrome
   ```

2. Upload `.output/autoclose-chrome-1.0.1.zip` to Chrome Web Store Dashboard

3. Extension ID `bbobjkkhncecpmhajfiajnnljehfmdbe` is preserved via manifest name/version

## Browser Support

- **Chrome 120+** (Manifest V3, built from `.output/chrome-mv3/`)
- **Firefox 109+** (Manifest V2, built from `.output/firefox-mv2/`)
- **Safari 17+** (via Xcode conversion, use Chrome build as source)

## Migration Notes

See [WXT-MIGRATION.md](WXT-MIGRATION.md) for complete migration details.

### Key Changes
- Standardised `browser.*` API (via `webextension-polyfill`)
- WXT-managed manifest (no more manual manifest files)
- Full TypeScript migration
- Single codebase for all browsers

### File Structure
```
src/
├── entrypoints/
│   ├── background.ts         # Service worker
│   ├── content.ts            # Content script
│   ├── popup/                # Popup UI
│   └── full-list/            # Full list page
├── lib/                      # Shared utilities
├── components/               # React components
├── styles/                   # CSS
└── icons/                    # Extension icons
```

### Legacy Build
The original Vite build is preserved for reference:
```bash
npm run legacy:build:chrome
npm run legacy:build:firefox
npm run legacy:build:safari
```

## Testing

### Unit Tests
```bash
npm test
```

### Manual Testing
1. Load unpacked extension:
   - Chrome: `chrome://extensions` → Load unpacked → `.output/chrome-mv3/`
   - Firefox: `about:debugging` → Load Temporary Add-on → `.output/firefox-mv2/manifest.json`

2. Test checklist:
   - [ ] Popup opens and displays
   - [ ] Add/remove URLs from safe-to-close list
   - [ ] Tab title warnings (🔴 prefix)
   - [ ] Close matching tabs
   - [ ] Close bookmarked tabs
   - [ ] Deduplicate tabs
   - [ ] Tile all tabs
   - [ ] Badge count updates
   - [ ] Full list page
   - [ ] Storage persists

## Safari Packaging

1. Build Chrome version:
   ```bash
   npm run build:chrome
   ```

2. Convert in Xcode:
   - File → New → Target → Safari Extension (from WebExtension)
   - Source directory: `.output/chrome-mv3/`
   - Configure signing
   - Archive and submit to App Store Connect

## Behaviour Parity

This migration maintains 100% feature parity with the original Autoclose extension:
- Same UI and settings
- Same tab matching logic
- Same storage schema
- Same permissions
- Same keyboard shortcuts (Alt/Option key behaviour)
- Same extension name and version (for Chrome Web Store continuity)

## Documentation

- [WXT-MIGRATION.md](WXT-MIGRATION.md) - Migration details
- [_docs/spec.md](_docs/spec.md) - Product specification
- [_docs/design.md](_docs/design.md) - Visual design guide
- [_docs/architecture.md](_docs/architecture.md) - Architecture decisions
