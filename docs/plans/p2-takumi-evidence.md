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

- CodeMirror sets each gutter row to the measured line height, 22.3984375px. Serialized as 22.3984px, it made line numbers drift 5 device pixels by line 300.
- Takumi 2.19 drops `to right bottom` and draws `to bottom right` exactly like Chrome, so the clone reorders the keywords.

The frame keeps `min-width: max-content` in Chrome, and Takumi ignores that keyword. The clone sets `width: max-content` with the measured width as `min-width`. With the measured width alone, a 1x or SVG export from a 2x screen wrapped the widest line, because Takumi measures text at the export scale. At 1x the frame can come out a fraction of a pixel wider than in Chrome, which accounts for most of lane 5's difference.

Takumi falls back through fonts in registration order. Fonts now register in stylesheet order instead of download order. Before, one session in three drew the default snippet 116 pixels differently. After, six sessions drew identical pixels.

## Open issue

In 3 of about 35 browser sessions, Takumi drew the code in Inter for the whole session, so each export in it was about 1.28% from Chrome. One of them ran before the font-order change and two after. The harness did not record console warnings then. It now records `Export font unavailable` messages and failed font requests and fails on either, and the last full live run recorded none. JetBrains Mono loads from Google Fonts, so a network failure is one candidate. The cause is not isolated.

## Parity matrix

All 104 cells passed. The worst cell was **0.0716%**, the median 0.0315%. No export fell back and no page error occurred. Values below are percentages against Chrome.

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

- `pnpm --filter=@codeimage/app test` passed 15 tests in five files.
- `pnpm lint` passed with zero errors and 33 existing warnings.
- `pnpm typecheck` adds no errors. In a fresh checkout it reports the same six implicit-`any` errors on trunk, because the API types need a build step that fails on trunk too.
- `pnpm --filter=@codeimage/app build` passed. Takumi stays in a 4.83 kB chunk behind a dynamic `import()`, which loads the 4,213,356-byte WASM file (1,867.65 kB gzip) on the first Takumi export. The flag-off live export requested no WASM.

## Reproduce

Start the development app with mock auth, then run these commands from the workspace root. `P2_URL` and `CHROMIUM_PATH` override the default server and cached Chromium locations.

```sh
P2_OUT=/tmp/swarm-p2/matrix pnpm exec tsx scripts/parity/rasterizers.ts
P2_QUICK=1 P2_LIVE=1 P2_MATRIX=/tmp/swarm-p2/matrix P2_BASELINE=docs/plans/media/p2-trunk-off.png P2_OUT=/tmp/swarm-p2/live pnpm exec tsx scripts/parity/rasterizers.ts
```

The second command runs the live checks and the performance block. `P2_PERF=0` skips performance for a diagnostic live-only run.

Review the [default image](media/p2-review-default.png), [300-line image](media/p2-review-long.png), [400% title and watermark comparison](media/p2-review-text.png), and [video](media/p2-review.mp4) before merge. The video shows the Settings flow, which this revision does not change.
