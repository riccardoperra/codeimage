# A5 GIF export verification

## Source and environment

PR #781, branch `feat/animate-gif-export`. Review fixes start at `8f906a80c20f5a7f8360880d63d5dac78d8337ce`. The original main base is `8cfd752600889215480db124b2b2626e801e4f2a`.

Verified on 2026-11-16 with Node 24.14.0, pnpm 12.18.0, branded Chrome 157.0.8103.78, and an Apple M3 with eight logical cores. The browser helper owns each Vite process, temporary Chrome user-data directory and port. It uses the existing MSW and mock-auth boundary. Production authentication and database persistence were not exercised.

## Implementation after review

`core/video/formats.ts` owns MP4 and GIF configuration, frame rates, support checks, encoders, MIME types and estimates. Scene capture, fonts, Takumi RGBA rendering, opaque backgrounds, scale, secrets review and errors use the shared export pipeline.

GIF uses gifenc 1.0.3 under MIT, one global palette, stable exact-RGB indexing, full opaque frames and disposal 1. Consecutive identical indexed frames merge. Holds beyond the unsigned 16-bit centisecond delay limit split into multiple frames.

Palette sampling now takes one midpoint from every visible scene. This covers every hold and both halves of each transition, including a short step late in a long clip. Sample count is bounded by scene count rather than clip length. Each sample has at most 262,144 pixels; all samples together have at most 4,194,304 pixels. The worker retains no full clip of raw frames.

The worker yields a macrotask before each palette sample and every three export frames. The frame label counts only the normal export pass. Format changes preserve a compatible fps selection and otherwise select its nearest option through the same persistence helper. Export-only 25 fps remains outside the saved animation schema. MP4 24 → GIF 25 → MP4 24 and 50 fps in both directions pass through the visible controls. A 60 fps GIF selection still plays at 50 with its localized note.

The German note uses Bilder/s, matching the selector. The format radio uses UI opacity, border-width and spacing tokens.

## Size model and measured errors

The previous total-pixels × distinct-frames × 0.043 model is replaced. The estimate separates text edges, window chrome and the background:

```text
text = mean non-whitespace glyph area × 0.2 × pixelRatio^1.2
chrome = 2500 × pixelRatio^1.2
backdrop = visible ? outputPixels^0.65 × 3.1 : sqrt(outputPixels) × 2
estimatedBytes = 800 + (text + chrome + backdrop) × frameBudget × 1.2
```

Glyph area uses the measured character width and line height. The final multiplier reserves 20% headroom. These coefficients were calibrated against the real downloads below. The reported error band describes these fixtures, not arbitrary code, fonts, photos or themes.

`gifFrameBudget` follows the worker's global frame clock, avoiding independent rounding of half-transitions. It counts a visible hold once and collapses fade pauses using metadata from the compiler that emits those keyframes. A unit test compares its hold count against the real GIF encoder. Quantization can merge additional transition poses, so the remaining transition budget is deliberately conservative. For example, the short fixture budgets 23 frames and encodes 20, the twelve-line fixture budgets and encodes 33, and the long twelve-step fixture budgets 342 and encodes 331. The UI does not present the budget as an exact encoded frame count.

Each row is a completed UI export and decoded download. MB means 1,000,000 bytes. Three-step clips use 600 ms holds and transitions unless specified. Long fixtures cycle three twelve-line tabs through the requested number of steps, with 600 ms holds and 1200 ms transitions. The palette fixture uses four tabs and the exact 8700/700/800/200/300/200/800 ms segment durations from the finding.

| Fixture                                   | Estimate MB | Actual MB |  Error | MP4 suggestion |
| ----------------------------------------- | ----------: | --------: | -----: | :------------: |
| 3 lines, 25 fps, 1×                       |       0.400 |     0.366 |  +9.3% |       No       |
| 3 lines, 25 fps, 2×                       |       0.955 |     0.845 | +13.0% |       No       |
| 3 lines, hidden frame, 25 fps, 2×         |       0.452 |     0.394 | +14.6% |       No       |
| 12 lines, 25 fps, 1×                      |       1.171 |     1.058 | +10.7% |       No       |
| 12 lines, 25 fps, 2×                      |       2.762 |     2.557 |  +8.0% |       No       |
| 12 steps, 1200 ms transitions, 25 fps, 1× |      12.124 |    10.661 | +13.7% |      Yes       |
| 9 steps, 1200 ms transitions, 25 fps, 1×  |       8.827 |     7.739 | +14.1% |      Yes       |
| 10 steps, 1200 ms transitions, 25 fps, 1× |       9.925 |     8.678 | +14.4% |      Yes       |
| 12 lines, 50 fps, 2×                      |       5.272 |     4.722 | +11.6% |       No       |
| Short third pink hold, 25 fps, 2×         |       0.870 |     0.722 | +20.4% |       No       |

Across all ten downloads, the measured error band is +8.0% to +20.4%. The 9-step threshold fixture is 7.739 MB with an 8.827 MB estimate, and the 10-step fixture is 8.678 MB with a 9.925 MB estimate. Both show the suggestion, as does the 10.661 MB twelve-step fixture.

