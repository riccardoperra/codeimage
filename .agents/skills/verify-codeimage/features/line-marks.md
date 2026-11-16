# Line marks and diff import

Highlight, add/remove and focus code lines; import annotated code or unified diffs.

## Sub-features

Mark shortcuts/selection toolbar/gutter; annotation paste; multi-file unified diff import and Undo.

## How to get to it (user POV)

Select lines in the editor; use Cmd/Ctrl+Alt+1/2/3/4 for highlight/added/removed/focus, 0 clears the marks on the selected lines. A selection also shows toolbar `Line marks` (Highlight, Added, Removed, Focus, Clear). Hovering a line with the mouse reveals its gutter button `Line N: <mark>`, which opens menu `Line marks` (Added, Removed, Highlight, Focus, Remove mark). Paste a unified diff to reveal Import as diff; the raw diff stays in the editor until you import it.

## Driving it with Playwright

Audit highlights a selected line through keyboard, asserts `[data-mark="highlight"]` scoped to the first editable `.cm-content` (the debug preview duplicates marks), exports marked PNG and clears. Paste a unified diff through actual clipboard and Cmd/Ctrl+V, click Import as diff, assert added marks and changed text, then Undo. For annotation coverage paste `const annotated = 1; // [!code ++]` and assert the annotation is stripped and an added mark appears. Focus marks lines `[data-focused=true]`; the audit counts them inside the first editable `.cm-content`. The editor also exposes `.cm-editor:not([data-static-code-view])[data-line-focus="true"]`; without the `:not` the static preview copy matches too.

Source: `components/CustomEditor/plugins/lineMarks/controls.ts`, `lineMarks/state.ts`, `lineMarks/gutter.ts`, `lineMarks/paste.ts`, `components/CustomEditor/CanvasEditor.tsx`, `core/diff/parseAnnotations.ts`, `core/diff/parseUnifiedDiff.ts`.

Run `annotations` to paste a real `[!code ++]` comment, assert the annotation disappears and an added mark appears, then apply and clear focus through keyboard shortcuts. It does not click the annotation Undo toast. Multi-file import history remains in the legacy specialist script.

## Gotchas

Use real clipboard input, not synthetic ClipboardEvent or store setters. Read clipboard permissions failures as failures. Audit covers highlight/clear and diff import, not every mark kind; the separate annotations journey now covers annotation conversion. It invokes the toast Undo action; restoration of the full prior document/tab state needs a separate assertion before claiming Undo coverage.

Run `line-mark-controls` for mouse and keyboard gutter menus, menu arrow keys, Escape focus return, marker arrow/Home/End navigation and reaching the marker again with Shift+Tab then Tab, side-panel scrolling with an open menu, selection-toolbar blur/refocus, and gutter range drags past both ends of the editor. It checks that the gutter remains aria-hidden while the marker buttons remain accessible through CodeMirror tooltips. Run `line-mark-controls-phone` for a fresh 390px touch context, minimum marker target size, menu containment, Added/Focus actions and absence of sticky hover. Both use real pointer/keyboard input with the owned MSW server.

`line-mark-tab-order` checks the Tab order around the editor: Escape then Shift+Tab focuses the cursor line's marker, Shift+Tab from the marker reaches the tab name before the editor, Tab returns to the marker and then enters the code, and Escape then Tab leaves for the first control after the frame. It also checks that the markers, menu and toolbar are fixed-position tooltips after the frame, outside the zoomed subtree and outside the export node. `line-mark-zoom` checks marker, menu and toolbar placement at zoom 1 and with a 90-line frame zoomed below 1, with line numbers off. `line-mark-export-clean` downloads a PNG and copies an image with the marker and selection toolbar on screen and compares the pixels with a clean export and a clean copy. `line-mark-rail-sheet-phone` opens a Rail sheet at 390px, opens the menu on the last line and checks it stays inside the canvas above the sheet, and that a marker moved over the sheet paints under it.

With line numbers on, the marker tooltips are hidden: CodeMirror reserves the gutter width as a scroll margin and hides a tooltip whose right edge falls inside it. The new placement cases switch line numbers off first.

`whats-new-line-marks-dot` checks the badge follows a canvas side change and that its coachmark survives a marker redraw while the pointer enters the editor. The native tooltip placement is invalidated by the page's layout changes and FitFrame's resize observer; the badge has no polling loop.
