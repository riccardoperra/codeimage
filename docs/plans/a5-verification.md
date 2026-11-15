# A5 GIF export verification

Base: `8cfd752600889215480db124b2b2626e801e4f2a` from `origin/main`. Branch: `feat/animate-gif-export`.

## Design

`core/video/formats.ts` owns MP4 and GIF configuration, encoder creation, support checks, fps choices, size estimates, extensions, and MIME types. The existing `AnimationJob` and typed worker protocol carry either config. Scene capture, fonts, raw Takumi RGBA rendering, progress, cancellation, opaque backgrounds, and scale remain shared.

GIF uses gifenc 1.0.3 under MIT. The worker samples up to sixteen frame times and at most 262,144 pixels per sample, then streams the clip through one global palette. An exact RGB cache maps every colour consistently across the clip. There is no dithering or per-frame palette. Identical indexed frames merge into longer holds. Full opaque frames use disposal 1. Long holds split at GIF's unsigned 16-bit centisecond limit.

GIF defaults to 25 fps and offers 50 fps. A selected 60 fps plays at 50, with a localized note. The timeline also samples window motion at the actual output rate. Export-only 25 fps does not alter the saved animation schema. MP4 remains the initial format; an unsupported MP4 configuration selects GIF and disables MP4 with its reason.

The estimate is pixels × estimated distinct frames × 0.043 bytes. Holds count once. Above 8 MB, the dialog suggests MP4. The estimate is a heuristic, not a size guarantee. The requested 0.043 coefficient underestimates this twelve-line fixture by roughly one third. Its measured compression is about 0.067 bytes per pixel per distinct frame; the UI retains the chosen bakeoff coefficient.

## Commits

- `9a436013`: format table, GIF encoder, typed job, worker integration, and unit tests.
- `eb0ad10a`: format controls, translations, and shared planner fps type.
- `2116dce7`: sample window motion at the encoded GIF frame rate.
- `e93c3ca1`: share the decoder inside the app's test utilities and fix the spacing token.
- `42884b52`: preserve #762's bakeoff and add Chrome audit journeys.
- `60a75436`: assert fps selections, reopen Animate after layout reload, retain 40 px format rows, and capture format before preparation.
- `ea499c67`: isolate saved-snippet lanes without changing their assertions.

This verification record is committed after the checks finish. Every commit includes the requested co-author trailer.

## Local checks

Node 24.14.0, pnpm 12.18.0, branded Chrome 157.0.8103.78, Apple M3 with eight logical cores and 16 GB RAM. Vite uses the MSW and mock-auth boundary. Production authentication and API persistence are outside this check.

- Frozen install passes. The lockfile adds eight gifenc lines.
- Library build, app type check, production build, and formatting pass.
- App tests pass: 56 files, 391 tests. GIF tests cover the format table, exact-colour stability, global palettes, disposal, merged holds, long delays, fps mapping, estimates, fallback selection, and GIF job MIME type.
- PNG from pinned main and this implementation has identical dimensions, 1836×801, and zero differing RGBA channels out of 5,882,544. The full audit also compares live frames with PNGs in all layouts.
- All 39 Chrome audit journeys are verified. The full invocation passed 37 journeys, including every GIF, MP4, image, and Animate journey. Chrome exited with code 0 during saved-snippet navigation without a page error, and did so again in two fresh multi-lane attempts. Dashboard persistence passed separately. All six navigation lanes passed in fresh Chrome processes. This is full journey coverage, not a clean single-process full-audit exit. The cause of Chrome's exit remains unconfirmed.
- `/tmp/codeimage-a5-audit-summary.json` preserves the 39 final results, their evidence paths, and the interrupted full invocation's status. `/tmp/codeimage-a5-gif-measured/audit.json` contains every accepted timing sample. Final-source GIFs are byte-identical to the measured files at both rates.
- Screenshots and raw/GIF contact sheets were inspected. Owned Vite and Chrome instances are closed after each helper run.

## Three-second clip

