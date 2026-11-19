# Line marks and diff import

Highlight, add/remove and focus code lines; import annotated code or unified diffs.

## Sub-features

Mark shortcuts/selection toolbar/gutter; annotation paste; multi-file unified diff import and Undo.

## How to get to it (user POV)

Select lines in the editor; use Cmd/Ctrl+Alt+1/2/3/4 for highlight/added/removed/focus, 0 clears the marks on the selected lines. A selection also shows toolbar `Line marks` (Highlight, Added, Removed, Focus, Clear). Hovering a line with the mouse reveals its gutter button `Line N: <mark>`, which opens menu `Line marks` (Added, Removed, Highlight, Focus, Remove mark). Paste a unified diff to reveal Import as diff; the raw diff stays in the editor until you import it.

## Driving it with Playwright

The `line-marks` journey highlights a selected line with the keyboard, asserts `[data-mark="highlight"]` in the first editable `.cm-content`, downloads a marked PNG and clears the mark. It pastes a unified diff through the clipboard, clicks Import as diff and checks the changed text and marks. Undo restores the raw pasted diff and removes the import's marks. For annotation coverage paste `const annotated = 1; // [!code ++]` and assert the annotation is stripped and an added mark appears. Focus marks lines `[data-focused=true]`; the audit counts them inside the first editable `.cm-content`. The editor also exposes `.cm-editor:not([data-static-code-view])[data-line-focus="true"]`; without the `:not` the static preview copy matches too.

Source: `components/CustomEditor/plugins/lineMarks/controls.ts`, `lineMarks/state.ts`, `lineMarks/gutter.ts`, `lineMarks/paste.ts`, `components/CustomEditor/CanvasEditor.tsx`, `core/diff/parseAnnotations.ts`, `core/diff/parseUnifiedDiff.ts`.

Run `annotations` to paste a real `[!code ++]` comment, assert the annotation disappears and an added mark appears, then apply and clear focus through keyboard shortcuts. It does not click the annotation Undo toast. Multi-file import history remains in the legacy specialist script.

## Gotchas

Use real clipboard input and treat clipboard permission errors as failures. The `line-marks` Undo check covers one file. Use the multi-file specialist journey to exercise tab history.

Run `line-mark-controls` for mouse and keyboard gutter menus, menu arrow keys, Escape focus return, marker arrow/Home/End navigation and reaching the marker again with Shift+Tab then Tab, side-panel scrolling with an open menu, selection-toolbar blur/refocus, and gutter range drags past both ends of the editor. It checks that the gutter remains aria-hidden while the marker buttons remain accessible through CodeMirror tooltips. Run `line-mark-controls-phone` for a fresh 390px touch context, minimum marker target size, menu containment, Added/Focus actions and absence of sticky hover. Both use real pointer/keyboard input with the owned MSW server.

`line-mark-tab-order` checks the Tab order around the editor: Escape then Shift+Tab focuses the cursor line's marker, Shift+Tab from the marker reaches the tab name before the editor, Tab returns to the marker and then enters the code, and Escape then Tab leaves for the first control after the frame. It also checks that the markers, menu and toolbar are fixed-position tooltips after the frame, outside the zoomed subtree and outside the export node. `line-mark-zoom` checks marker, menu and toolbar placement at zoom 1 and with a 90-line frame zoomed below 1, then fills 1200 lines so the frame overflows the canvas at the minimum zoom 0.1, scrolls the canvas so the cursor's first line is cut off and checks its marker is hidden, then clicks a line in the middle of the canvas and checks its marker is on screen in the gutter column. At zoom 0.1 with line numbers off the gutter column runs a few pixels away from the text far down the document (about 6.6px at line 1008), so that check records the drift instead of asserting the centring. `line-mark-layouts` opens Sidebar (`inspector`), Dock and Rail (`studio`) at 1440×1000 and checks the hovered marker and its menu in each. A placed marker is on screen, centred on its line, with its right edge on the gutter column's right edge (`.cm-lineMarkSlot`) and not past the code. `line-mark-export-clean` downloads a PNG and copies an image with the marker and selection toolbar on screen and compares the pixels with a clean export and a clean copy. `line-mark-rail-sheet-phone` opens a Rail sheet at 390px, checks the last line's marker is placed, opens its menu and checks it stays inside the canvas above the sheet, and that a marker moved over the sheet paints under it.

`line-mark-tab-order`, `line-mark-zoom`, `line-mark-layouts`, `line-mark-export-clean` and `line-mark-rail-sheet-phone` run once with line numbers off and once with them on, and record the results under `off` and `on`. They switch line numbers through the command menu (Ctrl/Cmd+K, `Toggle Line number`), which every layout has. With line numbers on, the export case also proves the downloaded and copied images match a clean export, so no marker reaches them.

CodeMirror reserves the width of `.cm-gutters` as a scroll margin and hides a clipped tooltip whose box falls inside it. The line marker sits left of the gutters, so with line numbers on a clipped marker, menu or dot was always hidden. These tooltips set `clip: false` and hide themselves instead: a marker or dot is placed off screen unless its line is in `view.visibleRanges` and the middle of its line is inside the popup space (then the box is clamped into that space), and the menu unless its line is visible and its anchor overlaps that space.

CodeMirror notices a blur after 10 ms, so a Shift+Tab pressed right after Escape can land before the editor knows it lost focus; the late update redraws the marker that just took the focus. `line-mark-tab-order` waits for the cursor marker to lose `data-active` after each Escape, as a person's next key would. `line-marks` clears leftover marks first: a clear made just before the previous case ends can be lost to the next reload.

`whats-new-line-marks-dot` checks the badge follows a canvas side change and that its coachmark survives a marker redraw while the pointer enters the editor. The native tooltip placement is invalidated by the page's layout changes and FitFrame's resize observer; the badge has no polling loop.
