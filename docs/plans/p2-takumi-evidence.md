# P2 verification

Chrome is the parity reference. dom-export comparisons are informational. The gate is at most 0.5% different pixels with pixelmatch 7.1.0 at threshold 0.1.

The run uses Playwright 1.57.0 and cached Chromium 1200 on macOS. The app runs on port 4402 with mock auth. The harness supplies the installed Inter files for the existing development URL that returns 404. It temporarily installs the matching MSW worker and restores the tracked worker in `finally`.

## Component spike

The terminal header inherited its UI font from the document. The isolated export selected the code font instead of the inherited UI font. The shared header now declares the existing Inter stack explicitly.

Takumi 2.19's inline SVG path mishandled rounded rectangles and transformed rectangles in the watermark. Equivalent cubic paths preserve the original geometry. The SVG also needs its theme attribute to resolve its embedded light-theme selector when rendered independently.

The shared changes produce 0% different pixels in the default dom-export export and the One Light dom-export export.

## Layout and sizing

Takumi dimensions are physical output pixels. The real-WASM unit test checks PNG headers with DPR 1 and 2. SVG keeps a logical viewBox and sets physical output width and height.

The clone preserves fractional intrinsic width to prevent wrapping when the output viewport has integer dimensions. The Chrome reference clips to the same rounded CSS dimensions as the rasterizer. It does not resize the screenshot.

Chrome lays out a 22.4px line at 22.390625px. The clone keeps that 1/64px rounding so 300 lines do not accumulate layout drift. Font sizes remain unchanged.

Takumi 2.19 drops corner-keyword linear gradients. The clone resolves these to equivalent angles using the element's dimensions and the CSS Images gradient direction rule.

## Parity matrix

All 104 cells passed. The worst cell was **0.4084%**. No export fell back and no page error occurred. Values below are percentages against Chrome.

| Theme              | Windows |  macOS |   Gray | Outline |
| ------------------ | ------: | -----: | -----: | ------: |
| Fleet Dark         |  0.2671 | 0.2472 | 0.2472 |  0.2477 |
| VSCode Dark        |  0.2641 | 0.2442 | 0.2442 |  0.2448 |
| XCode Dark         |  0.2653 | 0.2454 | 0.2454 |  0.2459 |
| Night Owl          |  0.2641 | 0.2442 | 0.2442 |  0.2448 |
| GitHub Dark        |  0.2684 | 0.2485 | 0.2485 |  0.2491 |
| GitHub Dark Dimmed |  0.2632 | 0.2433 | 0.2433 |  0.2439 |
| Dracula            |  0.2626 | 0.2427 | 0.2427 |  0.2432 |
| XCode Light        |  0.2906 | 0.2707 | 0.2707 |  0.2712 |
| Material Ocean     |  0.2620 | 0.2421 | 0.2421 |  0.2427 |
| Synthwave '84      |  0.2648 | 0.2448 | 0.2448 |  0.2454 |
| Poimandres         |  0.2606 | 0.2407 | 0.2407 |  0.2412 |
| Material Volcano   |  0.2650 | 0.2451 | 0.2451 |  0.2457 |
| One dark           |  0.2571 | 0.2372 | 0.2372 |  0.2377 |
| Panda              |  0.2661 | 0.2462 | 0.2462 |  0.2467 |
| Aura Dark          |  0.2656 | 0.2457 | 0.2457 |  0.2462 |
| One light          |  0.4084 | 0.3841 | 0.3841 |  0.3847 |
| Material Palenight |  0.2610 | 0.2411 | 0.2411 |  0.2416 |
| GitHub Light       |  0.2887 | 0.2688 | 0.2688 |  0.2693 |
| Moonlight          |  0.2668 | 0.2469 | 0.2469 |  0.2475 |
| Vitesse Dark       |  0.2585 | 0.2386 | 0.2386 |  0.2392 |
| Duotone Sea        |  0.2615 | 0.2416 | 0.2416 |  0.2421 |
| Duotone Dark       |  0.2569 | 0.2370 | 0.2370 |  0.2375 |
| Shades Of Purple   |  0.2638 | 0.2439 | 0.2439 |  0.2444 |
| Coldark Cold       |  0.2873 | 0.2674 | 0.2674 |  0.2679 |
| Coldark Dark       |  0.2673 | 0.2474 | 0.2474 |  0.2479 |
| Material Light     |  0.2846 | 0.2647 | 0.2647 |  0.2652 |