The recommendation appears at an estimate of at least 8,000,000 bytes. The audit asserts that every measured download at or above 8 MB showed it before encoding. The model errs high near the threshold. The exact output size remains available after encoding.

## Verifier findings

1. Palette omission: fixed with scene-based sampling and a unit regression for the unique pink third hold. The Chrome fixture contains 9,472 exact pink pixels across the compared frames. Their maximum channel error is zero. Whole-clip worst error is 23, mean channel error is 0.535, and no pixels differ by more than 48 levels. Decoded delay is exactly 11,720 ms after rounding to the output frame clock. There are no local palettes, holes, ghosts or unchanged-pixel flicker.
2. Size estimate: replaced with the content and background model above, a global-clock frame budget and compiler fade-pause metadata. Measurements and threshold assertions are recorded above.
3. Cancel: fixed by macrotask yields. A real worker replay acknowledged Cancel in 73.5 ms after an encoding progress message. The UI cancellation case also produced no download and left the editor usable. This is one responsiveness observation, not a throughput benchmark.
4. Fps reset: fixed by nearest valid rate selection and shared persistence. Chrome verifies the 24 and 50 fps round trips.
5. Progress: palette renders no longer contribute. The audit checks every total against the worker's normal frame count and checks the initial zero and final completion.
6. MP4 audit: `choose()` clicks an explicit option, waits for the trigger's confirmed value and waits for export readiness. The 1080p60 case asserts decoded dimensions of 1920×1080 and 60/1 fps, independently of the captured job.
7. Localization and tokens: German units aligned and available UI tokens applied.

The vertical seam in the first hold after reload predates this change and also occurs on main's MP4 path. It remains outside this PR's fix scope.

## Checks and evidence

- Frozen install and `pnpm libs:build` pass. `pnpm-lock.yaml` is unchanged by these fixes.
- App unit tests pass: 56 files, 400 tests.
- App typecheck, lint and production build pass. Lint has existing warnings outside the changed files; the build retains its existing chunk-size and dynamic-import warnings.
- Formatting uses oxfmt.
- The eight-fixture GIF matrix passes in `/tmp/codeimage-a5-fixes-matrix-final` on port 4853. Threshold exports use `/tmp/codeimage-a5-fixes-threshold-final` on port 4855.
- All seven requested GIF and MP4 audit cases pass. Results are in `/tmp/codeimage-a5-fixes-audit-final` on port 4854. The selected cases are GIF layouts, GIF fallback, MP4 layouts, errors, compositing, modes and static PNG parity.
- `/tmp/codeimage-a5-fixes-measurements.json` combines the exact byte counts. `/tmp/codeimage-a5-fixes-source.patch` identifies the uncommitted source exercised by the final runs, whose doctor files record the parent HEAD.
- Raw-versus-GIF contact sheets and completed-dialog screenshots were inspected. The helper closes its owned browser contexts and server and retains downloaded files, JSON, screenshots and traces.

Calibration iterations are excluded from the final measurements. One early fixture attempted twelve distinct tabs and correctly hit the editor's six-tab limit; the supported twelve-step fixture now adds existing tabs through the Steps menu. A subsequent calibration run overlapped source edits and was stopped by closing only its owned Chrome process. Final runs use the completed implementation.

## Reproduce

```sh
fnm exec --using=v24.14.0 pnpm install --frozen-lockfile
fnm exec --using=v24.14.0 pnpm libs:build
fnm exec --using=v24.14.0 pnpm --filter @codeimage/app test
fnm exec --using=v24.14.0 pnpm --filter @codeimage/app typecheck
fnm exec --using=v24.14.0 pnpm --filter @codeimage/app lint
fnm exec --using=v24.14.0 pnpm --filter @codeimage/app build
VERIFY_PORT=4853 VERIFY_AUDIT=1 VERIFY_CASES=animation-gif-estimates VERIFY_BROWSER_CHANNEL=chrome ARTIFACT_DIR=/tmp/codeimage-a5-fixes-matrix fnm exec --using=v24.14.0 node .agents/skills/verify-codeimage/scripts/verify.mjs
VERIFY_PORT=4854 VERIFY_AUDIT=1 VERIFY_CASES=animation-gif,animation-gif-fallback,animation-mp4,animation-mp4-errors,animation-mp4-compositing,animation-mp4-modes,animation-mp4-parity VERIFY_BROWSER_CHANNEL=chrome ARTIFACT_DIR=/tmp/codeimage-a5-fixes-audits fnm exec --using=v24.14.0 node .agents/skills/verify-codeimage/scripts/verify.mjs
```

`VERIFY_GIF_FIXTURES` selects comma-separated measurement fixture names for isolated retries. The default measurement case includes the threshold fixtures too. Each invocation gets a fresh temporary Chrome profile. Retry an interrupted browser batch once in a new invocation with a unique port and artifact directory.

## Remaining verification limits

Firefox, WebKit, real Safari, native sharing and operator visual review remain unverified. This pass reruns the requested GIF and MP4 cases, not every unrelated app journey. The earlier implementation's 39-journey verification and pinned-main PNG comparison remain in this file's history at `8f906a80`. The preserved #762 encoder bakeoff still needs `packages/render` from #726; the web audit has no such dependency. The PR remains a draft and has not been merged.
