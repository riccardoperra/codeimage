# Line marks and diff import

Highlight, add/remove and focus code lines; import annotated code or unified diffs.

## Sub-features

Mark shortcuts/selection toolbar/gutter; annotation paste; multi-file unified diff import and Undo.

## How to get to it (user POV)

Select lines in the editor; use Cmd/Ctrl+Alt+1/2/3/4 for highlight/added/removed/focus, 0 clears. Paste a unified diff to reveal Import as diff.

## Driving it with Playwright

Audit highlights a selected line through keyboard, asserts `[data-mark="highlight"]` scoped to the first editable `.cm-content` (the debug preview duplicates marks), exports marked PNG and clears. Paste a unified diff through actual clipboard and Cmd/Ctrl+V, click Import as diff, assert added marks and changed text, then Undo. For annotation coverage paste `const marked = 1; // [!code ++]`, assert annotation stripped and added mark, then Undo restores original. Focus exposes `.cm-editor[data-line-focus="true"]`.

Source: `components/CustomEditor/plugins/lineMarks/controls.ts`, `lineMarks/state.ts`, `CanvasEditor.tsx`, `core/diff/parseAnnotations.ts`.

## Gotchas

Use real clipboard input, not synthetic ClipboardEvent or store setters. Read clipboard permissions failures as failures. Audit covers highlight/clear and diff import, not every mark kind or annotation conversion. It invokes the toast Undo action; restoration of the full prior document/tab state needs a separate assertion before claiming Undo coverage.
