# Settings and command menu

Configure layout and discover actions without leaving the editor.

## Sub-features

Sidebar/Dock layouts; the Sidebar's Accordion/Rail navigation and side; Window/Orb/Aa list cards; color mode; four languages (Italian, English, German, Spanish); search reset; Restore defaults; command preview/apply; keyboard shortcut help.

## How to get to it (user POV)

Click Settings in the header or press Cmd+K (Ctrl+K off Apple) for commands. Press `?` outside the editor and inputs, or use the command menu, for the Keyboard shortcuts dialog.

## Driving it with Playwright

Audit changes `[data-setting="panel-side"]` to Left, checks inspector geometry, restores Right, searches Settings then closes/reopens to assert search reset. It also selects Italian while Settings stays open, checks the translated Lingua title, and restores English via Inglese. Opens palette combobox Search themes and options and applies Dracula. Settings sections use `[data-settings-section="general|appearance|experiments|export|whats-new|about"]`. Layout/card radio values are sidebar/dock and window/orb/aa. Appearance holds `[data-setting="panel-nav"]` (Accordion, Rail) and `[data-setting="panel-side"]`. Click associated visible labels if radio input is hidden. Reload after layout/card selection and check radios before Restore defaults.

Source: `pages/UnifiedEditor/shell/SettingsDialog.tsx`, `shell/sections.tsx`, `shell/preferences.ts`, `command-menu/CommandMenu.tsx`, `controls/ShortcutHelp.tsx`.

Run `settings-persistence` for Dock and Orb persisted across navigation to `/` without query overrides. It checks checked radios after reload, Restore defaults and the visible no-results message. Restore defaults resets layout and theme cards and switches the rendering engine back off Takumi; it leaves panel side unchanged.

## Gotchas

Palette refuses to open over another modal/popover. Close it first. Escape clears a nonempty search before closing; use the Close button for deterministic teardown. Audit only claims the actions it records; all layouts/locale/phone behavior need explicit runs. Preferences persist in localStorage `codeimage:editor-settings`; the layout and card style come only from there (no URL override). To force a layout before load, write that key, as `scripts/audit.mjs` does.
