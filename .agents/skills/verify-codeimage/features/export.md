# Export images

Download current code through the direct unified export action.

## Sub-features

PNG/JPEG/SVG; per-tab ZIP; clipboard image and alt text; new tab; conditional Web Share; scale/quality; optional Takumi.

## How to get to it (user POV)

At `/`, Export downloads immediately. Arrow More ways to export opens actions and Export settings….

## Driving it with Playwright

Baseline waits for a download before clicking `[data-export-image]` and decodes actual PNG. The `exports` case changes `[data-setting="export-format"]` in Settings → Export to SVG, downloads it and checks the text contains `<svg`, restores PNG, focuses `#settings-rendering-engine` and presses Space to enable it (the visible switch wrapper intercepts pointer clicks on its input) in Experiments, downloads Takumi PNG and rejects the renderer-fallback console error, then restores the engine. Tabs journey decodes ZIP members. Unified shortcuts come from `controls/shortcuts.ts` and are bound in ExportControl. On Apple platforms, Cmd+S downloads, Cmd+O opens a new tab and Cmd+Shift+C copies the image; Control+S/O/C remain supported. Elsewhere Ctrl+S/O/C keep those actions. Cmd+C stays text copy, and Control+C stays text copy while an editable field is focused. Exercise every combo and the secrets review when claiming shortcut coverage.

Source: `pages/UnifiedEditor/shell/ExportControl.tsx`, `shell/export.tsx`, `shell/sections.tsx`, `core/rasterize/takumi.ts`.

Run `export-options` for actual 1x and 2x PNG dimensions, JPEG magic bytes and alt-text clipboard contents. It restores PNG and 1x afterward. The `exports` case also covers Takumi: it asserts the switch is checked before exporting and rejects fallback diagnostics.

Run `VERIFY_AUDIT=1 VERIFY_CASES=export-dialog node .agents/skills/verify-codeimage/scripts/verify.mjs` for the Dialog export style. The case switches styles in Settings, checks the decoded preview, dismisses with Escape and checks trigger focus. It downloads and parses a one-off SVG, then checks that PNG remains the default until saving SVG with Remember as default. Each SVG must contain the editor text and have positive dimensions.

Run `export-notification` to check the notification after a PNG download. The case selects Copy alt text, checks that the success notification closes, and reads the exported code from the clipboard.

Run `export-fractional-geometry,export-padding-geometry` for fractional frame measurement and padding-only signature changes. The cases edit short, sample and long code through CodeMirror, fit the long document on desktop and phone, change padding and switch Card to Minimal through the signature controls. They compare live and export border boxes and decode real 1x/2x PNG downloads. At zoom 1, fractional geometry must match within 0.02 CSS pixels; fitted text allows one screen pixel of layout snapping. The signature case tolerates integer rounding but rejects stale reserved padding independently of fractional precision.

Each case saves its geometry JSON, screenshots, traces, downloaded PNGs and persisted document snapshots. To compare those actual downloads with the CLI, run `scripts/parity/cli-vs-web/index.ts` with the corresponding `<name>-1x.json` / `<name>-2x.json` inputs and `P10_WEB_EXPORTS=<audit artifact directory>`. `P10_WEB_OUT` selects the comparison directory. The runner records both sizes and pixelmatch percentages in `results.json`; a size mismatch fails without hiding later documents. Omit `P10_WEB_EXPORTS` for the existing static preview fixture comparison.

Run `export-screen-parity` for twelve PNG/screen comparisons: Inspector, Dock and Studio, each with one/two named tabs and the window header shown/hidden. The audit's fresh-context helper opens each layout at 1440×900. It chooses PNG and 1x in Settings, fills real CodeMirror and tab-name inputs, adds a tab through the window button, and toggles Header through the command menu. Downloads use the audit's Export-button helper; no editor stores or exporter internals are called.

The case asserts live zoom 1, exact decoded PNG/screen pixel dimensions, a visible watermark offset below 1px, and pixelmatch threshold 0.1 with at most 0.5% differing pixels (the `scripts/parity/` tolerance). Geometry, PNGs, screen captures, diffs and traces are saved under `ARTIFACT_DIR`. The fixture ends with a blank line so the watermark can remain at home rather than testing collision relocation, which belongs to `watermark`.

## Gotchas

Copy image always writes a PNG, whatever export format is chosen, and is disabled only when `navigator.clipboard.write` is missing; it needs clipboard permission. Share requires navigator.share. Do not mock those browser APIs to claim native sharing. Redaction modifies documents. Animation is available in the unified guest editor; the classic editor and CLI are outside this export surface.

