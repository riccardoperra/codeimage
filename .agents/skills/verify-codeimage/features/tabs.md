# Multiple files

Keep separate named documents and export one image per file.

## Sub-features

Add, rename, switch, close, reorder and filename-driven language detection; up to six tabs.

## How to get to it (user POV)

Use the plus/Add tab button in the code window at `/`.

## Driving it with Playwright

Audit first opens Window style, focuses the Editor radio and presses Space, then closes its dialog. Modern Editor window supplies named Add tab/Close tab controls. Audit uses `[data-window-tabs]` scoped to Add tab, `[data-window-tab]`, and `[data-active="true"] [aria-label="Tab name"] input`, pressing Escape after each name. Name first.ts, add hello.py with distinct code, switch by inactive filename text and assert both documents. Open the export menu with `[data-export-menu]`, click `[data-export-action="tabs"]` (Export one image per tab) and decode both PNG entries in the actual ZIP. Close the active file using Close tab and assert one remains. For reorder, drag the whole tab with real mouse moves (there is no separate handle) and verify visible order and exported ZIP naming (`NN-<name>.<ext>`: the extension follows the exported format, PNG by default; names are sanitized and an empty name becomes `untitled`).

Source: `components/Terminal/Tabs/TerminalWindowTabList.tsx`, `Tab/WindowTab.tsx`, `Tab/DraggableWindowTab.tsx` (Close tab and dragging), `TabAddButton/TabAddButton.tsx` (Add tab), `TabName/TabName.tsx`, `hooks/export-tabs.ts`, `hooks/export-tab-name.ts`.

## Gotchas

These are div tabs, not ARIA tabs. The default macOS window and classic plus have no accessible name; select Editor via the UI before this modern-window recipe; do not use an arbitrary global button. Only multiple tabs expose Close. With one tab the per-tab export item is disabled with hint "Needs two tabs or more". Audit covers add/name/switch/close and ZIP, not drag order.
