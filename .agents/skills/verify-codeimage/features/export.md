# Export images

Download current code through the direct unified export action.

## Sub-features

PNG/JPEG/SVG; per-tab ZIP; clipboard image and alt text; new tab; conditional Web Share; scale/quality; optional Takumi.

## How to get to it (user POV)

At `/`, Export downloads immediately. Arrow More ways to export opens actions and Export settings….

## Driving it with Playwright

Baseline waits for a download before clicking `[data-export-image]` and decodes actual PNG. Audit changes `[data-setting="export-format"]` in Settings → Export to SVG, downloads and parses it, restores PNG, focuses `#settings-rendering-engine` and presses Space to enable it (the visible switch wrapper intercepts pointer clicks on its input) in Experiments, downloads Takumi PNG and rejects the renderer-fallback console error, then restores the engine. Tabs journey decodes ZIP members. Unified shortcuts come from `controls/shortcuts.ts` and are bound in ExportControl. On Apple platforms, Cmd+S downloads, Cmd+O opens a new tab and Cmd+Shift+C copies the image; Control+S/O/C remain supported. Elsewhere Ctrl+S/O/C keep those actions. Cmd+C stays text copy, and Control+C stays text copy while an editable field is focused. Exercise every combo and the secrets review when claiming shortcut coverage.

Source: `pages/UnifiedEditor/shell/ExportControl.tsx`, `shell/export.tsx`, `shell/sections.tsx`, `core/rasterize/takumi.ts`.

Run `export-options` for actual 1x and 2x PNG dimensions, JPEG magic bytes and alt-text clipboard contents. It restores PNG and 1x afterward. The Takumi case asserts the switch is checked before exporting and rejects fallback diagnostics.

Run `export-screen-parity` for twelve PNG/screen comparisons: Inspector, Dock and Studio, each with one/two named tabs and the window header shown/hidden. The audit's fresh-context helper opens each layout at 1440×900. It chooses PNG and 1x in Settings, fills real CodeMirror and tab-name inputs, adds a tab through the window button, and toggles Header through the command menu. Downloads use the audit's Export-button helper; no editor stores or exporter internals are called.

The case asserts live zoom 1, exact decoded PNG/screen pixel dimensions, a visible watermark offset below 1px, and pixelmatch threshold 0.1 with at most 0.5% differing pixels (the `scripts/parity/` tolerance). Geometry, PNGs, screen captures, diffs and traces are saved under `ARTIFACT_DIR`. The fixture ends with a blank line so the watermark can remain at home rather than testing collision relocation, which belongs to `watermark`.

## Gotchas

Clipboard is available for PNG/SVG and needs permission. Share requires navigator.share. Do not mock those browser APIs to claim native sharing. Redaction modifies documents. Animation is available in the unified guest editor; the classic editor and CLI are outside this export surface.

`snippet-read-only` verifies a real PNG download and clipboard PNG from another owner's snippet in all three layouts at desktop and phone sizes. See [saved projects](projects.md).

Move the pointer to Export before capturing: leaving a theme card cancels its preview. Align the screen capture to a device-pixel origin with layout offsets, not a transform that changes text rasterization. Freeze the measured frame size while removing the same editing controls export excludes; otherwise close-button spacing or rounded screenshot bounds produce false differences. Compare the rendered watermark SVG as well as the pixels, since a 2px logo offset can occupy less than 0.5% of an image.

## Animation MP4

With Animate open, Export video and its arrow open the video settings in the existing export popover. Export as image closes Animate and opens the image choices. With Animate closed, image export keeps its existing controls and shortcuts. Two saved steps enable MP4.

Video settings offer 24, 30, 50 or 60 fps, Current frame or 1920 × 1080, and 1×, 2× or 3× for a current frame without a social target. The default scale is 2×. Social targets and 1080p retain their static window layout and fixed output pixels. The current frame uses the editor's measured dimensions, including manual resizing. Code runs retain their intrinsic width in Takumi so token boundaries cannot introduce line wrapping.

MP4 has no alpha. A visible frame paints its background across the video canvas behind the scene. A hidden or fully transparent frame uses the Solid background colour field, initially the theme's editor background. Static PNG export retains alpha.

`[data-animation-export]` contains the video settings and a Kobalte progressbar styled with UI tokens. Cancel terminates the worker. Completed jobs download an MP4; Share MP4 appears when both navigator.share and navigator.canShare support that file. The start action repeats secrets review and captures any redaction. Missing WebCodecs and rejected configurations disable MP4 with a localized reason and select GIF. Worker load, message, renderer, font and encoder failures show a localized cause and Retry. The worker load message explains offline and stale deployment files. There is no WebM fallback.

