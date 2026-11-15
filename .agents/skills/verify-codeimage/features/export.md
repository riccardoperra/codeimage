# Export images

Download current code through the direct unified export action.

## Sub-features

PNG/JPEG/SVG; per-tab ZIP; clipboard image and alt text; new tab; conditional Web Share; scale 1x/2x/3x/6x and JPEG quality; Redact all from the menu when secrets are found; optional Takumi.

## How to get to it (user POV)

At `/`, Export downloads immediately. The arrow button `More ways to export` (`[data-export-menu]`) opens menu items Export image, Export one image per tab (disabled with hint "Needs two tabs or more" until there are two tabs), Copy to clipboard, Open in new tab, Copy alt text, Redact all (only when a secret is detected) and Export settings…. Share your code appears only when `navigator.share` exists; headless Chromium has none. Classic Export opens a confirmation dialog.

## Driving it with Playwright

Baseline waits for a download before clicking `[data-export-image]` and decodes actual PNG. Audit changes `[data-setting="export-format"]` in Settings → Export to SVG, downloads and parses it, restores PNG, focuses `#settings-rendering-engine` and presses Space to enable it (the visible switch wrapper intercepts pointer clicks on its input) in Experiments, downloads Takumi PNG and rejects the renderer-fallback console error, then restores the engine. Tabs journey decodes ZIP members. For classic choose Export → PNG/SVG/JPEG → Confirm. Unified shortcuts are the literal Control key on every platform: Control+S exports, Control+O opens a new tab, Control+C copies the image when focus is outside the editor and inputs. Cmd+S does nothing on macOS. Exercise each when claiming shortcut coverage.

Source: `prototypes/editor-controls/shell/ExportControl.tsx`, `shell/export.tsx`, `shell/sections.tsx`, `core/rasterize/takumi.ts`.

Run `export-options` for actual 1x and 2x PNG dimensions, JPEG magic bytes and alt-text clipboard contents. It restores PNG and 1x afterward. The Takumi case asserts the switch is checked before exporting and rejects fallback diagnostics.

## Gotchas

Clipboard is available for PNG/SVG and needs permission. Share requires navigator.share. Do not mock those browser APIs to claim native sharing. Redaction modifies documents. Animation core exists but no animation editor UI is wired at this HEAD; CLI and animation preview on other branches are excluded.
