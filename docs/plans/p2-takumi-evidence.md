# P2 verification

Chrome is the parity reference. The gate is at most 0.5% different pixels with pixelmatch 7.1.0 at threshold 0.1. dom-export comparisons are informational.

The run uses Playwright 1.57.0 and cached Chromium 1200 on macOS. The app runs in the Vite development server with mock auth. The harness supplies the installed Inter files for the existing development URL that returns 404. It temporarily installs the matching MSW worker and restores the tracked worker in `finally`.

## Reference

The harness launches Chromium with `--force-device-scale-factor=2`. With only an emulated `deviceScaleFactor`, Chrome lays out in CSS pixels and snaps each text baseline to a whole CSS pixel, so code lines advance by 44 and 46 device pixels in turn. Headed Chrome on a Retina display, and headless Chrome with a native scale factor, lay out in device pixels and advance by 45, 45, 44, 45. Takumi follows the native behavior.

The earlier emulated reference caused the 0.9794% difference on the 300-line export. On lines where both renderers put the baseline on the same device pixel, each line differed by about 2 pixels. Lines that Chrome had moved by 1 or 2 device pixels held 99.9% of the difference.

## Component spike

The terminal header inherited its UI font from the document. The isolated export selected the code font instead of the inherited UI font. The shared header now declares the existing Inter stack explicitly.

Takumi 2.19 drew the watermark logo with a cut box and misplaced stripes. P3 traced it to Takumi doubling SVG `rect` geometry and `transform` attributes above pixel ratio 1. The logo now draws those six shapes as equivalent cubic paths, the same change P3 made. The SVG also gets its theme attribute, so its embedded light-theme selector resolves when Takumi renders it on its own.

The shared changes produce 0% different pixels in the flag-off export against trunk (lane 1).

## Layout and sizing

Takumi `width` and `height` are output pixels. The real-WASM unit test checks PNG headers at DPR 1 and 2. SVG keeps a logical viewBox and sets physical output width and height.

Takumi rounds lengths to 1/64 of a device pixel, as Chrome does at a native scale factor, so line heights pass through unchanged. The earlier 1/64 CSS pixel rewrite matched only the emulated reference and drifted 4.7 device pixels over 300 lines against the native one.

Chrome serializes inline lengths to six significant digits and corner gradients as `to right bottom`. The clone appends exact values to the style attribute instead of writing through the CSSOM:

- CodeMirror measures gutter rows at the display DPR. The clone uses the code row's computed line height, 22.4px in the default theme, so Takumi resolves both at export scale. The hidden zero-height gutter spacer stays unchanged. Passing the measured display height caused 5 output pixels of drift by line 300 when exporting at 2x from a DPR 1 display.
- Takumi 2.19 drops `to right bottom` and draws `to bottom right` exactly like Chrome, so the clone reorders the keywords.

The frame keeps `min-width: max-content` in Chrome, and Takumi ignores that keyword. The clone sets `width: max-content` with the measured width as `min-width`. With the measured width alone, a 1x or SVG export from a 2x screen wrapped the widest line, because Takumi measures text at the export scale. At 1x the frame can come out a fraction of a pixel wider than in Chrome, which accounts for most of lane 5's difference.

Takumi falls back through fonts in registration order. Fonts now register in stylesheet order instead of download order. Before, one session in three drew the default snippet 116 pixels differently. After, six sessions drew identical pixels.

## Code font failures

The review reproduced the earlier intermittent Inter output by blocking code-font downloads. `registerFont` swallowed the error, so Takumi rendered with only the UI font available.

A missing required code font rejects Takumi before rendering. The rasterizer boundary logs the family and reason, shows a localized toast, and falls back to dom-export. Optional UI-font failures log a warning and continue. Failed cache entries are removed, and the registration queue remains usable for the next export.

The adapter receives the selected font configuration from the editor. It registers that family and the bundled Inter UI font, rather than every family in computed CSS fallback stacks. Unicode-range subsets are loaded only when their ranges intersect exported text. Takumi's bundled fallback remains available for missing glyphs. Each render specifies its font families so previously cached fonts cannot change its fallback order.

The local font loader retains native `FontData` handles per family and face. Export reads their `blob()` bytes without another `queryLocalFonts()` call. Config persistence keeps family metadata and omits native handles. TrueType collections retain their own face weights and styles when passed to Takumi.

