# Settings and command menu

Configure layout and discover actions without leaving the editor.

## Sub-features

Inspector/Dock/Studio; side; Window/Orb/Aa cards; color mode; four languages; search reset; command preview/apply.

## How to get to it (user POV)

Click Settings in the header or press Cmd+K (Ctrl+K off Apple) for commands.

## Driving it with Playwright

Audit changes `[data-setting="panel-side"]` to Left, checks inspector geometry, restores Right, searches Settings then closes/reopens to assert search reset. It also selects Italian while Settings stays open, checks the translated Lingua title, and restores English via Inglese. Opens palette combobox Search themes and options and applies Dracula. Settings sections use `[data-settings-section="general|appearance|experiments|export|whats-new|about"]`. Layout/card radio values are inspector/dock/studio and window/orb/aa. Click associated visible labels if radio input is hidden. Reload after layout/card selection and check radios before Restore defaults.

Source: `prototypes/editor-controls/shell/SettingsDialog.tsx`, `shell/sections.tsx`, `shell/preferences.ts`, `command-menu/CommandMenu.tsx`.

## Gotchas

Palette refuses to open over another modal/popover. Close it first. Escape clears a nonempty search before closing; use the Close button for deterministic teardown. Audit only claims the actions it records; all layouts/locale/phone behavior need explicit runs. Preferences persist in localStorage `codeimage:prototype-settings`; a query v=2 forces Inspector.
