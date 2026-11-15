# Export images

Download current code through the direct unified export action.

## Sub-features

PNG/JPEG/SVG; per-tab ZIP; clipboard image and alt text; new tab; conditional Web Share; scale/quality; optional Takumi.

## How to get to it (user POV)

At `/`, Export downloads immediately. Arrow More ways to export opens actions and Export settings…. Classic Export opens a confirmation dialog.

## Driving it with Playwright

Baseline waits for a download before clicking `[data-export-image]` and decodes actual PNG. Audit changes `[data-setting="export-format"]` in Settings → Export to SVG, downloads and parses it, restores PNG, focuses `#settings-rendering-engine` and presses Space to enable it (the visible switch wrapper intercepts pointer clicks on its input) in Experiments, downloads Takumi PNG and rejects the renderer-fallback console error, then restores the engine. Tabs journey decodes ZIP members. For classic choose Export → PNG/SVG/JPEG → Confirm. Unified shortcuts come from `controls/shortcuts.ts` and are bound in ExportControl. On Apple platforms, Cmd+S downloads, Cmd+O opens a new tab and Cmd+Shift+C copies the image; Control+S/O/C remain supported. Elsewhere Ctrl+S/O/C keep those actions. Cmd+C stays text copy, and Control+C stays text copy while an editable field is focused. Exercise every combo and the secrets review when claiming shortcut coverage.

Source: `pages/UnifiedEditor/shell/ExportControl.tsx`, `shell/export.tsx`, `shell/sections.tsx`, `core/rasterize/takumi.ts`.

Run `export-options` for actual 1x and 2x PNG dimensions, JPEG magic bytes and alt-text clipboard contents. It restores PNG and 1x afterward. The Takumi case asserts the switch is checked before exporting and rejects fallback diagnostics.

## Gotchas

Clipboard is available for PNG/SVG and needs permission. Share requires navigator.share. Do not mock those browser APIs to claim native sharing. Redaction modifies documents. Animation core exists but no animation editor UI is wired at this HEAD; CLI and animation preview on other branches are excluded.
