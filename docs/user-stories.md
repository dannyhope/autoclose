# User Stories

## Story 1: Manage Safe-to-Close Sites
**As** a focus-mode user, **I want** to add or remove URLs that are always safe to close, **so that** I can tidy my browser quickly.

### Scenarios (Gherkin)
```
Scenario: Add the active tab to the safe list
  Given I have the popup open on a page I often revisit
  When I press "Add tab to list"
  Then the page hostname/path is added to my safe list
  And it appears at the top of the grouped list

Scenario: Remove a pattern from the list
  Given I have at least one safe URL saved
  When I click the delete icon beside that entry
  Then it disappears from the popup list
  And it no longer matches open tabs
```

### Think-aloud Tasks
1. "Open the extension and add the current tab to your safe list. Tell me what you expect to happen."
2. "Remove the entry you just created. Describe any surprises."

## Story 2: Close clutter quickly
**As** a multitasker with dozens of tabs, **I want** to close all tabs that match my safe list (and optionally deduplicate), **so that** I can regain focus.

### Scenarios (Gherkin)
```
Scenario: Close safe tabs
  Given I have multiple open tabs that match stored patterns
  When I activate the "Close all" button
  Then every matching tab closes
  And I see how many tabs were closed

Scenario: Close duplicates automatically
  Given "Deduplicate tabs" is enabled
  And I have three identical URLs open
  When I run any close action
  Then only one copy remains
```

### Think-aloud Tasks
1. "Use the popup to close anything considered safe to close. Narrate what feedback you notice."
2. "Enable the duplicate option and explain how confident you feel that it worked."

## Story 3: Review the full list across devices
**As** someone syncing Chrome between laptop and desktop, **I want** to inspect the entire safe list with status indicators, **so that** I can decide whether to prune old entries.

### Scenarios (Gherkin)
```
Scenario: View full list status
  Given I load the full-list page from the options link
  When the page loads
  Then I see every stored pattern with an "open / not open" badge
  And the page shows when the list was last refreshed

Scenario: Empty state guidance
  Given I have zero saved URLs
  When I open the full list page
  Then I see guidance that explains how to add entries from the popup
```

### Think-aloud Tasks
1. "Open the options page to review every safe pattern. What does the status message tell you?"
2. "If your list is empty, explain what the interface suggests you do next."