## Animation audit

The cases use fresh guest contexts, the skill's owned server and MSW boundary, visible editor controls and real downloaded files. Install ffmpeg and ffprobe before running them. Use `VERIFY_BROWSER_CHANNEL=chrome` for branded Chrome.

- `animation-mp4`: a 22-line, three-step project in Inspector, Dock and Studio, plus 1080p60. ffprobe checks High-profile H.264, yuv420p, limited BT.709, dimensions, frame count, fps and duration. A box-length walk verifies faststart. Worker messages and Long Tasks record preparation and encoding observations. `VERIFY_WEBKIT=1` also replays a short hold from the captured job in WebKit and records its stream metadata as best-effort evidence.
- `animation-mp4-errors`: abort the worker script, assert the visible cause, retry to a real MP4, dispatch a message decoding error, block WASM and confirm that the editor remains usable.
- `animation-mp4-compositing`: inspect a decoded rounded corner, compare 2× with 1× dimensions, hide the frame and inspect the chosen solid colour in the decoded MP4.
- `animation-mp4-modes`: check image controls with Animate closed, direct MP4 settings from the main button and arrow with Animate open, the return to image export, and the animation title and redaction path in secrets review.
- `animation-mp4-parity`: type the two Counter steps with the createSignal line, download each static PNG at 2× and compare both decoded hold frames at the current size and after a real frame resize. A pixel scan rejects syntax text on the blank line after createSignal, so whole-frame compression tolerance cannot hide wrapping. The comparison uses pixelmatch threshold 0.15 and a 3% limit to include H.264 compression while rejecting a changed line layout.

Native file sharing and real Safari remain platform checks.

## Animation GIF

The same Animate export settings offer MP4 (default) and GIF. GIF defaults to 25 fps, with 50 fps selectable. A retained or selected 60 fps choice shows `[data-gif-fps-note]` and samples/plays at 50 fps. Both formats use the same animation job, scene capture, opaque background, 1×/2×/3× scale, secrets review, progress, cancellation and error handling. Missing WebCodecs or an unsupported MP4 configuration selects GIF, disables MP4 and keeps its localized reason visible.

`core/video/formats.ts` owns the format metadata, encoders, fps choices and estimates. `[data-animation-size-estimate]` shows an approximate size before encoding. GIF uses 0.043 bytes × pixels × estimated distinct frames; holds count once. Above 8 MB, `[data-gif-suggestion]` suggests MP4. This is an estimate, not a file-size guarantee. The actual size appears on completion. GIF is opaque, uses one global palette sampled from up to sixteen frames, stable exact-colour mapping with no dithering, full-frame disposal 1, and merges consecutive identical indexed frames. Palette samples are bounded to 262,144 pixels each; the worker retains no full clip of raw frames.

- `animation-gif`: visible three-step fixture, exact three-second timing, real GIF downloads in Inspector/Dock/Studio at 25 fps, MP4-default checks, estimated size, retained 60→50 note, 1080p size suggestion, cancellation and typing afterward. At 25 and 50 fps, the libwebp-checked decoder from #762 compares every shown frame against the captured job re-rendered by Takumi WASM. It checks total delay, no local palettes, merged holds, opacity, holes/ghosts, zero unchanged-pixel flicker, mean channel error below 2 levels and worst channel error at most 65 (the bakeoff's clip bound). Contact sheets show raw frames above decoded GIF frames. Set `VERIFY_GIF_RUNS=5` for five interleaved exports per rate; repeat files overwrite their previous version to bound evidence size. The audit records the longest main-thread task for each export. JSON records size, wall time, worker render/elapsed time, core count and system load.
- `animation-gif-fallback`: force rejected H.264 and missing WebCodecs independently, assert selected GIF/disabled MP4/reason, then download and decode a real GIF in each case.

Run `VERIFY_AUDIT=1 VERIFY_CASES=animation-gif,animation-gif-fallback VERIFY_BROWSER_CHANNEL=chrome node .agents/skills/verify-codeimage/scripts/verify.mjs`. Node 24's built-in type stripping loads the shared decoder. `scripts/parity/animation-gif.ts` preserves #762's full encoder bakeoff, including its decoder, via a shared module. That bakeoff still requires the separate `packages/render` branch from #726 (including its built SSR assets); current main does not contain it. The web audit above has no such dependency. Firefox, WebKit and native Safari playback remain best-effort/manual platform checks.