The timing fixture has three twelve-line steps, three 600 ms holds, and two 600 ms transitions. Both rates use the same 1132×1014 current frame at 2× in Studio. Five completed exports per rate include an initial pair and four alternating repeat pairs. Every accepted sample checks the worker's actual fps, decoded delays, and output bytes.

| Rate   | GIF size | Encoded frames | Export wall median | Wall range   | Worker median | Raw-render median |
| ------ | -------- | -------------- | ------------------ | ------------ | ------------- | ----------------- |
| 25 fps | 2.54 MB  | 33             | 6.34 s             | 5.33–9.60 s  | 5.50 s        | 4.43 s            |
| 50 fps | 4.85 MB  | 63             | 11.50 s            | 7.68–14.16 s | 10.89 s       | 8.87 s            |

Times are diagnostics from the traced development app, including preparation, screenshots, and download completion. They are not a production speed comparison. Raw Takumi rendering, including the sixteen palette samples, accounts for about 80% of worker elapsed time. Rendering runs sequentially in one worker. System load varied from 7.27 to 18.23 on eight cores, with roughly 11 GB of swap in use during the broader run. The wide ranges limit timing precision. No Long Tasks entries of at least 50 ms were observed during these ten measured exports.

The decoder from #762 compares every displayed GIF frame with the captured worker job re-rendered by Takumi WASM. The 25 fps fidelity sample is 1184×1014 in Inspector; the 50 fps sample is 1132×1014 in Studio. Mean absolute RGB channel error is 0.349 and 0.352 levels out of 255. Worst channel error is 18 and 24, below the bakeoff bound of 65. Both have zero pixels off by more than 48 levels, zero holes, zero ghosts, zero unchanged-pixel flicker, no local palettes, and exactly 3000 ms of decoded delays. Holds reduce 75 sampled frames to 33 GIF frames, and 150 to 63. The expand/shrink fallback fixture also passes, with mean error 0.458 and worst error 15.

## Reproduce

```sh
pnpm install --frozen-lockfile
pnpm libs:build
fnm exec --using=v24.14.0 pnpm --filter @codeimage/app test
VERIFY_AUDIT=1 VERIFY_BROWSER_CHANNEL=chrome fnm exec --using=v24.14.0 node .agents/skills/verify-codeimage/scripts/verify.mjs
VERIFY_AUDIT=1 VERIFY_CASES=animation-gif VERIFY_GIF_RUNS=5 VERIFY_BROWSER_CHANNEL=chrome fnm exec --using=v24.14.0 node .agents/skills/verify-codeimage/scripts/verify.mjs
```

The feature map in `.agents/skills/verify-codeimage/features/export.md` describes selectors and tolerances. Per-run media, traces, JSON, and the source patch stay outside the repository under `/tmp/codeimage-a5-*`.

## Isolate a saved-snippet lane

The existing snippet matrix accepts `VERIFY_SNIPPET_LAYOUT=inspector|dock|studio` and `VERIFY_SNIPPET_WIDTH=1440|390`. Without these selectors it runs all six combinations. A selected lane is partial coverage. Count the navigation journey as complete only after all six matrix records pass. The flags change isolation, not the scenario's assertions.

```sh
VERIFY_AUDIT=1 VERIFY_CASES=snippet-navigation VERIFY_SNIPPET_LAYOUT=dock VERIFY_SNIPPET_WIDTH=390 VERIFY_BROWSER_CHANNEL=chrome fnm exec --using=v24.14.0 node .agents/skills/verify-codeimage/scripts/verify.mjs
```

## Remaining platform checks

Chrome is verified. Firefox, WebKit, real Safari, and native file sharing are not run. The full encoder bakeoff from #762 is preserved in `scripts/parity/animation-gif.ts`; it needs `packages/render` from #726 and its built SSR assets, which main does not contain. The web audit has no such dependency. Riccardo can close #762 after reviewing this implementation. Operator visual review remains pending for the draft PR. A continuous single-process full Chrome run remains limited by the unexplained clean browser exits; all individual journeys have passed.