The blocked-font browser check gets exactly the dom-export PNG, with one fallback message naming JetBrains Mono. Restoring downloads in the same session makes the next export use Takumi again, at 0.0317% from Chrome.

## Review round 2

Both defects were reproduced before changing the adapter. The three regression tests failed first. The browser reported `Gutter baselines drift over 300 lines.` for display DPR 1 at export scale 2, with a measured -5 output pixels from the first line to line 300. Blocking code-font fetches produced no fallback before the fix.

Gutter rows now use the code row's CSS line height. Takumi resolves both at export scale instead of copying display-rounded measurements. Font failures now reach the existing logged dom-export fallback, and the next export can retry the failed font.

The 300-line harness detects the bottom of each numbered glyph and each `const` token. It requires 300 rows in each column and at most one output pixel of first-to-last offset change. The difference between glyph bottoms is not an absolute text baseline; its range is 0 to 2 pixels in all four passing cases because numbers and lowercase code have different rasterized edges.

| Display DPR | Export scale | First-to-last offset change | Chrome difference at matching native scale |
| ----------- | ------------ | --------------------------- | ------------------------------------------ |
| 1           | 1            | 0 px                        | 0.2594%                                    |
| 1           | 2            | 0 px                        | Cross-scale glyph alignment check          |
| 2           | 1            | 1 px                        | Cross-scale glyph alignment check          |
| 2           | 2            | 0 px                        | 0.0054%                                    |

The [300-line crop](media/p2-round2-gutter.png) shows the failing display-1/export-2 result on the left and the fixed result on the right, enlarged 3x. The [round 2 results](media/p2-round2.json) include both crossover runs and the blocked-font result.

The blocked-font export matches dom-export at 0 different pixels and logs one fallback naming JetBrains Mono. After restoring downloads, the same session renders through Takumi at 0.0317% from Chrome. Unit tests also cover a missing font source and a missing Latin subset when another subset succeeds.

One matrix attempt encountered an unavailable code font and returned dom-export. That run was stopped and is not a parity pass. A fresh diagnostic session loaded the font and passed. The completed matrix result is recorded below. Performance was not rerun.

## Review round 3

The reported failure reproduces on this Mac with the original `ec490046` adapter, native local-font permission granted, and Geist Mono selected in the font picker:

```text
[CodeImage] Takumi export failed. Using dom-export. Error: Export font unavailable: Menlo
Fallback cause: Unsupported font format
```

The failure is in Takumi registration. All four native Menlo `FontData.blob()` reads succeed. Chrome returns extracted faces with the legacy Apple `true` signature, bytes `74 72 75 65`, which Takumi 2.19 rejects as an unsupported format. Monaco's native blob fails registration the same way. The `.ttc` collection itself is supported. Reading `/System/Library/Fonts/Menlo.ttc` directly and passing it to the same WASM version registers four faces with the correct weights, styles, and collection indices. Export cannot read that filesystem path from the browser, so unsupported native blobs use the existing browser export.

The fixed adapter exports Geist Mono through Takumi at **0.0320%** different pixels from Chrome, with no fallback and no local-font query. Selecting Menlo in the real font picker uses the stored native handles and makes zero export-time local-font queries. Its unsupported blob format produces one fallback, exactly the dom-export PNG, and this visible toast:

```text
Used browser export for Menlo. This font format is not supported by Takumi.
```

The message and failure reasons have English, Italian, German, and Spanish translations. The console retains the underlying exception.

The three new regression cases failed before implementation. The final suite includes unused fallback-stack fonts, selected web fonts, stored local handles, optional UI-font failures, unused subsets, collection face metadata, and distinct read and format failures:

```text
Before: Tests  3 failed | 18 passed (21)
After:  Tests  26 passed (26)
```

All **104 matrix cells** pass again. The worst cell is **0.0716%**, with zero fallbacks, font issues, or page errors. The [round 3 results](media/p2-round3.json) record the native font signatures and registration failures, the original fallback, the fixed web and system exports, collection support, and the full matrix. The comparison uses native display DPR 2, export scale 2, and pixelmatch threshold 0.1, as in round 2. Performance was not rerun.