`snippet-read-only` verifies a real PNG download and clipboard PNG from another owner's snippet in all three layouts at desktop and phone sizes. See [saved projects](projects.md).

Move the pointer to Export before capturing: leaving a theme card cancels its preview. Align the screen capture to a device-pixel origin with layout offsets, not a transform that changes text rasterization. Freeze the measured frame size while removing the same editing controls export excludes; otherwise close-button spacing or rounded screenshot bounds produce false differences. Compare the rendered watermark SVG as well as the pixels, since a 2px logo offset can occupy less than 0.5% of an image.

## Animation MP4

With Animate open, Export video and its arrow open the video settings in the existing export popover. Export as image closes Animate and opens the image choices. With Animate closed, image export keeps its existing controls and shortcuts. Two saved steps enable MP4.

Video settings offer 24, 30, 50 or 60 fps, Current frame or 1920 × 1080, and 1×, 2× or 3× for a current frame without a social target. The default scale is 2×. Social targets and 1080p retain their static window layout and fixed output pixels. Current frame measures each step at its natural size and uses the largest width and height for the clip, as the CLI does. The active tab, editor resizing and page reloads do not change that measurement. Code runs retain their intrinsic width in Takumi so token boundaries cannot introduce line wrapping.

MP4 has no alpha. A visible frame paints its background across the video canvas behind the scene. A hidden or fully transparent frame uses the Solid background colour field, initially the theme's editor background. Static PNG export retains alpha.

Animation scenes exclude their own background after watermark placement. The canvas paints one gradient or image at the selected opacity, so a smaller step cannot restart the background inside the clip.

`[data-animation-export]` contains the video settings and an accessible progress bar styled with UI tokens. Cancel terminates the worker. Completed jobs download an MP4; Share MP4 appears when both navigator.share and navigator.canShare support that file. The start action repeats secrets review and captures any redaction. Missing WebCodecs and rejected configurations disable MP4 with a localized reason and select GIF. Worker load, message, renderer, font and encoder failures show a localized cause and Retry. The worker load message explains offline and stale deployment files. There is no WebM fallback.

## Animation audit

The cases use fresh guest contexts, the skill's owned server and MSW boundary, visible editor controls and real downloaded files. Install ffmpeg and ffprobe before running them. Use `VERIFY_BROWSER_CHANNEL=chrome` for branded Chrome.

- `animation-mp4`: a 22-line, three-step project in Inspector, Dock and Studio, plus 1080p60. ffprobe checks High-profile H.264, yuv420p, limited BT.709, dimensions, frame count, fps and duration. A box-length walk verifies faststart. Worker messages and Long Tasks record preparation and encoding observations. `VERIFY_WEBKIT=1` also replays a short hold from the captured job in WebKit and records its stream metadata as best-effort evidence.
- `animation-mp4-errors`: abort the worker script, assert the visible cause, retry to a real MP4, dispatch a message decoding error, block WASM and confirm that the editor remains usable.
- `animation-mp4-compositing`: inspect a decoded rounded corner, compare 2× with 1× dimensions, hide the frame and inspect the chosen solid colour in the decoded MP4.
- `animation-mp4-modes`: check image controls with Animate closed, direct MP4 settings from the main button and arrow with Animate open, the return to image export, and the animation title and redaction path in secrets review.
- `animation-mp4-parity`: type the two Counter steps with the createSignal line and download each static PNG at 2×. Compare the code in both decoded holds against those PNGs, accounting for the natural frame's position. Repeat after a real editor resize and require identical decoded frame hashes. A pixel scan rejects syntax text on the blank line after createSignal. The code comparison uses pixelmatch threshold 0.15 and a 3% limit for H.264 compression.
- `animation-mp4-step-size` and `animation-gif-step-size`: create a one-line step and a wider twelve-line step through visible controls. Export with each tab active, before and after reload, in Inspector, Dock and Studio. Decode every downloaded frame with FFmpeg and require identical pixel and timing hashes across all twelve exports per format. Compare the tallest step's full last line against an independent static PNG, check that the smaller window stays narrower, and scan padding for gradient seams. Each case saves the project JSON, scene jobs, decoded holds, last-line template and measurements. The short step also exports with the frame hidden over `#f0a020`: its window must be at least 480 px wide, and its full watermark must clear the code. A wide step with a signature verifies the static scale for the fixed canvas width, constant across all scenes, with space reserved below the code. `VERIFY_STATIC_BASELINE` can point to an evidence directory from main to require byte-identical static PNGs. `VERIFY_STEP_STATIC_ONLY=1` downloads just those references.

