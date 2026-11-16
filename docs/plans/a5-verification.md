# A5 GIF export verification

## Source and environment

PR #781, branch `feat/animate-gif-export`. Second-round fixes start at `e309ba4ab90fe055e0f5bafdb665bddd47bdc1af`. The first review round starts at `8f906a80c20f5a7f8360880d63d5dac78d8337ce`. The original main base is `8cfd752600889215480db124b2b2626e801e4f2a`.

Verified on 2026-11-16 with Node 24.14.0, pnpm 12.18.0, branded Chrome 157.0.8103.78, and an Apple M3 with eight logical cores. The browser helper owns each Vite process, temporary Chrome user-data directory and port. It uses the existing MSW and mock-auth boundary. Production authentication and database persistence were not exercised.

## Implementation after review

`core/video/formats.ts` owns MP4 and GIF configuration, frame rates, support checks, encoders, MIME types and estimates. Scene capture, fonts, Takumi RGBA rendering, opaque backgrounds, scale, secrets review and errors use the shared export pipeline.

GIF uses gifenc 1.0.3 under MIT, one global palette, stable exact-RGB indexing, full opaque frames and disposal 1. Consecutive identical indexed frames merge. Holds beyond the unsigned 16-bit centisecond delay limit split into multiple frames.

Palette sampling now takes one midpoint from every visible scene. This covers every hold and both halves of each transition, including a short step late in a long clip. Sample count is bounded by scene count rather than clip length. Each sample has at most 262,144 pixels; all samples together have at most 4,194,304 pixels. The worker retains no full clip of raw frames.

The worker yields a macrotask before each palette sample and every three export frames. The frame label counts only the normal export pass. Format changes restore the last explicitly selected rate for that format in the dialog; the initial MP4 preference comes from the saved animation settings. Automatic conversion never writes animation settings. Only an explicit rate choice persists, with export-only 25 fps remaining outside the saved schema. Format and FPS update in one Solid batch, and unchanged-value Select notifications are ignored so option reconciliation cannot overwrite the remembered GIF rate. Chrome checks MP4 30/24/50/60 → GIF → MP4, the 60-to-50 note, independent GIF rate memory, and the actual IndexedDB document before and after each round trip. A 60 fps GIF selection still plays at 50 with its localized note.

The German note uses Bilder/s, matching the selector. The format radio uses UI opacity, border-width and spacing tokens.

## Size model and measured errors

The first-round model underestimated a 1920×1080 clip with 6/8/9-line tabs, 1000 ms transitions and 50 fps: 6.425 MB estimated, 9.388 MB downloaded, with no MP4 suggestion. The smaller six-line control estimated 3.765 MB but downloaded 4.476 MB. Hiding its background reduced the download to 0.855 MB, below its 0.993 MB estimate. Captured scene CSS confirms a 480×244 window at scale 1 in the six-line control. The 1080p pixel ratio of 1 is correct; the extra pixels belong to the background, rather than scaled text.

GIF writes a full indexed image for every changed frame, including the unchanged gradient outside the window. The previous sublinear total-area term was calibrated on natural frames and proportional 2× scaling. It missed the cost of filling a large social target around a small window. The model now measures the exposed background area of each step, accounting for fitted window scale, and averages it in output pixels. Natural frames subtract their padded window box. Hidden backgrounds contribute zero gradient area.

```text
text = mean non-whitespace glyph area × 0.2 × pixelRatio^1.2
chrome = 2500 × pixelRatio^1.2
backdrop = exposedArea > 0
    ? outputPixels^0.65 × 3.1 + exposedArea × 0.02
    : sqrt(outputPixels) × 2
estimatedBytes = 800 + (text + chrome + backdrop) × frameBudget × 1.2
```

The additional 0.02 bytes per exposed pixel was chosen using the visible/hidden six-line control and the moving 1080p reproduction. The original coefficients and 20% headroom remain. The square, portrait and nine-line 1080p fixtures were held out: their results did not tune the coefficients. These measurements describe the listed code/gradient fixtures, not arbitrary photographs, fonts or themes.

`gifFrameBudget` follows the worker's global frame clock, avoiding independent rounding of half-transitions. It counts a visible hold once and collapses fade pauses using metadata from the compiler that emits those keyframes. A unit test compares its hold count against the real GIF encoder. Quantization can merge additional transition poses, so the remaining transition budget is deliberately conservative. For example, the short fixture budgets 23 frames and encodes 20, the twelve-line fixture budgets and encodes 33, and the long twelve-step fixture budgets 342 and encodes 331. The UI does not present the budget as an exact encoded frame count.

Each row is a completed UI export and decoded download. MB means 1,000,000 bytes. Three-step clips use 600 ms holds and transitions unless specified. Long fixtures cycle three twelve-line tabs through the requested number of steps, with 600 ms holds and 1200 ms transitions. The palette fixture uses four tabs and the exact 8700/700/800/200/300/200/800 ms segment durations from the finding.

Calibration fixtures (MB = 1,000,000 bytes):

