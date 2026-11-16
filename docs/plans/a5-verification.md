# A5 GIF export verification

## Source and environment

Third-round fixes for draft PR [#781](https://github.com/riccardoperra/codeimage/pull/781) start at `2a645b08f9f8313fe0d28a0c93f0a838ff688012`. The tested implementation is `5ca33fc8`. The [second-round record](https://github.com/riccardoperra/codeimage/blob/2a645b08f9f8313fe0d28a0c93f0a838ff688012/docs/plans/a5-verification.md) retains the earlier measurements and full editor audit.

Verified on 2026-11-16 with Node 24.14.0, pnpm 12.18.0, branded Chrome 157.0.8103.78, and an eight-core Apple M3. Each helper owns a temporary Chrome `--user-data-dir`, Vite port, debugging port, and fresh guest contexts. Browser runs use the existing MSW and mock-auth boundary. No user browser profile is used.

## Findings and resulting behavior

1. Solid backgrounds: fixed. Solid colours, hidden frames, and zero-opacity frames use the small background term. Gradients and image backgrounds use the detailed term. Asset URLs and CSS gradient or image functions count as detailed backgrounds. The reported four-step solid 1080p fixture now estimates 2.386 MB and downloads 2.565 MB, with no hint.
2. Natural-size padding: fixed. The extra exposed-background charge applies only to fixed targets. The existing area term covers natural padding once. Natural gradient exports at 1× and 2× are +9.3% and +13.0%; the twelve-line 2× fixture is +8.0%. The fixed-target surcharge also ramps with area, which removes the earlier square and portrait overestimates without losing the large 1080p warning.
3. Displayed versus saved MP4 rates: fixed. An explicit supported rate is saved and remembered by every format that supports it. GIF 50 or 60 therefore returns to MP4 displaying the saved 50 or 60, including after reopening. Export-only GIF 25 remains outside the saved schema. Automatic conversions never save. The existing atomic format/rate update and unchanged-value guard remain.
4. `nearestAnimationFps`: pure again. It always searches the format's options. The call site uses `selectedFps[value] ?? nearestAnimationFps(value, fps())`. Unit tests cover nearest-rate conversion; Chrome covers selection memory and saved IndexedDB values.
5. Compiler cleanup: restored the earlier plain `activeRanges` array and conditional pushes. The nested spreads with `satisfies` are removed.

The shared capture pipeline, global GIF palette, merged holds, compiler fade-pause budget, palette sampling, progress, and worker cancellation remain covered by the GIF audit. This round adds no user-facing strings or dependencies.

## Size model

The estimator predicts encoded bytes, not elapsed export time. GIF size depends on indexed pixels, LZW compression, and changed frames. Holds merge, while each changed frame includes the full background. All measurements below come from real UI exports and decoded downloads.

```text
area = outputWidth × outputHeight
text = mean non-whitespace glyph area × 0.2 × pixelRatio^1.2
chrome = 2500 × pixelRatio^1.2
targetCharge = exposedArea × 0.02 × min(1, area / (1920 × 1080))^3
backdrop = detailedBackground
    ? area^0.65 × 3.1 + targetCharge
    : sqrt(area) × 2
estimatedBytes = 800 + (text + chrome + backdrop) × frameBudget × 1.2
```

`exposedArea` is zero for natural frames. For a fixed target, it averages the output area outside each fitted window, including fitted scale and output pixel ratio. The original area term, text coefficients, and 20% headroom remain. The extra charge reaches its full coefficient at 1080p. The cubic ramp uses the earlier square and portrait results as calibration data, so those historical fixtures are explicitly classified as calibration in this round.

Thirteen fixtures were available for calibration. The eight held-out fixtures were measured after the coefficients were frozen and did not tune them. Each row has one completed export in this round. Repeated historical gradients also reproduce the earlier exact byte counts. Timings remain in JSON but are not used to claim a performance change.

Across 21 exports, error is **−7.0% to +24.9%**. All four files at least 8 MB show the hint. All sixteen files below 6 MB omit it. Long solid clips at 5.095 MB and 6.798 MB both omit it. The audit requires estimates between 10% low and 30% high, checks both hint boundaries, and checks the long solid fixtures explicitly. These bounds describe the listed inputs, not arbitrary photographs or themes.

MB means 1,000,000 bytes. Unless specified, clips use three twelve-line tabs, 600 ms holds, and 600 ms transitions. Solid backgrounds use `#345678`. Long solid clips and four-step 1080p clips rotate three twelve-line tabs with 1200 ms transitions. The 1080p 50 fps gradient uses 6/8/9 lines and 1000 ms transitions. Square 50 fps fixtures use four six-line steps with 800 ms transitions. The three-line portrait uses 1000 ms transitions. The held-out square and nine-line portrait use 900 ms transitions. The pink fixture retains the reported 8700/700/800/200/300/200/800 ms durations.

### Calibration fixtures

| Fixture                               | Estimate MB | Real MB |  Error | Hint |
| ------------------------------------- | ----------: | ------: | -----: | :--: |
| Solid, 1080p, 4 steps, 25 fps         |       2.386 |   2.565 |  -7.0% |  No  |
| Solid, 1080p, 9 steps, 25 fps         |       6.323 |   6.798 |  -7.0% |  No  |
| Gradient, 3 lines, 1×, 25 fps         |       0.400 |   0.366 |  +9.3% |  No  |
| Gradient, 3 lines, 2×, 25 fps         |       0.955 |   0.845 | +13.0% |  No  |
| Gradient, 12 lines, 2×, 25 fps        |       2.762 |   2.557 |  +8.0% |  No  |
| Gradient, 1080p, 6/8/9 lines, 50 fps  |      11.217 |   9.388 | +19.5% | Yes  |
| Gradient, 1080p, 4 steps, 25 fps      |      10.791 |   9.359 | +15.3% | Yes  |
| Gradient, square, 6 lines, 50 fps     |       3.757 |   3.354 | +12.0% |  No  |
| Gradient, portrait, 3 lines, 25 fps   |       1.991 |   1.594 | +24.9% |  No  |
| Gradient, 1×, 10 steps, 25 fps        |       9.925 |   8.678 | +14.4% | Yes  |
| Gradient, short pink hold, 2×, 25 fps |       0.870 |   0.722 | +20.4% |  No  |
| Hidden, 1080p, 6 lines, 50 fps        |       0.993 |   0.855 | +16.1% |  No  |
| Hidden, 3 lines, 2×, 25 fps           |       0.452 |   0.394 | +14.6% |  No  |

### Held-out fixtures

| Fixture                             | Estimate MB | Real MB | Error | Hint |
| ----------------------------------- | ----------: | ------: | ----: | :--: |
| Solid, 12 lines, 1×, 25 fps         |       0.768 |   0.749 | +2.5% |  No  |
| Solid, 12 lines, 2×, 25 fps         |       1.750 |   1.860 | -5.9% |  No  |
| Solid, square, 6 lines, 50 fps      |       1.132 |   1.075 | +5.3% |  No  |
| Solid, portrait, 3 lines, 25 fps    |       0.370 |   0.392 | -5.6% |  No  |
| Solid, 1080p, 14 steps, 25 fps      |      10.256 |  11.007 | -6.8% | Yes  |
| Gradient, square, 12 lines, 25 fps  |       4.233 |   4.336 | -2.4% |  No  |
| Gradient, portrait, 9 lines, 25 fps |       3.152 |   2.943 | +7.1% |  No  |
| Solid, 1080p, 7 steps, 25 fps       |       4.747 |   5.095 | -6.8% |  No  |

## Checks and evidence

- Frozen install and `pnpm libs:build` pass. The lockfile is unchanged.
- App unit tests: 56 files, 400 passing tests. API unit tests: 15 files, 77 passing tests with synthetic configuration. Secrets: 35 passing tests. Config: 5 passing tests.
- Workspace typecheck, workspace lint, the app production build, and oxfmt pass, with existing lint/build warnings. Prisma client generation and the Prisma model build ran before typecheck.
- The broader library run has four baseline failures: two `dom-export` font-family tests and two `highlight` accent tests. Ten and 28 tests pass in those packages, respectively. Their source trees are identical to `origin/main`, confirmed by `git diff --quiet origin/main -- packages/dom-export packages/highlight`. The earlier record also reproduces these failures on main. Atomic-state has no test files; Prisma-models has a placeholder failing test script.
- All eight requested GIF and MP4 audit cases pass in Chrome. The estimate journey runs in four scoped batches. No browser batch fails or needs a retry. The other 32 mapped editor journeys were not rerun in this focused round; their second-round evidence remains linked above.
- Rate assertions cover MP4 30/24/50/60 → GIF → MP4 without automatic saves. New cases select MP4 30, explicitly choose GIF 50 or 60, return to MP4, and reopen the dialog. The displayed and IndexedDB rates match. GIF 25 memory and the 60-to-50 note remain covered.
- Decoded palette, timing, opacity, progress, cancellation, fallback, and fidelity checks pass. The short pink hold retains 9,472 exact pink pixels with zero channel error. Whole-clip mean channel error is 0.535 and worst error is 23. Raw/GIF contact sheets and the downloaded static PNG were visually inspected.
- MP4 layout, 1080p60 stream metadata, error recovery, visible/hidden compositing, scale, export modes, secrets review, and static PNG versus decoded hold parity all pass.
- Static PNG is byte-identical to freshly archived `origin/main` at `e56fe3c341b838933d97694c933081a29af6412c`: 874,671 bytes, SHA-256 `d86861684e2e7349ee59b3d53ae49579aab3f940fbf708a80a1b764c50b5e636`. Main and candidate use the same helper input, Chrome version, and built workspace libraries. `/tmp/codeimage-a5-r3-png-parity.json` records the paths and checksum.

| Batch                        | Cases or exports        | Evidence directory                 | Vite / Chrome debugging ports |
| ---------------------------- | ----------------------- | ---------------------------------- | ----------------------------- |
| Calibration                  | 5 size fixtures         | `/tmp/codeimage-a5-r3-calibration` | 5011 / 15011                  |
| Gradient calibration         | 6 size fixtures         | `/tmp/codeimage-a5-r3-gradients`   | 5012 / 15012                  |
| Held-out and hidden controls | 9 size fixtures         | `/tmp/codeimage-a5-r3-heldout`     | 5013 / 15013                  |
| Fresh main PNG               | Baseline PNG            | `/tmp/codeimage-a5-r3-main-png`    | 5014 / 15014                  |
| GIF and MP4                  | 7 audit cases           | `/tmp/codeimage-a5-r3-animation`   | 5015 / 15015                  |
| Long solid below 6 MB        | 1 held-out size fixture | `/tmp/codeimage-a5-r3-under-six`   | 5016 / 15016                  |

`/tmp/codeimage-a5-r3-measurements.json` consolidates exact bytes, estimates, labels, groups, and source JSON paths. `/tmp/codeimage-a5-r3-collect.py` rebuilds that file, the tables, and `/tmp/codeimage-a5-r3-estimates.html`, and reasserts the final size and hint bounds over every downloaded result. `/tmp/codeimage-a5-r3-size-validation.log` records the result. Calibration downloads with solid or natural backgrounds are unaffected by the later fixed-target ramp adjustment.

Each directory retains `doctor.json`, `audit.json`, `result.json`, logs, traces, downloads, and screenshots. Doctors record parent HEAD `2a645b08`; `/tmp/codeimage-a5-r3-final-source.patch` identifies the tested changes. Check logs use the `/tmp/codeimage-a5-r3-` prefix. Helpers close their browser and contexts, terminate only their owned Vite process, and delete temporary Chrome profiles, public assets, and Vite caches. Evidence survives cleanup.

## Reproduce

Use Node 24.14.0 and pnpm 12.18.0:

```sh
fnm exec --using=v24.14.0 pnpm install --frozen-lockfile
fnm exec --using=v24.14.0 pnpm libs:build
fnm exec --using=v24.14.0 pnpm --filter @codeimage/api exec prisma generate
fnm exec --using=v24.14.0 pnpm --filter @codeimage/prisma-models build
fnm exec --using=v24.14.0 pnpm --filter @codeimage/app test --maxWorkers=2 --testTimeout=30000
fnm exec --using=v24.14.0 pnpm typecheck
fnm exec --using=v24.14.0 pnpm lint
fnm exec --using=v24.14.0 pnpm --filter @codeimage/app build
```

Run the eight audit cases with a new evidence directory and owned ports:

```sh
VERIFY_BROWSER_CHANNEL=chrome VERIFY_AUDIT=1 \
VERIFY_PORT=5021 VERIFY_DEBUG_PORT=15021 \
ARTIFACT_DIR=/tmp/codeimage-a5-reproduction \
VERIFY_CASES=animation-gif-estimates,animation-gif,animation-gif-fallback,animation-mp4,animation-mp4-errors,animation-mp4-compositing,animation-mp4-modes,animation-mp4-parity \
fnm exec --using=v24.14.0 node .agents/skills/verify-codeimage/scripts/verify.mjs
```

The full estimate journey includes older controls beyond the 21 selected for this round. `VERIFY_GIF_FIXTURES` selects comma-separated fixture names. Exact selections are recorded in each batch's `audit.json`. Retry a failed batch once with fresh evidence and owned ports.

## Verification limits

Live production authentication, PostgreSQL persistence, native sharing, and browsers other than Chrome were not exercised. Image backgrounds use the same conservative detailed term as gradients, but this matrix does not measure photographs. The four unchanged library test failures remain. The first-hold seam already observed on main's MP4 path and the separate #762 encoder bakeoff remain outside this round. The PR remains a draft and is not merged.
