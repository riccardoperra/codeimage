# Appearance presets

Save reusable appearance choices without replacing document text.

## Sub-features

Create, apply, update, rename and delete presets; guest IndexedDB persistence and signed-in API synchronization.

## How to get to it (user POV)

Presets is a section of the Sidebar in both navigations: a rail button with the Rail, a section with the Accordion. Dock does not expose it.

## Driving it with Playwright

The audit saves Studio (the Sidebar's Rail) as the layout preference, opens `/`, clicks button Presets, then the first Add preset button (the empty state exposes a second). Scope to alertdialog Add a new preset, fill its textbox and click Confirm. Assert the `li` containing Verification preset. Reload the same context, reopen Presets and click the saved item; the case takes one `preset-reopened` screenshot and does not check that the appearance changed or export. For an application regression, change a conspicuous theme before applying, then assert the previous theme returns while code remains unchanged. Menu actions (Update, Rename, Share, Delete) live under each item's `Preset menu`; Share copies a `?share_preset=` link.

Source: `pages/UnifiedEditor/variants/sidebar/panels.tsx`, `pages/UnifiedEditor/localized/PresetSwitcher.tsx`, `state/presets/bridge.ts`.

Run `preset-management` to create a preset, rename it in the naming alertdialog, delete it through the menu and reload to assert absence. `preset-persistence` creates a Dracula preset with padding 128 and the watermark disabled, changes those choices, applies the preset, reloads, and checks the selected theme, padding, watermark and unchanged code. It also compares the persisted frame and terminal with the preset and the rendered window colours before and after reload. The same journey signs in, creates a saved snippet, applies the local preset, waits for its API save, reads it back and reloads again. Sharing and the limit remain separate coverage.

Run `VERIFY_AUDIT=1 VERIFY_CASES=preset-persistence node .agents/skills/verify-codeimage/scripts/verify.mjs` with Node 24. Evidence includes before-apply, applied and after-reload screenshots plus the disposable context trace. The backend mode is MSW; the preset and local document use IndexedDB, and the saved snippet uses the project mock API. The journey returns an empty account-preset list at the HTTP boundary and reuses the guest preset. It does not certify account-preset synchronization.

## Gotchas

The Rail is the precondition the audit uses, not an auth requirement for guest presets. Presets store appearance, signature and target settings, not code. The guest limit is `VITE_PRESET_LIMIT_GUEST` (the helper sets 5; `VITE_PRESET_LIMIT` 10 for signed-in users); at the limit Add preset is disabled. Audit does not certify signed-in preset synchronization or every menu action. Disposable context cleanup removes its IndexedDB state.
