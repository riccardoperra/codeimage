# Appearance presets

Save reusable appearance choices without replacing document text.

## Sub-features

Create, apply, update, rename and delete presets; guest IndexedDB persistence and signed-in API synchronization.

## How to get to it (user POV)

Switch Settings → Experiments → Layout to Studio, then choose Presets from the rail. Inspector and Dock do not expose this panel. The classic editor (`/classic`, saved project URLs) has its own panel behind button `Show your presets`.

## Driving it with Playwright

The audit saves Studio as the layout preference, opens `/`, clicks button Presets, then the first Add preset button (the empty state exposes a second). Scope to alertdialog Add a new preset, fill its textbox and click Confirm. Assert the `li` containing Verification preset. Reload the same context, reopen Presets and click the saved item. Capture before/after and exported appearance. For an application regression, change a conspicuous theme before applying, then assert the previous theme returns while code remains unchanged. Menu actions (Update, Rename, Share, Delete) live under each item's `Preset menu`; Share copies a `?share_preset=` link.

Source: `pages/UnifiedEditor/variants/studio/panels.tsx`, `pages/UnifiedEditor/localized/PresetSwitcher.tsx`, `state/presets/bridge.ts`, classic `pages/Editor/components/LeftSidebar.tsx`.

Run `preset-management` to create a preset, rename it in the naming alertdialog, delete it through the menu and reload to assert absence. Applying a preset after deliberately changing appearance, sharing and the limit remain separate coverage.

## Gotchas

Studio is a required precondition, not an auth requirement for guest presets. Presets store appearance, signature and target settings, not code. The guest limit is `VITE_PRESET_LIMIT_GUEST` (the helper sets 5; `VITE_PRESET_LIMIT` 10 for signed-in users); at the limit Add preset is disabled. Audit does not certify signed-in preset synchronization or every menu action. Disposable context cleanup removes its IndexedDB state.
