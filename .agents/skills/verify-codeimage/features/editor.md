# Edit code

Edit real CodeMirror documents in the unified guest editor and classic saved-project editor.

## Sub-features

Code entry, history, language choice and formatting.

## How to get to it (user POV)

Guests open `/`; `/classic` opens the older editor. Signed-in `/` is the dashboard.

## Driving it with Playwright

Run the audit editor journey. Fill `.cm-content[contenteditable="true"]`, type a character and undo with `ControlOrMeta+z`; assert original text on both routes. The editor also has aria-label `codeimage-editor`. On unified Inspector expand `[data-section="editor"] > button` (titled Code), then choose language with `#inspector-editor-language-trigger`. Classic uses `button[aria-label="Language"]`. Capture selected language and code when checking language/format behavior.

Source: `components/CustomEditor/CustomEditor.tsx`, `prototypes/editor-controls/model.tsx`, `controls/fields.tsx` (paths relative to `apps/codeimage/src`).

## Gotchas

The baseline covers text replacement; the audit adds history on both routes. Language/formatter coverage requires explicitly exercising those controls. Do not count internal CodeMirror dispatch as user input.
