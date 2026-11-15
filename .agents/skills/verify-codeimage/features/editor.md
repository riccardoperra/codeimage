# Edit code

Edit real CodeMirror documents in the unified guest editor and classic saved-project editor.

## Sub-features

Code entry, history, language choice, formatter choice, line numbers and the Format action.

## How to get to it (user POV)

Guests open `/`; `/classic` opens the older editor. Signed-in `/` is the dashboard. Bare `/` opens the saved layout; `/?v=2` forces Inspector, which is what the audit uses. Format is the button in the toolbar under the canvas, beside Randomize, on both editors; the command menu also offers Format code.

## Driving it with Playwright

Run the audit editor journey. Fill `.cm-content[contenteditable="true"]`, type a character and undo with `ControlOrMeta+z`; assert original text on both routes. The editor also has aria-label `codeimage-editor`, but theme preview editors carry the same label (`components/CustomEditor/CustomEditorPreview.tsx`), so it is not a unique selector. On unified Inspector expand `[data-section="editor"] > button` (titled Code), then choose language with `#inspector-editor-language-trigger`. Classic uses `button[aria-label="Language"]`. Both editors format through button `Format` (exact name); it is disabled when the language has no formatter. Capture selected language and code when checking language/format behavior.

Source: `components/CustomEditor/CustomEditor.tsx`, `prototypes/editor-controls/model.tsx`, `prototypes/editor-controls/controls/fields.tsx`, `prototypes/editor-controls/controls/FrameActions.tsx`, classic `components/Toolbar/FrameToolbar.tsx`.

The `editor-options` journey changes language to Python without changing the document, restores TypeScript, formats unformatted code and asserts formatted text. Formatter undo, the formatter select and line-number controls are not claimed. Classic Format has no audit case.

## Gotchas

The baseline covers text replacement; the audit adds history on both routes. Language/formatter coverage requires explicitly exercising those controls. Do not count internal CodeMirror dispatch as user input.