The [complete table](media/p2-parity.json) also records dom-export comparisons. Those comparisons do not gate P2. dom-export floors computed font sizes and subtracts 0.1px in `copyUserComputedStyleFast`. This explains the approximately 0.8% gap on the default image. Takumi preserves the original font sizes.

## Live checks

| Lane                                   | Result                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| 1. Trunk regression, flag off          | 0% different pixels, 1186×936.                                                  |
| 2. Settings switch and actual download | 0.2431% from Chrome. Override to 1x produces 593×468.                           |
| 3. Long snippet                        | 300 document lines, line 300 visible, both engines and Chrome at 878×15178.     |
| 4. Five themes                         | First five macOS cells in the complete matrix pass.                             |
| 5. SVG                                 | No `foreignObject`; rasterized SVG differs 0.1905% from the Takumi PNG.         |
| 6. Title and watermark                 | 400% crop, Chrome left and Takumi right, in the review image.                   |
| 7. WASM unavailable                    | PNG download succeeds; one fallback log. Unit test also asserts Umami tracking. |
| 8. Renderer persistence                | URL on, reload, persisted on without query, and explicit URL off pass.          |
| 9. Clipboard                           | Pasted PNG equals a 3x download at 0% difference.                               |
| 10. Background asset                   | Uploaded image is 0.3166% from Chrome.                                          |

The 300-line image has a 0.9794% content diff from Chrome, recorded as additional information. Lane 3 gates pixel dimensions and inclusion of line 300. The 0.5% content gate applies to the complete theme/terminal matrix.

## Performance

The warm sample passed. dom-export's median was **6534.65 ms** and Takumi's was **665.00 ms**. Each side has ten interleaved runs, with alternating order. The measured region starts before the export pipeline and ends when the Blob is ready, before base64 conversion or disk writes.

| Sample          | Runs | Median, ms | Min, ms | Max, ms |
| --------------- | ---: | ---------: | ------: | ------: |
| Warm dom-export |   10 |    6534.65 | 6132.30 | 7834.40 |
| Warm Takumi     |   10 |     665.00 |  579.10 |  902.70 |
| Cold Takumi     |    5 |    1029.60 |  927.30 | 1231.80 |

Every cold run used a fresh browser context with network caching disabled and requested the WASM asset once. The maximum first export was 1231.80 ms, below the 2 s gate. The timed outputs are PNGs from the same 300-line TypeScript snippet at 2x. All ten live checks passed and the main page recorded no fallback or page error.

The run used the Vite development app and the package's release WASM binary on an Apple M3 with eight logical cores. Other work kept the machine busy. The load average was recorded with the [raw samples](media/p2-performance.json), so this is a local app measurement rather than a production latency prediction.

Separate, unreported CPU-profile exports showed dom-export spending time copying style properties and attributes. Takumi's hottest samples were inside WASM. Parsed CSS caching was not added because the profile did not identify stylesheet parsing as the warm limiter. Font registrations and external stylesheet bytes are cached.

## Checks

- `pnpm libs:build` passed during setup.
- `pnpm --filter=@codeimage/app test` passed 14 tests in five files.
- `pnpm lint` passed with zero errors and 33 existing warnings.
- `pnpm typecheck` passed across the workspace.
- `pnpm --filter=@codeimage/app build` passed. Takumi remains a separate 5.00 kB JS chunk and a separate 4,213,356-byte WASM asset (1,867.65 kB gzip). The flag-off live export made no WASM request.

The tracked MSW worker and the local environment file are excluded from the change. The production build still reports the existing unresolved Inter CSS paths; the parity harness supplies those font files during local verification.

## Reproduce

Start the development app on port 4402 with mock auth, then run these commands from the workspace root. `P2_URL` and `CHROMIUM_PATH` override the default server and cached Chromium locations.

```sh
P2_OUT=/tmp/swarm-p2/matrix pnpm exec tsx scripts/parity/rasterizers.ts
P2_QUICK=1 P2_LIVE=1 P2_MATRIX=/tmp/swarm-p2/matrix P2_BASELINE=docs/plans/media/p2-trunk-off.png P2_OUT=/tmp/swarm-p2/live pnpm exec tsx scripts/parity/rasterizers.ts
```

The second command runs the live checks and performance block. `P2_PERF=0` skips performance for a diagnostic live-only run.

Review the [default image](media/p2-review-default.png), [300-line image](media/p2-review-long.png), [400% title and watermark comparison](media/p2-review-text.png), and [video](media/p2-review.mp4) before merge. The video is 35.48 seconds long.