| Fixture                                   | Estimate MB | Actual MB |  Error | MP4 suggestion |
| ----------------------------------------- | ----------: | --------: | -----: | :------------: |
| 1080p, 6/8/9 lines, 50 fps, 1000 ms       |      11.217 |     9.388 | +19.5% |      Yes       |
| 1080p, hidden background, 6 lines, 50 fps |       0.993 |     0.855 | +16.1% |       No       |
| 1080p, 12 lines, 4 steps, 25 fps, 1200 ms |      10.791 |     9.359 | +15.3% |      Yes       |
| 12 lines, 50 fps, 2×                      |       6.023 |     4.722 | +27.6% |       No       |
| 3 lines, hidden background, 25 fps, 2×    |       0.452 |     0.394 | +14.6% |       No       |
| 9 steps, 25 fps, 1×, 1200 ms              |       9.570 |     7.739 | +23.7% |      Yes       |
| 10 steps, 25 fps, 1×, 1200 ms             |      10.760 |     8.678 | +24.0% |      Yes       |
| 3 lines, 25 fps, 1×                       |       0.454 |     0.366 | +24.2% |       No       |
| 3 lines, 25 fps, 2×                       |       1.172 |     0.845 | +38.8% |       No       |
| Short third pink hold, 25 fps, 2×         |       1.134 |     0.722 | +57.0% |       No       |
| 12 lines, 25 fps, 1×                      |       1.269 |     1.058 | +20.0% |       No       |
| 12 lines, 25 fps, 2×                      |       3.156 |     2.557 | +23.4% |       No       |
| 12 steps, 25 fps, 1×, 1200 ms             |      13.144 |    10.661 | +23.3% |      Yes       |

Held-out fixtures (MB = 1,000,000 bytes):

| Fixture                                             | Estimate MB | Actual MB |  Error | MP4 suggestion |
| --------------------------------------------------- | ----------: | --------: | -----: | :------------: |
| 1080p, 9 lines, 25 fps, 900 ms                      |       5.311 |     4.491 | +18.2% |       No       |
| Portrait 1080×1350, 3 lines, large gradient, 25 fps |       2.743 |     1.594 | +72.1% |       No       |
| Square 1080×1080, 6 lines, 4 steps, 50 fps          |       5.330 |     3.354 | +58.9% |       No       |

All 16 estimates are conservative: +14.6% to +72.1%. All 4 downloads at or above 8 MB show the MP4 suggestion. Large-background held-outs deliberately overestimate; the observed band is not a universal bound.

The audit asserts that every measured download of at least 8,000,000 bytes showed the MP4 suggestion before encoding, and that no estimate is more than 10% low. Each measurement JSON and the decoded GIF remain in the evidence directory.

## Verifier findings

1. Palette omission: fixed with scene-based sampling and a unit regression for the unique pink third hold. The Chrome fixture contains 9,472 exact pink pixels across the compared frames. Their maximum channel error is zero. Whole-clip worst error is 23, mean channel error is 0.535, and no pixels differ by more than 48 levels. Decoded delay is exactly 11,720 ms after rounding to the output frame clock. There are no local palettes, holes, ghosts or unchanged-pixel flicker.
2. Size estimate: replaced with the content and background model above, a global-clock frame budget and compiler fade-pause metadata. Measurements and threshold assertions are recorded above.
3. Cancel: fixed by macrotask yields. The final Chrome worker replay acknowledges Cancel after encoding progress. The UI cancellation case produces no download and leaves the editor usable.
4. Fps reset: the second round removes automatic persistence and remembers explicit rates per format. Chrome verifies 30, 24, 50 and 60 fps round trips and saved settings. The unit test that expected MP4 25 → 24 is replaced by round-trip cases.
5. Progress: palette renders no longer contribute. The audit checks every total against the worker's normal frame count and checks the initial zero and final completion.
6. MP4 audit: `choose()` clicks an explicit option, waits for the trigger's confirmed value and waits for export readiness. The 1080p60 case asserts decoded dimensions of 1920×1080 and 60/1 fps, independently of the captured job.
7. Localization and tokens: German units aligned and available UI tokens applied. This round adds no user-facing strings.
8. Compiler cleanup: active ranges are constructed in a single expression; compiler and timeline tests cover the unchanged motion/fade behavior.

The vertical seam in the first hold after reload predates this change and also occurs on main's MP4 path. It remains outside this PR's fix scope.

## Checks and evidence