`pnpm --filter=@codeimage/app test`, `pnpm lint`, `pnpm typecheck`, and the app production build pass. Lint has the same 33 existing warnings. The fresh-worktree API generation steps below were needed before typecheck. Repeated production builds on this machine's Node version also require clearing generated `apps/codeimage/.vercel` first, because the existing Vercel plugin uses removed `rmdirSync({recursive:true})` behavior. The clean-output build passes.

The native permission override must target Playwright's actual browser context. An initial probe targeted the default context and enumerated zero fonts. After correcting the harness, it enumerated 912 native faces. Earlier probe and selector failures are excluded from the passing results.

Run the checks sequentially with one development server on port 4446:

```sh
P2_URL=http://localhost:4446 P2_REVIEW_CASE=local-fonts P2_WEB_FONT=geist-mono P2_HEADED=1 P2_OUT=/tmp/p2-round3/native pnpm exec tsx scripts/parity/rasterizers.ts
P2_URL=http://localhost:4446 P2_OUT=/tmp/p2-round3/matrix P2_PERF=0 pnpm exec tsx scripts/parity/rasterizers.ts
P2_URL=http://localhost:4446 P2_REVIEW_CASE=blocked-font P2_OUT=/tmp/p2-round3/font pnpm exec tsx scripts/parity/rasterizers.ts
```

## Review round 3 verification

An independent review in Google Chrome 157 on macOS changed two round 3 conclusions.

Takumi rejects Chrome's Menlo faces only because of the sfnt version tag. Chrome returns Menlo's four faces and Monaco with the Apple `true` tag. Andale Mono, Courier New, and PT Mono come back as `00010000` and already registered. Rewriting the first four bytes of a `true` face to `00010000` registers all of them with the correct weights and styles, and Menlo renders correctly. The adapter now rewrites the tag when it reads native FontData, so Menlo uses Takumi instead of falling back.

The second issue was a gap in round 3. After a reload, a selected system font has no FontData handles, because persistence drops them and nothing reloads them until the font picker opens. Every such export fell back with "The font is unavailable." even though the font was installed. When no handles are stored, export now queries local fonts and keeps only the selected family. With stored handles it still makes no query. Menlo and Andale Mono now export through Takumi after a reload, and the Menlo export is pixel-identical to the one taken before the reload.

Results against Chrome, at native display DPR 2 and export scale 2:

| Code font      | Source           | Takumi vs Chrome | Fallback | Native faces read |
| -------------- | ---------------- | ---------------: | -------- | ----------------- |
| JetBrains Mono | web              |          0.0323% | none     | none              |
| Fira Code      | web              |          0.0337% | none     | none              |
| Geist Mono     | web              |          0.0334% | none     | none              |
| Menlo          | system, `true`   |          0.0328% | none     | Menlo's 4 faces   |
| Andale Mono    | system, `.ttf`   |          0.0321% | none     | AndaleMono        |
| Courier New    | system, `.ttf`   |          0.0319% | none     | Courier New's 4   |

With a web font selected, export read no native font and fetched only the selected family's files and Inter. Monaco and PT Mono are not offered in the System picker, because its monospace check filters them out. That check predates P2, so the blob probe covers them instead. A forced FontData read failure shows "Used browser export for Menlo. The font data could not be read." and produces exactly the dom-export PNG. All 104 matrix cells pass again in Chrome 157, worst 0.0706% and median 0.0321%, with no fallbacks, font issues, or page errors. The app has 28 passing tests, and lint and typecheck pass.

The `local-fonts` case now takes font lists:

```sh
CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" P2_URL=http://localhost:4447 P2_REVIEW_CASE=local-fonts P2_WEB_FONTS="Jetbrains Mono,Fira Code,Geist Mono" P2_SYSTEM_FONTS="Menlo,Andale Mono" P2_OUT=/tmp/p2-verify/fonts pnpm exec tsx scripts/parity/rasterizers.ts
```

The System picker's search list sometimes shows the previous search's results on the third consecutive search, so run at most two system fonts per command.

## Parity matrix

All 104 cells passed again in review round 2. The worst cell was **0.0716%**, the median 0.0315%. No export fell back and no page error occurred. Values below are percentages against Chrome.

