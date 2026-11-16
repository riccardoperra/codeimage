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

## Spoiler

A spoiler hides any part of a line, or a range across lines, behind drifting particles. Select text and press the toolbar's `Spoiler` button (`[data-spoiler-toggle]`, `aria-pressed`) or Mod+Alt+5; pressing it again on a covered selection removes only that part. The editor draws `.cm-spoilerEdit` at reduced opacity so the author can still read and edit the value. Ranges are saved per line as `marks.spoilers: [{line, from, to}]` (0-based UTF-16 columns), follow edits and undo with the other marks, and map through script/diff projections. `StaticCodeView` and the animation compiler replace the hidden characters with spaces of the same width and draw `.cm-spoiler` boxes instead, so the value never reaches the export DOM, the PNG or the video job. A step whose tab shows the same code without the spoiler reveals it: the particles fade out by 60% while the text enters from 30%.

Audit `spoiler` resets the saved document, selects only `sk-live-123` inside a string with the keyboard, toggles the spoiler, checks the editor still shows the value and the export copy does not, downloads `spoiler-download.png`, waits for `"spoilers"` in the IndexedDB document, adds a second tab with the same code, seeks the Animate `Playhead` to the first hold, the middle and the end (`spoiler-stage-<ms>.png`), asserts the hold hides and the end reveals the value, exports an MP4, checks the first job scene has no secret text, and extracts frames as `spoiler-export-<s>.png`.
