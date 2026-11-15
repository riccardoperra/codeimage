# Appearance presets

Save reusable appearance choices without replacing document text.

## Sub-features

Create, apply, update, rename and delete presets; guest IndexedDB persistence and signed-in API synchronization.

## How to get to it (user POV)

Switch Settings → Experiments → Layout to Studio, then choose Presets from the rail. Inspector does not expose this panel. The public `/?v=4` route selects Studio too.

## Driving it with Playwright

The audit opens `/?v=4`, clicks button Presets, then the first Add preset button (the empty state exposes a second). Scope to alertdialog Add a new preset, fill its textbox and click Confirm. Assert the `li` containing Verification preset. Reload the same context, reopen Presets and click the saved item. Capture before/after and exported appearance. For an application regression, change a conspicuous theme before applying, then assert the previous theme returns while code remains unchanged. Menu actions live under each item's Preset menu.

Source: `apps/codeimage/src/prototypes/editor-controls/variants/studio/panels.tsx`, `localized/PresetSwitcher.tsx`, `state/presets/bridge.ts`.

## Gotchas

Studio is a required precondition, not an auth requirement for guest presets. Presets store appearance, signature and target settings, not code. The configured guest limit applies. Audit does not certify signed-in preset synchronization or every menu action. Disposable context cleanup removes its IndexedDB state.