| Theme              | Windows |  macOS |   Gray | Outline |
| ------------------ | ------: | -----: | -----: | ------: |
| Fleet Dark         |  0.0526 | 0.0317 | 0.0317 |  0.0317 |
| VSCode Dark        |  0.0524 | 0.0315 | 0.0315 |  0.0315 |
| XCode Dark         |  0.0516 | 0.0307 | 0.0307 |  0.0307 |
| Night Owl          |  0.0517 | 0.0307 | 0.0307 |  0.0307 |
| GitHub Dark        |  0.0526 | 0.0316 | 0.0316 |  0.0316 |
| GitHub Dark Dimmed |  0.0513 | 0.0304 | 0.0304 |  0.0304 |
| Dracula            |  0.0503 | 0.0293 | 0.0293 |  0.0293 |
| XCode Light        |  0.0711 | 0.0501 | 0.0501 |  0.0501 |
| Material Ocean     |  0.0518 | 0.0309 | 0.0309 |  0.0309 |
| Synthwave '84      |  0.0519 | 0.0310 | 0.0310 |  0.0310 |
| Poimandres         |  0.0475 | 0.0265 | 0.0265 |  0.0265 |
| Material Volcano   |  0.0518 | 0.0308 | 0.0308 |  0.0308 |
| One dark           |  0.0513 | 0.0304 | 0.0304 |  0.0304 |
| Panda              |  0.0518 | 0.0309 | 0.0309 |  0.0309 |
| Aura Dark          |  0.0504 | 0.0294 | 0.0294 |  0.0294 |
| One light          |  0.0716 | 0.0506 | 0.0506 |  0.0506 |
| Material Palenight |  0.0517 | 0.0308 | 0.0308 |  0.0308 |
| GitHub Light       |  0.0706 | 0.0495 | 0.0495 |  0.0495 |
| Moonlight          |  0.0516 | 0.0307 | 0.0307 |  0.0307 |
| Vitesse Dark       |  0.0506 | 0.0296 | 0.0296 |  0.0296 |
| Duotone Sea        |  0.0517 | 0.0308 | 0.0308 |  0.0308 |
| Duotone Dark       |  0.0518 | 0.0309 | 0.0309 |  0.0309 |
| Shades Of Purple   |  0.0516 | 0.0307 | 0.0307 |  0.0307 |
| Coldark Cold       |  0.0698 | 0.0487 | 0.0487 |  0.0487 |
| Coldark Dark       |  0.0527 | 0.0317 | 0.0317 |  0.0317 |
| Material Light     |  0.0708 | 0.0498 | 0.0498 |  0.0498 |

The [complete table](media/p2-parity.json) also records dom-export comparisons, from 0.8354% to 0.9655% against Chrome. They do not gate P2. dom-export floors computed font sizes and subtracts 0.1px in `copyUserComputedStyleFast`, and Takumi keeps the original font sizes.

On the default snippet, 93% of the remaining different pixels are in the tab title, where Takumi draws `index.tsx` about 4 device pixels wider in Inter. The rest is antialiasing on the watermark.

## Live checks

| Lane                            | Result                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1. Trunk regression, flag off   | 0.0000% different pixels at 1184×936, against trunk exported with the same reference.           |
| 2. Settings switch and download | 0.0317% from Chrome. The 1x override produces 592×468.                                          |
| 3. Long snippet                 | 300 lines at 878×15182: 0.0033% from Chrome. With line numbers: 0.0054%. Both now gate at 0.5%. |
| 4. Five themes                  | The first five macOS cells of the matrix pass.                                                  |
| 5. SVG                          | No `foreignObject`. The rasterized SVG differs 0.3765% from the Takumi PNG.                     |
| 6. Title and watermark          | 400% crop, Chrome left and Takumi right, in the review image.                                   |
| 7. WASM unavailable             | The PNG downloads and the console logs one fallback. A unit test asserts the Umami event.       |
| 8. Renderer persistence         | URL on, reload, persisted on without the query, and explicit URL off pass.                      |
| 9. Clipboard                    | The pasted PNG equals a 3x download at 0.0000% difference.                                      |
| 10. Background asset            | The uploaded image is 0.0501% from Chrome.                                                      |

All ten live checks passed.

## Performance

These are the original P2 measurements. Review round 2 did not rerun performance.

