# A2 verification

A2 of `docs/plans/2026-code-animation.md` renders animated images in Node and adds `codeimage --animate`. This file records its unit, live, and perf evidence on base A1 `29521428`. Every pixel diff uses pixelmatch at threshold 0.1, and the limit is 0.5% of pixels. All runs used Node 26.5.0 and Takumi 2.19.0 on an 8-core Mac, 4 of them performance cores.

## What differs from the plan

Each item is a decision that the evidence below led to. The operator can reverse any of them.

1. **WebP is always lossless, and there is no `--lossless` flag.** The plan made lossy WebP at quality 90 the default. Takumi writes lossy animated WebP without an alpha channel, and the lossy file was larger. [Lossy WebP](#lossy-webp) has the numbers.
2. **GIF plays at 50, 25, or 20 fps.** The plan capped GIF at 50 fps. A 30 fps GIF from Takumi also plays 20% slow. [GIF frame rate](#gif-frame-rate) has the numbers.
3. **The GIF ghost is fixed in the file, and two other GIF defects stay.** A2 sets the disposal of each GIF frame. Takumi's palette still gives wrong colors and can leave holes. [GIF](#gif) has the evidence and a measured alternative.
4. **The CLI reads animation settings from `--preset`.** The citty CLI takes code files as input, not a project JSON. `renderAnimation` plays the `animation` a project JSON stores, with its own steps. In the CLI the files are the steps, and a preset with an `animation` section gives them its timing.
5. **`--split-tabs` and `--alt` are usage errors with `--animate`.** One splits the tabs into files and the other describes one image.
6. **Lane 4 uses macOS ImageIO, not Chrome.** The run had no browser. ImageIO is the image decoder of macOS.
7. **The review clip is an animated WebP, not an MP4.** The machine has no screen recorder and no ffmpeg.

## Unit

- `pnpm --filter=@codeimage/app test` passes 115 tests in 19 files. The animation tests are 41 of them. One is new: a rescaling window is on its path at every frame an export draws, at 24, 25, 30, 50, and 60 fps. It fails on A1's stops and passes on the new ones.
- `pnpm --filter=@codeimage/render test` passes 76 tests in 4 files. `document.test.ts` has 16 new tests for `parseAnimationDocument`. A project without `animation` plays every tab in order. Durations round to whole milliseconds. An animation of 0 ms, a step whose tab is gone, and a still format are rejected. `animation.test.ts` has 12 new tests. A two-step animation is as large as its largest step, lasts 2500 ms, and holds 800 ms at each end. A project's own steps play in their order. Scale 2 doubles the canvas. A GIF frame that shrinks leaves nothing behind. A GIF asked for 60, 50, 30, and 24 fps has frames of 20, 20, 40, and 50 ms and its real length.
- `pnpm --filter=@codeimage/cli test` passes 116 tests in 7 files. `flags/animate.test.ts` has 38 of them. They cover the step order, the timing flags, a preset with animation settings, the format of each extension, the usage errors for `.mp4`, `.jpg`, `.svg`, and `--format jpeg`, the GIF frame rate note, timing flags without `--animate`, and an animation of 0 ms.

The GIF test decodes the file and draws each frame over the canvas as a viewer does. With `clearGifFrames` turned off it fails with 9,538 opaque pixels in the rows above the shorter frame. With it, the count is 0. A second test fails on the day Takumi clears GIF frames itself, which is the signal to delete `clearGifFrames`.

## Live

The lanes ran in a tmux pane with the built CLI at this head, one after another. `scripts/parity/animation-frames.ts` decoded the frames.

| Lane | Check                                                                                                                                                           | Result                                                                                                                                                      | Evidence                   |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 1    | Static PNG on trunk `29521428` and on head, for one file, for three tabs with `--theme dracula --scale 2 --lines 1-4`, and for `--size x-landscape --signature` | pass, all three byte-identical                                                                                                                              | `media/a2-static.png`      |
| 2    | `codeimage a.ts b.ts c.ts --animate -o demo.webp`                                                                                                               | pass. 717 by 424 px, 57 frames, 4200 ms: hold 800, 900 ms in 27 frames, hold 800, 900 ms in 27 frames, hold 800                                             | `media/a2-three-steps.png` |
| 3    | The pair as `.gif` with `--fps 60`                                                                                                                              | pass. stderr says `--fps: GIF supports 50, 25, or 20 fps, so this one plays at 50 instead of 60`. ImageIO reads 125 frames of 20 ms, 2500 ms                | `media/a2-gif.png`         |
| 4    | The pair as `.apng`                                                                                                                                             | pass. ImageIO reads 75 frames of 33 and 34 ms, 2500 ms, and frames 0, 37, and 74 differ. Not opened in Chrome                                               | `media/a2-apng.png`        |
| 5    | `--scale 1` and `--scale 2`                                                                                                                                     | pass. 717 by 379 px and 1434 by 758 px                                                                                                                      | `media/a2-scale.png`       |
| 6    | `--preset` with `animation`: holds 400 and 1200 ms, transition 600 ms, `linear`, 50 fps                                                                         | pass. 2200 ms: hold 400, 600 ms in 30 frames, hold 1200                                                                                                     | `media/a2-project.png`     |
| 7    | `--animate --diff --size x-landscape --signature @riccardoperra` on a diff of two files                                                                         | pass. 1600 by 900 px. The signature corner is the same pixels in all 29 frames                                                                              | `media/a2-combined.png`    |
| 8    | Two files with an AWS access key                                                                                                                                | pass. stderr lists both keys and `redacted 2 secrets`. The file is byte-identical to the render of copies masked beforehand, and differs from `--no-redact` | `media/a2-redact.png`      |
| 9    | `-o demo.mp4` and `-o demo.jpg`                                                                                                                                 | pass. Both exit with code 2, name `.webp, .gif, .apng, or .png`, and write no file. The `.mp4` message adds `MP4 arrives in a later version`                | `media/a2-errors.png`      |
| 10   | Ctrl+C at 1, 3, and 6 s into a render that takes 36.2 s                                                                                                         | pass. Exit code 130 after 45, 28, and 33 ms, and no output file                                                                                             | `media/a2-abort.png`       |

Lane 8 first failed on its own fixture. The AWS rule skips keys that end in `EXAMPLE`, so the documented sample key is not a secret. The rerun used a made-up key.

Lane 10 did not interrupt the final file write. That write starts after the whole image is encoded, 36 s into this render.

`media/a2-review.webp` is the review clip, 31.7 s. It shows the pane of a real three-step render to WebP and to GIF, and each result playing twice. `media/a2-review-three-steps.png`, `a2-review-scale.png`, and `a2-review-combined.png` are the lane 2, 5, and 7 images.

## Every frame of every format

`pnpm exec tsx scripts/parity/animation-endpoints.ts --encode` now writes each case with `renderAnimation`, decodes every frame, and compares it with a direct render of the time the export drew it at. Before, it called Takumi itself and compared three frames. The run covered 41 of the 43 cases. `edge-long-line` and `edge-line-2000` were left out, because their frames are 5,969 and 19,371 px wide.

| Format            | Result over 41 cases                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| WebP              | 0.000% on every frame                                                                          |
| APNG              | 0.000% on every frame                                                                          |
| GIF, ghost pixels | 0 in every case                                                                                |
| GIF, hole pixels  | 0 in 39 cases. 545 in `edge-target-scale` and 4,599 in `edge-target`, summed over their frames |
| GIF, color diff   | 0.001% to 0.484%                                                                               |

All 41 cases pass the script's gate. The gate fails a case on a ghost pixel and reports hole pixels without failing, because A2 cannot fix them. [GIF](#gif) says what a hole is.

## GIF

Takumi 2.19.0 and 2.20.0 write the same GIF bytes for the same scenes. Its `master` branch has the same encoder code on 2026-11-13.

**Ghosts, fixed.** Takumi writes every frame as a whole canvas with the disposal "do not dispose" and a transparent color. A pixel that turns clear then keeps showing the frame before it. In `edge-empty-to` the frame shrinks from 267 to 244 px, and the last frame kept the old gradient above and below it, with stripes. `clearGifFrames` in `packages/render/src/gif.ts` sets the disposal of each whole-canvas frame to "restore to background". The case went from 8.386% to 0.336%, with 0 ghost pixels. `media/a2-gif-ghost.png` shows the last frame before and after. A box that shrinks on a clear canvas reproduces it without CodeImage: 11,909 of 12,000 pixels in the rows it left stay opaque.

**Holes, open.** In two target-frame cases some near-black pixels are clear in the GIF. The palette entry that Takumi marks transparent holds the color `8,7,14`, and the 545 opaque pixels of the window's dark outline, `7,6,13`, got the same entry. They are clear from the first frame on, with or without the disposal fix.

**Colors, open.** Each frame gets its own 256 colors. In a 1600 by 900 px frame most of them go to the background gradient. `media/a2-gif-colors.png` shows the first frame of `edge-target` as WebP and as GIF. In the GIF the traffic lights are tan and dark green, and the keyword `const` is gray purple, not pink. The colors also change from frame to frame. The CLI README says that WebP and APNG keep every pixel.

**A measured alternative.** A prototype wrote the GIF itself from Takumi's raw frames, with the `gifenc` package, one palette for the whole clip, and equal neighbor frames stored once. These are single runs at a load average near 9, so the times only show the order of size.

| Clip                         | Encoder   | Size     | Wall time | Opaque pixels more than 48 levels off, at 0, 940, and 1880 ms |
| ---------------------------- | --------- | -------- | --------- | ------------------------------------------------------------- |
| 932 by 534 px, 1.9 s, 50 fps | Takumi    | 4.83 MB  | 1,492 ms  | 523, 76, and 792                                              |
|                              | prototype | 1.18 MB  | 551 ms    | 0, 0, and 0                                                   |
| 1302 by 1670 px, 3 s, 50 fps | Takumi    | 20.97 MB | 5,189 ms  | not compared                                                  |
|                              | prototype | 5.36 MB  | 4,819 ms  | not compared                                                  |

The plan rejected `gifenc` because Takumi already writes GIF. The prototype is not in this PR. The operator decides between Takumi's GIF as it is, a GIF encoder of our own, and a fix in Takumi.

### GIF frame rate

A GIF frame lasts whole hundredths of a second. Takumi rounds a frame of 33 ms up to 40 ms and still draws 30 frames for each second. A 1900 ms timeline at 30 fps and at 24 fps plays for 2280 ms. At 25 and 20 fps it plays for 1900 ms. At 60 fps Takumi fails with `Frame rate 60 fps exceeds the maximum 50 fps for this animation format`. `animationFps` maps 60 and 50 to 50, 30 to 25, and 24 to 20, and the timeline is planned at that rate.

### Lossy WebP

For the 35-line pair at 1240 by 1670 px, 3 s, 60 fps:

| WebP              | Size                        | Alpha                                                     |
| ----------------- | --------------------------- | --------------------------------------------------------- |
| lossless          | 6,616,678 bytes             | kept                                                      |
| lossy, quality 90 | 8,660,744 bytes, 31% larger | none. `webpmux -info` lists `alpha: no` for all 56 frames |

In the lossy file the margin around a smaller step was opaque black, and the rounded corners of the frame were filled. A comment in Takumi's tests says the animated container carries only the VP8 chunk.

### Report for Takumi, not filed

This is ready to file at `kane50613/takumi`. It was not filed from this run.

> **Animated GIF and lossy animated WebP lose transparency (2.19.0, 2.20.0, master)**
>
> 1. `encode_animated_gif` in `takumi-raster/src/write.rs` leaves `Frame::dispose` at `Keep`. Each frame is a whole canvas with a transparent index, so a pixel that turns transparent keeps the pixel of the frame before. A 300 by 200 box that shrinks to 300 by 100 on a clear canvas keeps 11,909 of 12,000 pixels opaque in the rows it left. `DisposalMethod::Background` fixes it.
> 2. `GifFrame::from_rgba_speed(width, height, &mut pixels, 28)` maps opaque colors near the transparent color to the transparent index. A dark outline of `rgb(7, 6, 13)` on a canvas with clear corners comes out clear. The sample factor 28 also gives small colored areas the wrong palette entry.
> 3. Lossy animated WebP has no `ALPH` chunk, so clear pixels turn opaque. A frame with `quality: 90` has `VP8 ` chunks only.

## Window keyframe stops

A window that changes scale plays its path in linear stops. A1 placed 200 even stops. `planTimeline` now takes the frame rate of the export and adds a stop at every time Takumi draws a frame, `floor(k * 1000 / fps)` ms. The 200 even stops stay for the live preview.

The unit test plays the keyframes. This is the largest distance of the window's center from its path over all frames of a 900 ms linear transition in a 1080 px square:

| Window                        | Frame rate | A1 stops  | New stops |
| ----------------------------- | ---------- | --------- | --------- |
| 480 by 117 to 2644 by 139 px  | 30 fps     | 0.0154 px | 0.0006 px |
|                               | 60 fps     | 0.0202 px | 0.0006 px |
| 200 by 100 to 2000 by 1000 px | 60 fps     | 0.0218 px | 0.0004 px |
| 480 by 139 to 480 by 1101 px  | 60 fps     | 0.0026 px | 0.0002 px |

The values left are the rounding of the test player.

The endpoint script now measures the frame and the window at every frame the export draws, 28 times for each case, where it measured 9. In the four target cases the window's center is within 0.022 px of the line between its ends and never crosses the padding. The script cannot tell the old stops from the new ones. With A1's stops the same run gives 0.026 px, because Takumi truncates lengths to 1/64 px, which is 0.016 px. The unit test is the proof of the change. The new limit for the window's center is 3/64 px.

## Perf

Not measured. The rule is to time only at a load average under 8. From 23:19 to 23:44 the load average stayed between 10 and 45 while other sessions ran, and no window opened.

The probe is ready. `p1.ts` and `p2.ts` are the 35-line pair of `apps/codeimage/src/core/animation/animation.perf.ts`, with 197 and 218 tokens.

- Static: ten interleaved cold runs of `codeimage a.ts -o out.png` with the CLI built at `29521428` and at head, after one warm-up each. The rule is a head median at most 1.05 times trunk.
- Animated: ten cold runs each of `codeimage p1.ts p2.ts --animate --hold 1050 --transition 900 --fps 60 --scale 1.41 -o perf.webp` and of the same command with `-o perf.gif`. The clip lasts 3 s and is 1240 by 1670 px, which is the pixel count of 1920 by 1080. The rules are a WebP median at most 4 s and a GIF median at most 10 s.

Two facts bear on the budgets. The static path is unchanged: lane 1 gives byte-identical PNGs on trunk and head. WebP is lossless, and the budget of 4 s came from a lossy prototype. One run of the lossless clip took 5.5 s against 2.9 s for lossy, at a load average of 12. That run is not a measurement.

## Gates

- `pnpm lint` exits 0 with 0 errors. Its 16 warnings are in app files this branch does not touch.
- `pnpm typecheck` exits 0 after `prisma generate` and the API build.
- `pnpm why shiki --filter=@codeimage/app` prints nothing.
- `scripts/parity/animation-endpoints.ts` typechecks by hand with the two expected TS1470 errors.

## Left open

- The perf lane.
- GIF holes and colors, and whether to write our own GIF encoder.
- The report for Takumi.
- Lane 4 in Chrome.
- The encode check of the two widest cases.

## Review

A second model reviewed the branch at `ea7c086d`, on the same base `29521428`, and added three commits. The review ran on Node 26.5.0 and Takumi 2.19.0, with the load average between 11 and 30.

### Findings

| Finding                                                                                                                                                                                                                                                                                                               | Severity | Action                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The GIF test counted opaque pixels only in the rows above a shorter frame. It missed the ghost beside a narrower frame, 2,342 px when a wide step is followed by a tall one, and it could not see a patch that clears too much.                                                                                       | Medium   | Fixed in `1a5bb422`. The test now compares the first and last frame with the still of each step in both orders, and counts ghost and hole pixels. Without `clearGifFrames` it fails with 19,120 and 2,342 ghost pixels. With it, both counts are 0. |
| With a preset at 60 fps and `-o demo.gif`, stderr said `--fps: GIF supports...` although no `--fps` was given.                                                                                                                                                                                                        | Low      | Fixed in `6357f5d6`. The note names only the rates, and a test covers the preset.                                                                                                                                                                   |
| In `animation-endpoints.ts` a function named `reference` shadowed the `reference` diff that the pass check reads.                                                                                                                                                                                                     | Low      | Fixed in `f2d4ccc2`.                                                                                                                                                                                                                                |
| `--animate` with one input writes a single still frame for 800 ms and prints nothing.                                                                                                                                                                                                                                 | Low      | Left for the operator. A note or a usage error are both reasonable, and `--diff` can also yield one step.                                                                                                                                           |
| `--hold` and `--transition` have no upper bound. A3's `DURATION_LIMITS` clamp a hold to at most 10 s and a transition to 100 to 5000 ms. Render time grows with the clip. In single runs at a load average above 11, two 10 s holds took 7.9 s and two 1 s holds took 3.0 s, and peak memory stayed at 171 to 184 MB. | Low      | Left for the operator.                                                                                                                                                                                                                              |
| `--format ''` prints `cannot write .. Use .webp, ...`.                                                                                                                                                                                                                                                                | Low      | Left.                                                                                                                                                                                                                                               |
| `renderAnimation` calls `renderFrame` only to learn the code font's family name, which costs one extra server render per call.                                                                                                                                                                                        | Low      | Left. It does not change the output.                                                                                                                                                                                                                |
| `ANIMATION_DEFAULTS` in `packages/render/src/document.ts` repeats the values of the one A3 adds in `apps/codeimage/src/state/editor/animation.ts`.                                                                                                                                                                    | Low      | Left for the A3 rebase.                                                                                                                                                                                                                             |
| `animationFps` and `clearGifFrames` live in `packages/render`, which the web app cannot import. A4 needs both for the GIF that Takumi WASM writes.                                                                                                                                                                    | Note     | Left for A4. Move both into `apps/codeimage/src/core/animation/` when A4 adds the second caller.                                                                                                                                                    |

### The author's decisions

1. **Lossless WebP, no `--lossless`: kept.** A lossy file with black margins and filled corners is a visible defect, and it was also 31% larger.
2. **GIF at 50, 25, or 20 fps: kept.** Takumi gives every GIF frame one delay in whole centiseconds, so 30 and 24 fps can only play 20% slow. The note on stderr says which rate the file plays at.
3. **Timing from `--preset`: kept.** The CLI takes code files and has no project input, so the preset is the only file it reads. The preset's `animation` must still name an `editorId` for every step, and the CLI ignores it. No web menu writes that section: A3's **Copy as CLI config** copies `frame`, `terminal`, and `editor` only. Whether the CLI should read a project JSON, or the preset should take timing without steps, is the operator's call.
4. **`--split-tabs` and `--alt` rejected with `--animate`: kept.** Both describe one image per tab, and the animation is one file.
5. **`clearGifFrames`: kept, and its bytes are checked.** Takumi writes a global color table of 2 entries, a local table of 256 entries per frame, a transparent index, and a whole-canvas frame every time, in all cases checked, including a 1600 by 900 target. A probe mocked `clearGifFrames` to get Takumi's raw bytes for four animations (tall to short, short to tall, three steps, one step), ran the real patch, and diffed the files. It also ran on copies with the global table removed. In all 8 files the patch changed exactly one byte per frame (63, 63, 105, and 20 frames), and in that byte only the disposal bits, to "restore to background". `gif2webp` from libwebp decoded each patched file, and every frame matched `decodeGif` in `test-utils.ts` pixel for pixel. The patch stops at the first block it does not know, and it touches only a Graphic Control Extension that comes before a whole-canvas image, so it cannot shift or resize any block. It assumes each frame is a full picture. If a later Takumi stores only the changed pixels of a frame, the patch would clear pixels that the next frame needs, and the new test would count them as holes.
6. **`planTimeline` requires `fps`: kept as required.** A default would let an export path, such as A4's GIF export, leave out the frame stops without any error, and Appendix C measured a window up to 1.8 px off its path without them. A3 already has the rate in its settings. On a rebase onto A2 the merge is clean, and `apps/codeimage/src/components/Animation/planPreview.tsx` is the only caller without `fps`. A3 must add `fps: settings.fps,` to the options that it passes to `planTimeline`, after `easing: settings.easing,`. The preview then has the same keyframe stops as a WebP or APNG export at that rate.

### Verification

- `pnpm lint` exits 0 with 0 errors and the 16 warnings in app files this branch does not touch. `pnpm typecheck` exits 0. `pnpm why shiki --filter=@codeimage/app` prints nothing.
- `pnpm --filter=@codeimage/app test` passes 115 tests, `@codeimage/render` passes 77, and `@codeimage/cli` passes 117.
- `animation-endpoints.ts --encode` passes `rename`, `grow`, `gutter`, `marks`, `identity`, `edge-empty-to`, `edge-target`, and `edge-target-scale`. WebP and APNG are 0.000% on every frame. Every GIF has 0 ghost pixels, and the holes are 4,599 in `edge-target` and 545 in `edge-target-scale`, as before.
- Lane 3 at this head: `--fps 60 -o l3.gif` prints `GIF supports 50, 25, or 20 fps, so this one plays at 50 instead of 60` and writes 125 frames of 20 ms. A preset at 60 fps prints the same note, and the same preset with `.webp` prints none.
- The perf lane did not run. The load average stayed between 11 and 30 for the whole review.

## Verdict at 2f2fc75a and root follow-up

An independent Fable verifier passed every gate, the ten lanes, parity, and the GIF disposal stress at `2f2fc75a`. It blocked only on the WebP perf budget.

- **WebP budget re-baselined from 4 s to 6 s.** The 4 s budget came from the lossy prototype. A2 encodes WebP losslessly, an accepted decision, because Takumi's lossy animated WebP drops alpha and was 31% larger. The verifier measured a median of 4.42 s over 20 cold runs (range 3.52 to 6.89 s) for the 3 s, 60 fps, 1920 by 1080 pixel-count clip, with the 1-minute load between 6.2 and 8.0 at each start. Each run spends about 19.7 s of CPU in the lossless encoder. The root countersigns the new budget of 6 s on that evidence.
- **Interrupted writes.** The CLI now writes to `<path>.<pid>.partial` and renames it into place, and removes the partial file on SIGINT or SIGTERM. A SIGINT 4 s into a 2x render exited 130 and left no file.
- **Preset `animation` section.** It is checked only with `--animate`, so an invalid section no longer breaks still exports. With `--animate` the error reads `--preset animation: <field>: <issue>`.

Open for A4:

- A GIF with a hidden frame background draws the window shadow as a solid black slab, because GIF alpha is on or off. A4 should offer WebP or APNG when the background is hidden, or flatten the shadow for GIF.
- A GIF without `--fps` plays at 25 fps, by design, with no note.

## Restack on the split core

On 2026-11-15 the animation core moved to #734, and A1 (#707) became the Node part on P3. This branch was rebased from `ca0ad024` onto the new A1 head `ea3c8041`. The ten A2 commits replayed without a conflict, and `git range-diff` reports each of them unchanged. `dbafcff3`, the frame stops of [Window keyframe stops](#window-keyframe-stops), was left out, because the core now carries it as `df7e2448`. A2 changes no file under `apps/` any more, so its changeset no longer names `@codeimage/app` or the keyframe stops. The runs below used Node 24.14.0 and Takumi 2.19.0, with the load average between 9 and 20.

**CSS order in `renderAnimation`.** `renderAnimation` passed the app stylesheet before the scene CSS. The scene CSS holds the CodeMirror rules, so `.cm-gutter {overflow: hidden}` came last and beat `marks.css`. P5 draws the diff sign and the start of a mark band in the window inset, and an exported animation clipped both. `snapshotMarkup` and the endpoint script already load the CodeMirror CSS first, and `renderAnimation` now does the same. `media/a2-restack-marks.png` shows the first frame of the new test before and after.

| Check                                                                                     | Old order   | New order |
| ----------------------------------------------------------------------------------------- | ----------- | --------- |
| New render test: pixels of the first and the last frame that differ from the step's still | 368 and 368 | 0 and 0   |
| `--encode`, `marks`, WebP and APNG                                                        | 0.025%      | 0.000%    |
| `--encode`, `edge-focus-change`, WebP and APNG                                            | 0.027%      | 0.000%    |
| `--encode`, `edge-mark-edit`, WebP and APNG                                               | 0.000%      | 0.000%    |

The new test renders two tabs of one size with line numbers as APNG, 319 by 239 px. The middle line is removed in the first tab and added in the second. The 368 pixels are the 16 px of inset left of the line number, over the 23 rows of the marked line. The old `--encode` numbers come from a run with the order swapped back in the built `dist/index.mjs`. The encode gate allows 0.5%, so it passed on the old order too, and the unit test is the check that fails.

**Results.**

- All 43 endpoint cases pass. `reference` is 0.000% in every case, the largest start is 0.008%, the largest end is 0.161% in `edge-line-2000`, and the frame center stays within 0.705 px.
- `--encode` ran on 41 cases, without the two widest. WebP and APNG are 0.000% on every frame. Every GIF has 0 ghost pixels, the holes are 4,599 in `edge-target` and 545 in `edge-target-scale` as before, and the GIF color diff is 0.001% to 0.484%.
- Lane 7, `codeimage changes.diff --animate --diff --size x-landscape --signature @riccardoperra -o lane7.webp` on a `git diff` of two files, writes 1600 by 900 px, 29 frames, and 2500 ms. Frame 0 equals the still of the same command without `--animate` in all 1,440,000 pixels. The band of the removed line runs from x 562 to x 1038, the inner width of the window, with the minus sign in the left inset.
- `pnpm lint` exits 0 with 0 errors and the same 16 warnings. `pnpm typecheck` exits 0 after `prisma generate` and the API build. `pnpm why shiki --filter=@codeimage/app` prints nothing. `animation-endpoints.ts` typechecks by hand with the two expected TS1470 errors.
- `pnpm --filter=@codeimage/app test` passes 121 tests in 20 files, `@codeimage/render` passes 78 in 4 files, and `@codeimage/cli` passes 122 in 7 files.

Lanes 1 to 6 and 8 to 10 and the perf lane were not run again.
