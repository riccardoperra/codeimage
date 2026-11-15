# Edit code

Edit real CodeMirror documents in the unified guest and saved-project editor.

## Sub-features

Code entry, history, language choice, formatter choice, line numbers and the Format action.

## How to get to it (user POV)

Guests open `/`; saved projects open at `/:snippetId`. Signed-in `/` is the dashboard. `/` opens the saved layout; the audit saves Inspector as the layout preference before load. Format is the button in the toolbar under the canvas, beside Randomize, in the unified editor; the command menu also offers Format code.

## Driving it with Playwright

Run the audit editor journey. Fill `.cm-content[contenteditable="true"]`, type a character and undo with `ControlOrMeta+z`; assert original text. The editor also has aria-label `codeimage-editor`, but theme preview editors carry the same label (`components/CustomEditor/CustomEditorPreview.tsx`), so it is not a unique selector. On unified Inspector expand `[data-section="editor"] > button` (titled Code), then choose language with `#inspector-editor-language-trigger`. The unified editor formats through button `Format` (exact name); it is disabled when the language has no formatter. Capture selected language and code when checking language/format behavior.

Source: `components/CustomEditor/CustomEditor.tsx`, `pages/UnifiedEditor/model.tsx`, `pages/UnifiedEditor/controls/fields.tsx`, `pages/UnifiedEditor/controls/FrameActions.tsx`.

The `editor-options` journey changes language to Python without changing the document, restores TypeScript, formats unformatted code and asserts formatted text. Formatter undo, the formatter select and line-number controls are not claimed.

## Gotchas

The baseline covers text replacement; the audit adds history on both routes. Language/formatter coverage requires explicitly exercising those controls. Do not count internal CodeMirror dispatch as user input.
