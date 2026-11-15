# Export images and animation

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

Clipboard is available for PNG/SVG and needs permission. Share requires navigator.share. Do not mock those browser APIs to claim native sharing. Redaction modifies documents. Animation is available in the unified guest editor; the classic editor and CLI are outside this export surface.

## MP4 animation

After Animate has saved at least two steps, the shared export action list offers Export animation in both the panel and the sheet. `[data-export-action="animation"]` opens its MP4 dialog through secrets review. MP4 is selected by default. The dialog saves 24/30/50/60 fps in the animation settings. Current frame respects a social target; 1920 × 1080 uses the same fitted-window layout at that resolution. Even-size padding extends only the last pixel row or column, preserving the frame background and opacity.

The nonmodal progress dialog moves into the corner while the worker renders and encodes. Cancel terminates the worker and closes without a download. A completed job downloads through downloadjs. Share is a separate action when navigator.canShare accepts the MP4 file. Starting export passes through secrets review again and recaptures the document, including redaction. An unsupported or missing WebCodecs H.264 configuration disables MP4 with a localized reason. A WASM failure shows its cause; animation has no DOM-export or WebM fallback.

Video fields are buttons named Frame rate and Output size, with kit listbox options. `[data-animation-export]` is the dialog; its progress element reports frames completed and total. Its alert includes preparation, WASM or encoder causes. Reopen the dialog or change a field to retry. FPS stays out of Animate. Native mobile sharing and real Safari still need platform checks.

## Animation audit

`animation-mp4` builds three steps through the Editor window's tab controls, opens Animate and Export animation, waits for the support check, exports a real MP4, checks its ftyp signature and moov-before-mdat faststart order, and confirms that the editor remains usable. It does not substitute for ffprobe, decoded-frame comparisons, the layout/error/cancel matrix or a performance run. Set `VERIFY_BROWSER_CHANNEL=chrome` to exercise branded Chrome with the same helper; otherwise it uses Playwright Chromium.