Native file sharing and real Safari remain platform checks.

## Animation GIF

The same Animate export settings offer MP4 (default) and GIF. GIF defaults to 25 fps, with 50 fps selectable. Explicit choices persist when the saved schema supports the rate. Returning to a format shows that saved rate when supported; export-only 25 fps remains remembered for GIF. Automatic format conversion never changes saved settings. A retained or selected 60 fps choice shows `[data-gif-fps-note]` and samples/plays at 50 fps. Both formats use the same animation job, scene capture, opaque background, 1×/2×/3× scale, secrets review, progress, cancellation and error handling. Missing WebCodecs or an unsupported MP4 configuration selects GIF, disables MP4 and keeps its localized reason visible.

`core/video/formats.ts` owns the format metadata, encoders, fps choices and estimates. `[data-animation-size-estimate]` shows an approximate size before encoding. GIF estimates text area and background compression separately, with scale-aware text costs and 20% headroom. Solid colours and hidden frames use the small background term. Gradients and image backgrounds use the detailed term. The exposed background charge uses the fixed canvas area minus each step's measured window area, including natural canvases. It ramps with area up to 1080p and grows more slowly when upscaled. Its frame budget follows the global export clock, merges holds, and collapses the compiler’s fade pauses. Further quantization merges can reduce the actual frame count. At an estimated 8 MB or more, `[data-gif-suggestion]` suggests MP4. This is an estimate, not a file-size guarantee. The actual size appears on completion. GIF is opaque, uses one global palette sampled from every visible hold and each half-transition midpoint, stable exact-colour mapping with no dithering, full-frame disposal 1, and merges consecutive identical indexed frames. Palette samples are bounded to 262,144 pixels each and 4,194,304 pixels combined; the worker retains no full clip of raw frames.

- `animation-gif`: visible three-step fixture, exact three-second timing, real GIF downloads in Inspector/Dock/Studio at 25 fps, MP4-default checks, estimated size, 30/24/50/60 fps round trips with saved IndexedDB values, explicit GIF 50/60 fps selections followed by MP4 and dialog reopen, encoded-only progress totals, a worker Cancel acknowledgement under 750 ms, retained 60→50 note, 1080p size suggestion, cancellation and typing afterward. At 25 and 50 fps, the libwebp-checked decoder from #762 compares every shown frame against the captured job re-rendered by Takumi WASM. It checks total delay, no local palettes, merged holds, opacity, holes/ghosts, zero unchanged-pixel flicker, mean channel error below 2 levels and worst channel error at most 65 (the bakeoff's clip bound). Contact sheets show raw frames above decoded GIF frames. Set `VERIFY_GIF_RUNS=5` for five interleaved exports per rate; repeat files overwrite their previous version to bound evidence size. The audit records the longest main-thread task for each export. JSON records size, wall time, worker render/elapsed time, core count and system load.
- `animation-gif-estimates`: isolated real downloads cover solid colours, gradients, 1080p, square and portrait targets, 1× and 2×, three and twelve lines, a hidden frame, long clips near the 8 MB hint threshold, 50 fps, the short third hold with unique pink strings, and mixed-size gradient steps at 1× and 2×. The mixed fixture combines one line, a roughly 150-character line, thirty lines, and six lines. JSON records the exact estimate, downloaded bytes, frame budget and decoded frame count. Every download of at least 8 MB must have shown the MP4 suggestion, and every file below 6 MB must omit it. The long solid fixture must omit it too. Estimates must stay between 10% low and 30% high. Calibration and held-out fixture labels are recorded in the audit results. `VERIFY_GIF_FIXTURES` accepts comma-separated fixture names for scoped retries.
- `animation-gif-fallback`: force rejected H.264 and missing WebCodecs independently, assert selected GIF/disabled MP4/reason, then download and decode a real GIF in each case.

Run `VERIFY_AUDIT=1 VERIFY_CASES=animation-gif,animation-gif-fallback VERIFY_BROWSER_CHANNEL=chrome node .agents/skills/verify-codeimage/scripts/verify.mjs`. Node 24's built-in type stripping loads the shared decoder. `scripts/parity/animation-gif.ts` runs the encoder comparison with the built SSR assets from `packages/render`. The web audit runs against the Vite app. Firefox, WebKit and native Safari playback remain best-effort manual checks.
