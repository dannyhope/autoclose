# Port Autoclose to Safari and Firefox
**Readiness:** refined
**Roadmap:** later
**Type:** build

## Goal

Make Autoclose available as browser extensions for Safari and Firefox, while
preserving the existing Chrome behaviour and keeping browser-specific code
isolated behind a small compatibility layer.

## Scope

- Audit the current Manifest V3 extension and identify APIs or permissions
  that differ in Safari Web Extensions and Firefox.
- Define supported browser versions and any feature differences.
- Add Safari and Firefox manifests/build outputs without changing the Chrome
  package.
- Adapt storage, tabs, bookmarks, favicon, badge, content-script, and window
  tiling APIs where required.
- Test install, permissions, popup behaviour, matching/never-close rules,
  closing, title warnings, badges, and tile-all-tabs in each target browser.
- Document packaging, signing/submission, and any unsupported behaviour.

## Done when

Safari and Firefox packages can be installed in their supported browsers,
pass the shared behaviour tests, and have clear build and release steps.
