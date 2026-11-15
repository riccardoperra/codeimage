# Export images and animation

Download current code through the direct unified export action.

## Sub-features

PNG/JPEG/SVG; per-tab ZIP; clipboard image and alt text; new tab; conditional Web Share; scale 1x/2x/3x/6x and JPEG quality; Redact all from the menu when secrets are found; optional Takumi. MP4 animation at 24/30/50/60 fps, current frame or 1920 × 1080 output, estimated size and duration, worker progress, cancellation, automatic download and conditional file sharing.

## How to get to it (user POV)

At `/`, Export downloads immediately. The arrow button `More ways to export` (`[data-export-menu]`) opens menu items Export image, Export one image per tab (disabled with hint "Needs two tabs or more" until there are two tabs), Copy to clipboard, Open in new tab, Copy alt text, Redact all (only when a secret is detected) and Export settings…. Share your code appears only when `navigator.share` exists; headless Chromium has none. Classic Export opens a confirmation dialog. After Animate has saved at least two steps, the unified menu also offers Export animation. MP4 is selected by default. The dialog saves its frame rate to the animation settings; Current frame respects an existing social target. The 1920 × 1080 option plans the same fitted-window layout at that resolution. Even-size padding extends only the last pixel row or column, preserving the frame background and opacity. During rendering the nonmodal dialog moves to the corner so code can still be edited. Cancel terminates the worker and closes the dialog without a download. A completed job downloads with the same downloadjs path as images; Share is a separate user action when navigator.canShare accepts the MP4 file.

## Driving it with Playwright

Baseline waits for a download before clicking `[data-export-image]` and decodes actual PNG. Audit changes `[data-setting="export-format"]` in Settings → Export to SVG, downloads and parses it, restores PNG, focuses `#settings-rendering-engine` and presses Space to enable it (the visible switch wrapper intercepts pointer clicks on its input) in Experiments, downloads Takumi PNG and rejects the renderer-fallback console error, then restores the engine. Tabs journey decodes ZIP members. For classic choose Export → PNG/SVG/JPEG → Confirm. Unified shortcuts are the literal Control key on every platform: Control+S exports, Control+O opens a new tab, Control+C copies the image when focus is outside the editor and inputs. Cmd+S does nothing on macOS. Exercise each when claiming shortcut coverage.

Source: `pages/UnifiedEditor/shell/ExportControl.tsx`, `shell/export.tsx`, `shell/sections.tsx`, `core/rasterize/takumi.ts`, `shell/export-animation.tsx`, `shell/export-animation-dialog.tsx`, `hooks/use-export-animation.ts`, `workers/animation.worker.ts`, `core/video/`.

Run `export-options` for actual 1x and 2x PNG dimensions, JPEG magic bytes and alt-text clipboard contents. It restores PNG and 1x afterward. The Takumi case asserts the switch is checked before exporting and rejects fallback diagnostics.

## Gotchas

Clipboard is available for PNG/SVG and needs permission. Share requires navigator.share. Do not mock those browser APIs to claim native sharing. Redaction modifies documents. Animation export is available in the guest unified editor. The classic editor has no animation export. Both opening the video dialog and starting the job pass through the secrets review. The document is recaptured after review so redaction is included. MP4 needs the exact WebCodecs H.264 configuration to pass isConfigSupported. Unsupported or missing encoders disable MP4 with a localized reason; no WebM fallback is offered. A WASM failure is shown in the dialog with its cause. Native mobile sharing and real Safari still need platform checks.

## Animation audit

`animation-mp4` builds three steps through the Editor window's tab controls, opens Animate and Export animation, waits for the support check, exports a real MP4, checks its ftyp signature and moov-before-mdat faststart order, and confirms that the editor remains usable. It does not substitute for ffprobe, decoded-frame comparisons, the layout/error/cancel matrix or a performance run. Set `VERIFY_BROWSER_CHANNEL=chrome` to exercise branded Chrome with the same helper; otherwise it uses Playwright Chromium.

Video fields are buttons named Frame rate and Output size, with kit listbox options. `[data-animation-export]` is the dialog; its progress element reports frames completed and total. Its alert includes preparation, WASM or encoder causes. After a failure, reopen the dialog or change a field to check support again. FPS is set only here, never in Animate.
