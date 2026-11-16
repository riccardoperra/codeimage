# Animation step-size fix verification

Validated on November 16, 2026 with Node 24.14.0, pnpm 12.18.0 and Google Chrome 157.0.8103.78. Browser runs use the app's MSW and development-auth adapters. The baseline is a source archive of `origin/main` at `dfdeda77fa117a291a39e8cff68627a31abab781` with the same built workspace libraries and verification scripts. The implementation is `cca2ad57`.

Natural animation windows use the shared 480 px fitted-window minimum. GIF background estimates use the fixed canvas area minus each step's measured window area, including natural canvases. The additional background charge grows more slowly when upscaled. The unused `measurePreview` natural parameter is removed.

Signatures use `signatureScale(fixedCanvasCssWidth)` for every scene, before output pixel scaling. This matches static export at that width and prevents size changes between steps. The existing 0.85 minimum and 2 maximum remain. Measurement reserves signature padding at the chosen scale. MP4 and GIF downloads of the wide-canvas fixture have scale 2 in all four scenes and 120 px of bottom padding. Decoded hidden-frame and signature holds were visually inspected.

## GIF estimates

Each row is one real Chrome download, decoded for frame count and timing. MB means 1,000,000 bytes. Error is estimate divided by actual size, minus one. The two mixed fixtures contain one line, a roughly 150-character line, thirty lines and six lines, with 600 ms holds and 800 ms transitions.

All 28 fixtures meet the 10% low to 30% high band. Errors range from -7.0% to +24.9%. Every file of at least 8 MB shows the MP4 hint; no file below 6 MB shows it.

| Fixture                        | Estimate MB | Actual MB |  Error | MP4 hint |
| ------------------------------ | ----------: | --------: | -----: | :------: |
| `estimate-mixed-gradient-1x`   |       3.720 |     3.627 |  +2.6% |    No    |
| `estimate-mixed-gradient-2x`   |      11.887 |    10.250 | +16.0% |   Yes    |
| `estimate-1080p-fifty`         |      11.217 |     9.388 | +19.5% |   Yes    |
| `estimate-1080p-twelve`        |      10.791 |     9.359 | +15.3% |   Yes    |
| `estimate-solid-1080p-twelve`  |       2.386 |     2.565 |  -7.0% |    No    |
| `estimate-solid-long-no-hint`  |       6.323 |     6.798 |  -7.0% |    No    |
| `heldout-solid-1x`             |       0.769 |     0.752 |  +2.3% |    No    |
| `heldout-solid-2x`             |       1.752 |     1.866 |  -6.2% |    No    |
| `heldout-solid-square`         |       1.132 |     1.075 |  +5.3% |    No    |
| `heldout-solid-portrait`       |       0.370 |     0.392 |  -5.6% |    No    |
| `heldout-solid-long-under-six` |       4.747 |     5.095 |  -6.8% |    No    |
| `heldout-solid-over-eight`     |      10.256 |    11.007 |  -6.8% |   Yes    |
| `estimate-1080p-nine`          |       5.311 |     4.491 | +18.3% |    No    |
| `estimate-square-fifty`        |       3.757 |     3.354 | +12.0% |    No    |
| `estimate-portrait-gradient`   |       1.991 |     1.594 | +24.9% |    No    |
| `estimate-1080p-hidden`        |       0.993 |     0.855 | +16.1% |    No    |
| `estimate-short-1x`            |       0.404 |     0.368 |  +9.9% |    No    |
| `estimate-short-2x`            |       0.970 |     0.855 | +13.5% |    No    |
| `estimate-hidden-2x`           |       0.452 |     0.395 | +14.4% |    No    |
| `estimate-twelve-lines-1x`     |       1.179 |     1.064 | +10.7% |    No    |
| `estimate-twelve-lines-2x`     |       2.829 |     2.572 | +10.0% |    No    |
| `estimate-twelve-steps-1x`     |      12.208 |    10.710 | +14.0% |   Yes    |
| `estimate-near-eight-1x`       |       8.889 |     7.793 | +14.1% |   Yes    |
| `estimate-over-eight-1x`       |       9.994 |     8.729 | +14.5% |   Yes    |
| `estimate-fifty-2x`            |       5.401 |     4.753 | +13.6% |    No    |
| `heldout-square-twelve`        |       4.233 |     4.336 |  -2.4% |    No    |
| `heldout-portrait-nine`        |       3.152 |     2.943 |  +7.1% |    No    |
| `estimate-short-pink-hold-2x`  |       0.887 |     0.782 | +13.4% |    No    |

## Browser and static checks

