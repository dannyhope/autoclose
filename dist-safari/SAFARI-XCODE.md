# Safari packaging

This directory is the web-extension payload for Safari 17+ on macOS 14+.

1. In Xcode, create a Safari Web Extension App target.
2. Set the extension's resource folder to this directory.
3. Build and run the containing app for local testing.
4. Archive, configure the Apple Developer signing identity, and submit the app through App Store Connect.

Safari does not install this raw folder as a distributable extension.