- Frozen install and library build pass with Node 24.14.0 and pnpm 12.18.0. The lockfile is unchanged.
- App unit tests: 56 files, 403 passing tests. The final rerun uses `pnpm --filter @codeimage/app test --maxWorkers=2 --testTimeout=30000`; concurrent cold-server builds had exceeded the default five-second test budget. No assertions are skipped. API unit tests: 15 files, 77 passing tests using synthetic DATABASE_URL/Auth0/origin configuration. No database or live Auth0 connection is used by these unit tests. Secrets: 35 passing tests; config: 5 passing tests.
- Workspace typecheck passes after `pnpm --filter @codeimage/api exec prisma generate` and the Prisma model build. Workspace lint and the app production build pass with existing warnings.
- Broader unit-suite execution is not green: dom-export has 2 failing font-family tests (10 pass), and highlight has 2 failing 2026 accent tests (28 pass). Both pairs reproduce against the archived, unchanged `origin/main` source. `atomic-state` has no test files, and `prisma-models` has a placeholder test script that exits 1. These packages are unchanged by this PR.
- Static PNG is byte-identical to current `origin/main` at `e56fe3c341b838933d97694c933081a29af6412c`: 874,671 bytes, SHA-256 `d86861684e2e7349ee59b3d53ae49579aab3f940fbf708a80a1b764c50b5e636`. The comparison uses archived main application source with the identical workspace libraries and the same Chrome helper/input. `/tmp/codeimage-a5-r2-png-parity.json` records both paths and the checksum.
- All 16 estimate fixtures pass, split across `/tmp/codeimage-a5-r2-calibration` (port 4966), `/tmp/codeimage-a5-r2-heldout` (4967), and `/tmp/codeimage-a5-r2-matrix` (4973). Exact byte counts and artifact paths are consolidated in `/tmp/codeimage-a5-r2-measurements.json`.
- Chrome contact sheets, decoded portrait GIF frame and the downloaded static PNG were visually inspected. The large-gradient portrait leaves most of its 1080×1350 target outside the small code window, exercising the corrected term.

All **40 mapped journeys** pass across the Chrome batches. Each of the six snippet journeys covers Inspector, Dock and Studio at 1440 and 390 px (36 lanes total). The aggregate is `/tmp/codeimage-a5-r2-full-audit.json`; `/tmp/codeimage-a5-r2-collect.py` rebuilds it from the per-case JSON files.

| Batch                                                       | Journeys | Evidence                                      |      Vite port |
| ----------------------------------------------------------- | -------- | --------------------------------------------- | -------------: |
| Editor/settings/exports and cold/screen parity              | 21       | `/tmp/codeimage-a5-r2-editor`                 |           4970 |
| MP4 layouts, errors, compositing, modes and PNG parity      | 5        | `/tmp/codeimage-a5-r2-animation-retry`        |           4972 |
| GIF estimate matrix (all 16 fixtures, across three batches) | 1        | Calibration/held-out/matrix directories above | 4966/4967/4973 |
| GIF layouts/fallback, five snippet journeys and projects    | 8        | `/tmp/codeimage-a5-r2-final-serial`           |           4983 |
| Animate, phone, focus, geometry and snippet save            | 5        | `/tmp/codeimage-a5-r2-animate-final`          |           4984 |

The first animation batch reproduced the extra GIF-preference reset; its five MP4 journeys passed and the two GIF journeys were rerun after the atomic-update fix. Early overlapping cold-start attempts timed out before editor readiness and are excluded from pass evidence. Two archived-source probes also failed to bootstrap and are not used as verification. Final batches use an explicitly owned Chrome profile and unique debugging ports (14983 and 14984), with builds/tests complete before the final browser pass. No UI, encoder, size, persistence or error assertions are bypassed.

`/tmp/codeimage-a5-r2-final-source.patch` identifies the uncommitted source tested by the final runs, whose doctor files record parent HEAD `e309ba4a`. Unit/build/lint/typecheck logs use the `/tmp/codeimage-a5-r2-` prefix. Completed helpers close their contexts, browser and Vite server, delete their temporary profile/cache/public directories, and retain downloads, screenshots, traces and JSON.

## Reproduce

Use Node 24.14.0 and pnpm 12.18.0. Run the frozen install, `pnpm libs:build`, app tests, typecheck, lint and production build before the audit. Set `VERIFY_BROWSER_CHANNEL=chrome`, `VERIFY_AUDIT=1`, a unique `VERIFY_PORT`, and a new `ARTIFACT_DIR` for each audit batch. `VERIFY_CASES` selects comma-separated journeys; `VERIFY_GIF_FIXTURES` selects individual estimate fixtures. For branded Chrome, the helper launches a persistent browser with its own temporary `--user-data-dir`, creates fresh isolated test contexts, and terminates only its owned browser. Set `VERIFY_CHROME_PORT` to a unique debugging port; the final serial run uses 14983 and Vite port 4983. The profile is recorded in `doctor.json` and removed in cleanup. Retry an interrupted batch once on a fresh port/profile.

## Remaining verification limits

The Chrome audit uses the existing MSW and mock-auth boundaries; live production authentication and PostgreSQL behavior are outside this run. Firefox/WebKit/Safari and native sharing were not exercised, as this round requests Chrome only. The four baseline library test failures above remain unresolved. The preserved #762 encoder bakeoff still needs `packages/render` from #726; the web audit does not.

The first-hold vertical seam noted in the prior round also occurs on main's MP4 path and remains outside this fix scope. The PR remains a draft and is not merged.
