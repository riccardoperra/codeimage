# Multiple files

Keep separate named documents and export one image per file.

## Sub-features

Add, rename, switch, close, reorder and filename-driven language detection; up to six tabs.

## How to get to it (user POV)

Use the plus/Add tab button in the code window at `/`.

## Driving it with Playwright

Run `VERIFY_AUDIT=1 VERIFY_CASES=tabs fnm exec --using=v24.14.0 node .agents/skills/verify-codeimage/scripts/verify.mjs` from the repository root. Add `VERIFY_BROWSER_CHANNEL=chrome VERIFY_TOUCH=1` to drive the pointer journey with Chrome touch emulation. Set `VERIFY_BROWSER_CHANNEL=webkit` for WebKit mouse and keyboard.

The `tabs` case uses the Editor window style. The `tabs-classic` case runs the same journey in macOS chrome. Each enters distinct code in two tabs, selects their extensions with keyboard and pointer, and switches between them. It focuses a tab, uses Enter to activate it, then uses Space and ArrowRight to pick up and move it. Escape preserves order and focus. Space commits the next move. A pointer drag verifies that order stays stable until drop. The dragged tab follows the pointer inside the frame and keeps its background and shadow. The other tab stays in place. The audit renames a tab, checks the reordered names and decodes the image entries in the downloaded ZIP, then closes the active tab and checks the remaining document. The trace and drag screenshot capture the interaction.

The `plain-text-tab-icon` case renames a tab through filename completion, switches from a dark frame to XCode Light, and checks the icon's computed fill in both modes.

Source: `components/Terminal/Tabs/TerminalWindowTabList.tsx`, `Tab/WindowTab.tsx`, `Tab/DraggableWindowTab.tsx` (Close tab and dragging), `TabAddButton/TabAddButton.tsx` (Add tab), `TabName/TabName.tsx`, `hooks/export-tabs.ts`, `hooks/export-tab-name.ts`.

## Gotchas

These are div tabs, not ARIA tabs. The default macOS window and classic plus have no accessible name; select Editor via the UI before this modern-window recipe; do not use an arbitrary global button. Only multiple tabs expose Close. With one tab the per-tab export item is disabled with hint "Needs two tabs or more". Start a pointer drag from the tab padding or an inactive label so the inline name field stays available for text selection.
