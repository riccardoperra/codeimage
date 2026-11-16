# Appearance presets

Save reusable appearance choices without replacing document text.

## Sub-features

Create, apply, update, rename and delete presets; guest IndexedDB persistence and signed-in API synchronization.

## How to get to it (user POV)

Presets is a section of the Sidebar in both navigations: a rail button with the Rail, a section with the Accordion. Dock does not expose it.

## Driving it with Playwright

The audit saves Studio (the Sidebar's Rail) as the layout preference, opens `/`, clicks button Presets, then the first Add preset button (the empty state exposes a second). Scope to alertdialog Add a new preset, fill its textbox and click Confirm. Assert the `li` containing Verification preset. Reload the same context, reopen Presets and click the saved item; the case takes one `preset-reopened` screenshot and does not check that the appearance changed or export. For an application regression, change a conspicuous theme before applying, then assert the previous theme returns while code remains unchanged. Menu actions (Update, Rename, Share, Delete) live under each item's `Preset menu`; Share copies a `?share_preset=` link.

Source: `pages/UnifiedEditor/variants/sidebar/panels.tsx`, `pages/UnifiedEditor/localized/PresetSwitcher.tsx`, `state/presets/bridge.ts`.

Run `preset-management` to create a preset, rename it in the naming alertdialog, delete it through the menu and reload to assert absence. Applying a preset after deliberately changing appearance, sharing and the limit remain separate coverage.

## Gotchas

The Rail is the precondition the audit uses, not an auth requirement for guest presets. Presets store appearance, signature and target settings, not code. The guest limit is `VITE_PRESET_LIMIT_GUEST` (the helper sets 5; `VITE_PRESET_LIMIT` 10 for signed-in users); at the limit Add preset is disabled. Audit does not certify signed-in preset synchronization or every menu action. Disposable context cleanup removes its IndexedDB state.
