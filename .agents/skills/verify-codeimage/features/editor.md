# Edit code

Edit real CodeMirror documents in the unified guest and saved-project editor.

## Sub-features

Code entry, history, language choice, formatter choice, line numbers and the Format action.

## How to get to it (user POV)

Guests open `/`; `/classic` opens the older editor. Signed-in `/` is the dashboard. `/` opens the saved layout; the audit saves Inspector as the layout preference before load. The unified canvas toolbar offers Format code, and its command menu offers the same action. Classic keeps Format beside Randomize.

## Driving it with Playwright

Run the audit editor journey. Fill `.cm-content[contenteditable="true"]`, type a character and undo with `ControlOrMeta+z`; assert original text on both routes. The editor also has aria-label `codeimage-editor`, but theme preview editors carry the same label (`components/CustomEditor/CustomEditorPreview.tsx`), so it is not a unique selector. On unified Inspector expand `[data-section="editor"] > button` (titled Code), then choose language with `#inspector-editor-language-trigger`. Classic uses `button[aria-label="Language"]`. The unified editor formats through button `Format code` and classic through `Format` (exact names); it is disabled when the language has no formatter. Capture selected language and code when checking language/format behavior.

Source: `components/CustomEditor/CustomEditor.tsx`, `pages/UnifiedEditor/model.tsx`, `pages/UnifiedEditor/controls/fields.tsx`, `pages/UnifiedEditor/controls/FrameActions.tsx`, classic `components/Toolbar/FrameToolbar.tsx`.

The `editor-options` journey changes language to Python without changing the document, restores TypeScript, formats unformatted code and asserts formatted text. Formatter undo, the formatter select and line-number controls are not claimed. Classic Format has no audit case.

The `frame-cold-start` journey opens the guest editor with each saved layout at 1440×900 and 390×844, using the audit's fresh-context and doctor helpers. Its first run loads normally; its second delays `ManagedFrame` and the editable `TabName` module through Playwright routing. It records the placeholder and live frame on every animation frame, then checks every painted box against the resting box within 1px and checks that tab labels and the window header remain complete. The delayed run must actually observe both the placeholder and the read-only label while the input is loading.

The skill launcher clears Vite's dependency cache before starting its own server when this case is selected. Each context has empty document storage and its layout preference; it does not seed editor stores. `VERIFY_COLD_START_STRESS=1` expands the default twelve starts to 120, with twenty per layout/viewport pair. The default samples through half a second of editor/font readiness; stress mode uses two seconds. Per-frame JSON, measurements, screenshots and context traces are written outside the checkout under `ARTIFACT_DIR`.

## Gotchas

The baseline covers text replacement; the audit adds history on both routes. Language/formatter coverage requires explicitly exercising those controls. Do not count internal CodeMirror dispatch as user input.

The `snippet-read-only` case verifies that another owner's code cannot be edited and editing shortcuts send no save. See [saved projects](projects.md) for the full snippet matrix.

For startup geometry, a skeleton child can override inherited `visibility: hidden`; check the painted surface and ancestor opacity. Preserve samples across Vite's optimizer reload, and wait for the actual editable surface and fonts before declaring rest. The frame's lazy tab input must have the same visible label as its fallback, not an empty tab while the input module loads.
