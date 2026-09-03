# Usability issues

## Open

| id | feature | user goal | action | cw failure | why | severity | status | test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cross-browser-unsupported-tiling | Safari/Firefox support | Arrange all tabs into a grid | Choose “Tile all tabs” in a browser without window management | will-see-progress | The action can be unavailable or report unsupported, which may be mistaken for a failed close operation. | medium | open | “Arrange all your open tabs into separate windows.” |
| safari-signing | Safari release | Install Autoclose for regular use | Install the Safari build | will-associate | A raw extension folder is not a distributable Safari extension; signing happens through Xcode/App Store Connect. | medium | open | “Install the Safari version for everyday use.” |
# Autoclose — Usability issues

Predicted issues from cognitive walkthroughs. This is not a list of observed
user feedback.

## Open issues

### cross-browser-favicon-fallback

| Field | Detail |
|---|---|
| id | `cross-browser-favicon-fallback` |
| feature | Safari and Firefox favicon compatibility |
| user goal | “Recognise the site I am about to remove.” |
| action | Review a safe-to-close row when the browser cannot resolve its favicon URL. |
| cw failure | will-see-progress |
| why | A missing icon can make the row look incomplete even though the URL remains available. |
| severity | low |
| status | open |
| test | “Which saved website would you remove from this list?” Starting context: a list containing a site whose favicon is unavailable. |

### popup-primary-action-hierarchy

| Field | Detail |
|---|---|
| id | `popup-primary-action-hierarchy` |
| feature | Popup action hierarchy and content-sized layout |
| user goal | “I want to close the tabs that are on my safe list.” |
| action | Choose the action that closes matching tabs from the popup’s first action group. |
| cw failure | will-associate |
| why | A person who has not used the extension may not know whether “safe to close” describes the stored list or the tabs affected by the primary action. |
| severity | medium |
| status | open |
| test | “How would you close the tabs that are on your safe list?” Starting context: popup open with at least one matching tab. |

### cross-browser-permission-prompt

| Field | Detail |
|---|---|
| id | `cross-browser-permission-prompt` |
| feature | Firefox and Safari installation |
| user goal | “Install the extension and understand what it can access.” |
| action | Approve the target browser's extension permissions during installation. |
| cw failure | will-associate |
| why | Permission names and wording differ between browsers, particularly where host access replaces Chrome's favicon permission. |
| severity | medium |
| status | open |
| test | “Install the extension and tell me what access it is asking for.” Starting context: the target browser's extension installation flow. |