The rule passed. The warm Takumi median was **576.5 ms** against **6670.4 ms** for dom-export, on a 300-line TypeScript snippet at 2x. Each side has ten interleaved runs in alternating order. The measured region starts before the export pipeline and ends when the Blob is ready.

| Sample          | Runs | Median, ms | Min, ms | Max, ms |
| --------------- | ---: | ---------: | ------: | ------: |
| Warm dom-export |   10 |     6670.4 |  5599.8 |  9558.6 |
| Warm Takumi     |   10 |      576.5 |   501.9 |   713.2 |
| Cold Takumi     |    5 |      927.9 |   882.1 |   937.9 |

Every cold run used a fresh browser context with the network cache disabled and requested the WASM file once. The slowest first export took 937.9 ms, under the 2 s gate.

The limiters come from CPU profiles of one export each, kept with the [raw samples](media/p2-performance.json). Takumi spent 553.2 of 828.8 busy milliseconds inside the WASM renderer. CSS collection took 5.4 ms, so parsed CSS is not cached. dom-export's top self time is `setAttribute` 1335.7 ms, `setProperty` 1309.7 ms, `getPropertyValue` 778.8 ms, which is its node-by-node computed style copy.

The run used the Vite development app on an Apple M3 with eight logical cores while other work loaded the machine. Load averages were 8.68 12.27 15.40 at the start and 25.08 18.50 17.37 at the end. Treat the numbers as a local comparison, not a production latency.

## Checks

- `pnpm --filter=@codeimage/app test` passes 26 tests in six files, including display/export crossovers, font failure recovery, required versus optional fonts, stored local handles, and unsupported font formats.
- `pnpm lint` passed with zero errors and 33 existing warnings.
- `pnpm typecheck` passes. A fresh worktree needs `pnpm --filter=@codeimage/api exec prisma generate`, `pnpm --filter=@codeimage/prisma-models build`, and `pnpm --filter=@codeimage/api build:ts` first. The separate `build:types` script fails because its config omits `declaration`; the API build supplies the required declarations.
- `pnpm --filter=@codeimage/app build` passed. Takumi stays in a 5.14 kB chunk behind a dynamic `import()`, which loads the 4,213,356-byte WASM file (1,867.65 kB gzip) on the first Takumi export. The flag-off live export requested no WASM.

## Reproduce

Start the development app with mock auth, then run these commands from the workspace root. `P2_URL` and `CHROMIUM_PATH` override the default server and cached Chromium locations.

```sh
P2_OUT=/tmp/swarm-p2/matrix pnpm exec tsx scripts/parity/rasterizers.ts
P2_QUICK=1 P2_LIVE=1 P2_MATRIX=/tmp/swarm-p2/matrix P2_BASELINE=docs/plans/media/p2-trunk-off.png P2_OUT=/tmp/swarm-p2/live pnpm exec tsx scripts/parity/rasterizers.ts
```

The second command runs the live checks and the performance block. `P2_PERF=0` skips performance for a diagnostic live-only run.

Review the [default image](media/p2-review-default.png), [300-line image](media/p2-review-long.png), [400% title and watermark comparison](media/p2-review-text.png), and [video](media/p2-review.mp4) before merge. The video shows the Settings flow, which this revision does not change.

Run the round 2 checks sequentially so only one browser is open at a time. Each command closes its browser and restores the tracked MSW worker.

```sh
P2_URL=http://localhost:4435 P2_OUT=/tmp/p2-round2/matrix P2_PERF=0 pnpm exec tsx scripts/parity/rasterizers.ts
P2_URL=http://localhost:4435 P2_REVIEW_CASE=crossovers P2_DISPLAY_DPR=1 P2_OUT=/tmp/p2-round2/dpr1 pnpm exec tsx scripts/parity/rasterizers.ts
P2_URL=http://localhost:4435 P2_REVIEW_CASE=crossovers P2_DISPLAY_DPR=2 P2_OUT=/tmp/p2-round2/dpr2 pnpm exec tsx scripts/parity/rasterizers.ts
P2_URL=http://localhost:4435 P2_REVIEW_CASE=blocked-font P2_OUT=/tmp/p2-round2/font pnpm exec tsx scripts/parity/rasterizers.ts
```