All 15 selected cases pass in Chrome: `animation-mp4`, `animation-mp4-errors`, `animation-mp4-compositing`, `animation-mp4-modes`, `animation-mp4-parity`, `animation-mp4-step-size`, `animation-gif`, `animation-gif-fallback`, `animation-gif-estimates`, `animation-gif-step-size`, `animate`, `animate-phone`, `animate-focus`, `animate-geometry`, and `animate-followups`.

Each format has twelve identical decoded clips across Inspector, Dock, Studio, active tabs and reloads. MP4 is 640×508; GIF is 640×507. The short window is 480 px wide; the tall window is about 512 px. The complete last-line crop differs from the static PNG by 0.233% in MP4 and 0% in GIF. Adjacent background-channel jumps stay at 4 and 5 levels respectively. Width assertions read actual window geometry because syntax colours make dark-pixel counts unreliable when window widths are close.

The hidden-frame checks use `let a = 1;` and a `#f0a020` matte. The full watermark stays inside the short window and clears every code range. Both formats also verify constant signature scale and reserved padding on a wide canvas.

All three PNG downloads are byte-identical to the pinned main archive:

| PNG                        |   Bytes | SHA-256                                                            |
| -------------------------- | ------: | ------------------------------------------------------------------ |
| `snippet.png`              | 874,671 | `d86861684e2e7349ee59b3d53ae49579aab3f940fbf708a80a1b764c50b5e636` |
| `step-size-mp4-static.png` | 193,547 | `db1234c8be49fee7a3db636c55f123093f2fc78a7e1bd5201d6675f703710866` |
| `step-size-gif-static.png` | 193,547 | `db1234c8be49fee7a3db636c55f123093f2fc78a7e1bd5201d6675f703710866` |

## Repository checks and limits

Frozen install, library build, workspace typecheck, workspace lint, app production build and oxfmt pass. App unit tests pass 539 tests; API unit tests pass 77 with synthetic configuration; secrets pass 35 and config pass 5. Prisma types were generated locally before workspace typecheck. `pnpm-lock.yaml` is identical to main after the merge.

The broader library tests have four inherited failures: two highlight accent tests and two DOM-export font-family tests. The same failures reproduce against the pinned main archive. Highlight passes its other 28 tests; DOM-export passes its other 10. These packages are unchanged from main.

Initial browser work was invalidated by dependency rebuild reloads. The final runs below use stable sources. The step-size audit was corrected to measure window widths directly and restore Inspector before operating its frame controls.

Production authentication, the live backend, PostgreSQL integration, native sharing and non-Chrome playback were not verified.

## Reproduce and evidence

Run `fnm exec --using=v24.14.0 pnpm install --frozen-lockfile` and `fnm exec --using=v24.14.0 pnpm libs:build` before starting browser batches. Do not rebuild shared libraries while batches are active.

Run the following command with each batch's case list, an unused port and a fresh artifact directory:

```sh
VERIFY_AUDIT=1 VERIFY_BROWSER_CHANNEL=chrome VERIFY_PORT=4660 \
ARTIFACT_DIR=/tmp/codeimage-proof VERIFY_CASES=animation-mp4-step-size,animation-gif-step-size \
fnm exec --using=v24.14.0 node .agents/skills/verify-codeimage/scripts/verify.mjs
```

`VERIFY_GIF_FIXTURES` selects named estimate fixtures. `VERIFY_STEP_STATIC_ONLY=1` downloads only step PNG references; use the same scripts against the pinned main sources. `VERIFY_STATIC_BASELINE` points the candidate run at those references for byte comparisons.

Final evidence is under `/tmp/codeimage-step-size-fixes/`. Each browser batch records its owned profile, server and debugging ports in `doctor.json`, with traces, downloads and assertions alongside it.

| Batch                                |                  Cases | Evidence directory  | Server / debugging ports |
| ------------------------------------ | ---------------------: | ------------------- | ------------------------ |
| GIF estimates                        |   1, with 28 downloads | `estimates-retry`   | 4656 / 14656             |
| Existing exports                     |                      7 | `exports`           | 4657 / 14657             |
| Step sizes, watermark and signatures |                      2 | `steps-final`       | 4660 / 14660             |
| Animate interactions                 |                      5 | `animate`           | 4659 / 14659             |
| Main PNG references                  | 2 static-only journeys | `main-static-final` | 4655 / 14655             |

`collect-verification.py` in that evidence directory rechecks the downloaded sizes, estimate bands, hints, audit statuses and PNG identity. It writes `measurements.json`, the estimate chart and this report. `verified-source.patch` identifies the implementation tested by runs started before its commit. All helpers clean up only their owned browser, server, profile and caches.
