# A1 verification

A1 of `docs/plans/2026-code-animation.md` compiles two code steps into one keyframed scene. This file records the unit, live, and perf evidence, on base `ffc0827c` (`feat/cli-feature-flags`). The runs used commit `7b8f2b13`. The code at `33a23e7c` differs from it by one deleted comment line in `entry-server.tsx`. Every pixel diff uses pixelmatch at threshold 0.1, and the limit is 0.5% of pixels.

A review pass then changed the pairing and the compile step. It reran the unit tests and every live case at `76f8a8ff`. [Review changes](#review-changes) lists what it changed and why.

An audit then blocked the branch at `755796c2` on blank lines in Plain Text tabs. [Fix round](#fix-round) lists the five fixes and the evidence for each.

The base then moved to `cd6bb473`, where focus is a list of lines instead of a flag. [Rebase and second review](#rebase-and-second-review) lists how A1 follows it and what a second review of the fix round changed.

A third audit blocked `6a492e45` on a frame that drifts off center while it grows. [Fix round 2](#fix-round-2) lists the five fixes and the evidence for each.

A fourth audit blocked `0ebb11ac` on a window that leaves the padding of a target frame while its scale changes, and on a layout check that passes a shifted layer. [Fix round 3](#fix-round-3) lists the rebase onto `b7004dad` and the fixes. The tables below hold the numbers of fix round 3. The 40 cases that `0ebb11ac` ran kept every number.

On 2026-11-15 A1 split in two. The core moved to #734 on `main`, and this PR keeps the Node part on P3. [Split from the core](#split-from-the-core) lists what the move onto the final P5 line marks changed.

## Unit

`pnpm --filter=@codeimage/app test` passes 111 tests in 18 files. The animation tests are 40 of them.

- `pair.test.ts` has 13 tests. They cover a rename with one leave and one enter, two lines inserted at the top, two identical steps, a recolored token, tab stops, wide glyphs, line numbers, a gutter that gains a digit, kept marks, two marks on equal lines, a mark on an edited line, diff indent, and focus dimming. Focus dims every row outside the focused lines, marked or not, and focused lines outside the code turn it off.
- `compile.test.ts` has 11 tests. `test-utils.ts` plays the compiled keyframes, and each test asserts where an element is, how large, and how opaque at the start, middle, and end of the transition. A move from (0, 0) to (2, 4) sits at 0, 20, and 40 px. A leaving token is gone at 30%, and an entering token starts at 70%. A recolored token slides in both colors while they crossfade. A row that loses focus dims while the row that gains it brightens, with its mark and its line number.
- `AnimatedCodeView.test.ts` renders two steps with SSR. It finds each visible token once, the five kept tokens one row lower at the end, and the three new tokens faded in.
- `timeline.test.ts` has 13 tests for `planTimeline` and `frameRules`. A transition is two scenes that switch the active step halfway, after the hold and before the next hold. A hold of 0 ms has no scene. A single step is one hold, and a single step held for 0 ms has no scenes. The first frame of a 1 ms transition shows the step it leaves. The video is the largest frame, and each frame sits centered on whole pixels. A frame that grows from 466 by 267 to 516 by 715 px has its center within 0.5 px of the video's at 25%, 50%, and 75%, and its ends are the frames of its holds. An export target keeps its frame and moves the window. Every animation a scene plays has its keyframes. A window whose fit scale changes keeps its visible center on the frame's center within 0.01 px at 25%, 50%, and 75%, and its visible box inside the padding. That holds for one short line to two long ones in a square, 2 lines to 45 in a landscape, and 60 lines to two long ones. When the two ends have different centers, the visible center moves on the line between them on the easing. Both ends of such a window are the placements of its holds.
- `measure.test.ts` has 2 tests for `measureCode`. It reads the cell width and the line height from two probe layouts, and it measures each grapheme outside printable ASCII once, in cells.

`pnpm libs:build` then `pnpm --filter=@codeimage/render test` passes 48 tests in 4 files. `animation.test.ts` calls `renderAnimationScenes` in the built entry with Takumi `measure()`. Each scene's frame keeps its own size although all scenes share one stylesheet, the active tab switches at the half, and a step whose tab is gone fails with `The snapshot has no tab "gone"`. With the scene left out of the frame selector, the first hold is as tall as the last and the test fails. `pnpm lint` reports 0 errors, and `pnpm typecheck` passes after `prisma generate` and the API build. `pnpm why shiki --filter=@codeimage/app` prints nothing.

## Live

`pnpm exec tsx scripts/parity/animation-endpoints.ts` runs lanes 2 to 10 at scale 2. For each case it renders the transition at its first and last frame with Takumi and compares them with the static export of the step it leaves and the step it reaches. The `reference` check compares the script's static path for step one with `renderSnapshot` and is 0.000% in every case. `frames` is the frame size at the start, the middle, and the end.

The script also checks the layout. It measures the hold scene and the transition frame next to it with Takumi `measure()`, at the start and at the end. Every box from the page down to the code box and the gutter box must keep its place within 0.5 px, and every character that the hold shows within 0.15 px. Takumi places a line by its border box and its text runs from its content box, so the script measures each hold once more with an empty inline block first in every line and gutter element, and counts each character from there. A layer that moves as a whole fails, as [Fix round 3](#fix-round-3) shows.

The script also checks the paint. For every code row, gutter included, it compares the mean color of the frame with the mean color of the static export. A row may move 0.05 of an 8-bit level. [Rebase and second review](#rebase-and-second-review) has the defects that this check catches and the pixel limit does not.

The script also checks the center. It measures the frame at nine times of the transition, from its start to its end in eighths, and finds how far the frame's center is from the video's. A hold sits on whole pixels, so its center may be 0.5 px off for an odd margin and 0.25 px more for a width that was rounded to place it. The limit is 0.75 px. In a target frame it also measures the window at the same nine times. Its visible center may stray 0.75 px from the line between its two ends, and its visible box may cross the frame's padding by 1/64 of a device pixel, the length Takumi truncates to.

A case passes only when both ends report `ok` for the layout and for the paint, the center is within its limit, and a target frame's window is within its limits. Every case in the tables below does.

| Lane | Case                                | Start  | End    | Center   | Frames                    | Result | Screenshot               |
| ---- | ----------------------------------- | ------ | ------ | -------- | ------------------------- | ------ | ------------------------ |
| 1    | Static export, trunk and head       | 0.000% |        |          |                           | pass   | `media/a1-static.png`    |
| 2    | rename                              | 0.000% | 0.000% | 0.223 px | 688x334 at every time     | pass   | `media/a1-rename.png`    |
| 3    | grow, 20 lines added                | 0.001% | 0.001% | 0.188 px | 466x267, 491x491, 516x715 | pass   | `media/a1-grow.png`      |
| 4    | gutter, 3 lines inserted at the top | 0.000% | 0.000% | 0.406 px | 466x401, 466x435, 466x468 | pass   | `media/a1-gutter.png`    |
| 5    | marks                               | 0.000% | 0.000% | 0.195 px | 741x334, 741x345, 741x356 | pass   | `media/a1-marks.png`     |
| 5    | focus on the highlighted line       | 0.000% | 0.000% | 0.195 px | 722x334, 722x345, 722x356 | pass   | `media/a1-marks.png`     |
| 6    | ligatures, Geist Mono               | 0.000% | 0.001% | 0.129 px | 573x267, 621x267, 669x267 | pass   | `media/a1-ligatures.png` |
| 6    | ligatures off, control              | 0.000% | 0.001% | 0.129 px | same                      | pass   | `media/a1-ligatures.png` |
| 7    | fallback, CJK and emoji             | 0.001% | 0.000% | 0.102 px | 466x267, 466x278, 466x289 | pass   | `media/a1-fallback.png`  |
| 8    | dracula                             | 0.000% | 0.000% | 0.195 px |                           | pass   | `media/a1-themes.png`    |
| 8    | githubLight                         | 0.000% | 0.000% | 0.195 px |                           | pass   | `media/a1-themes.png`    |
| 8    | fleetDark                           | 0.000% | 0.000% | 0.195 px |                           | pass   | `media/a1-themes.png`    |
| 8    | nightOwl                            | 0.001% | 0.000% | 0.195 px |                           | pass   | `media/a1-themes.png`    |
| 8    | synthwave84                         | 0.000% | 0.000% | 0.195 px |                           | pass   | `media/a1-themes.png`    |
| 9    | macOs                               | 0.001% | 0.001% | 0.102 px |                           | pass   | `media/a1-terminals.png` |
| 9    | windows                             | 0.000% | 0.001% | 0.102 px |                           | pass   | `media/a1-terminals.png` |
| 9    | macOsGrayTheme                      | 0.001% | 0.001% | 0.102 px |                           | pass   | `media/a1-terminals.png` |
| 9    | macOsOutlineTheme                   | 0.001% | 0.001% | 0.102 px |                           | pass   | `media/a1-terminals.png` |
| 10   | identity, every frame at 30 fps     | 0.000% | 0.000% | 0.023 px | worst frame 0.000%        | pass   | `media/a1-identity.png`  |

Each screenshot shows the start, middle, and end frames side by side. `a1-grow.png` is from fix round 2 and also shows the frames at 25% and 75%.

The rerun at `76f8a8ff` gives the same number in every row. Its 36 static PNGs and 18 side-by-side sheets are byte-identical to the ones rendered at `4e4ae4f1`, so the review changes did not move a pixel of these cases.

**Lane 1.** A1 adds no code to the web app bundle, and no module outside the new files imports them. The web export is unchanged. `scripts/parity/export-matrix.ts --base ffc0827c --head HEAD --theme Dracula` exported 8 PNGs per side through the editor, one per terminal with and without line numbers. Every pair is 0.0000%. The Node static export changed shape in `entry-server.tsx`, so six `renderSnapshot` documents rendered on a trunk build and a head build: the sample, Windows, no line numbers, `x-landscape`, three tabs, and focus marks. All six are 0.0000%, and the default PNG is byte-identical. `a1-static.png` shows the web Dracula macOS export of trunk and head.

The fix round changes the static export on purpose. At its head, the same six documents and a Plain Text document without blank lines render byte-identical PNGs on trunk and head. A Plain Text document with blank lines differs, because head now draws them. The web export renders tabs through the same `StaticCodeView`, so it gets the same fix. The browser lane was not rerun.

After the rebase, nine `renderSnapshot` documents rendered on a build of `cd6bb473` and on head: the sample, Windows, no line numbers, `x-landscape`, three tabs, focus on a line without a mark, diff marks with focus, and Plain Text with and without blank lines. Eight are byte-identical. Plain Text with blank lines differs, as above.

**Lane 3.** At the midpoint the frame is 491 by 491 px, halfway between 466 by 267 and 516 by 715. Its center stays within 0.188 px of the video's over the whole transition.

**Lane 4.** A line number is keyed by its value, so it stays on its row and no number is drawn twice. The plan asked for numbers that slide with their lines. A number that slides down with its line must arrive as a different number, so every number below an insertion would fade into the next one. A number that stays reads like the gutter of an editor, where the code moves past a fixed ruler. Numbers move only when the gutter gains or loses a digit, or when the first line number of the tab changes. At the midpoint numbers 1 to 8 slide right while the gutter gains a digit, and 9 to 11 wait to fade in.

**Lane 5.** The kept `added` mark is halfway between its two rows at the midpoint, with its plus sign. The dropped highlight fades out, and the new `removed` mark fades in at the end.

**Lane 6.** Before fix round 2 the end frame was 0.0625 px narrower than the static frame, 669.195 px against 669.258 px, so the right border and the watermark antialiased differently, and the end scored 0.112%. The frame now takes the static frame's size, and the end scores 0.001%. The code box inside it is still narrower. The same case with ligatures off scored 0.113%, so ligatures are not the cause. The cause is measured. Takumi starts each text run of a line where the run before it ends, rounded up to 1/64 of a device pixel. The longest static line has 25 runs. Their exact widths add up to 998.400 device pixels and their rounded widths to 998.516, which is the width the layout reports for the line without its padding. The animation sizes the code box as 52 cells, and Takumi truncates that to 998.391. The gap is 8/64 of a device pixel. JetBrains Mono has the same cell width and shows the same rounding. A static token also sits about 0.005 device pixels further right for every run before it on its line. That is the likely reason the 604-column line of `edge-long-line` scores 0.031% at its end.

**Lane 7.** The fallback fonts draw CJK and emoji about 1.7 cells wide. With plain columns the endpoints scored 0.181% and 0.318%, under the limit, but the emoji was drawn over `世界`. `renderAnimationScenes` now measures each distinct grapheme outside printable ASCII once, and the cells use the measured width.

**Lane 10.** The second half of a transition shows the second tab as active, so its frames are compared with the static export of that tab.

### Edge cases

`animation-endpoints.ts` also runs 25 `edge-*` cases for inputs a user can produce, 43 cases in all. All of them pass, with the frame center within 0.703 px.

| Case                    | Input                                               | Start  | End    |
| ----------------------- | --------------------------------------------------- | ------ | ------ |
| edge-escape             | `<`, `>`, `&amp;` and quotes in code and in strings | 0.000% | 0.000% |
| edge-crlf               | CRLF line endings, line numbers on                  | 0.000% | 0.000% |
| edge-tabs               | tabs as indent and inside a line                    | 0.000% | 0.000% |
| edge-empty-from         | an empty tab, then two lines                        | 0.000% | 0.001% |
| edge-empty-to           | two lines, then an empty tab                        | 0.001% | 0.000% |
| edge-blank-lines        | blank lines, a line of spaces, trailing newlines    | 0.000% | 0.000% |
| edge-long-line          | a 604-column line in a frame 5969 px wide           | 0.001% | 0.011% |
| edge-line-2000          | a 2000-column line in a frame 19371 px wide         | 0.001% | 0.161% |
| edge-periodic           | rows of 80 repeating digits, 8 rows then 20         | 0.008% | 0.013% |
| edge-header-cross       | a 566 px window for the tabs, then 906 px for code  | 0.000% | 0.001% |
| edge-glyph-tab          | tabs named `世` and `界`, which the code also uses  | 0.000% | 0.000% |
| edge-target             | the `x-landscape` target at scale 1, 20 lines added | 0.002% | 0.068% |
| edge-target-scale       | `x-landscape`, 2 lines to 45, scale 1 to 0.701      | 0.002% | 0.032% |
| edge-target-scale-wide  | `square`, 12 columns to 271, scale 1 to 0.360       | 0.000% | 0.021% |
| edge-target-scale-both  | `square`, 60 lines to 271 columns, 0.662 to 0.360   | 0.001% | 0.021% |
| edge-width              | `width: 900`                                        | 0.000% | 0.000% |
| edge-recolor            | `foo` to `foo()`, where the token changes color     | 0.000% | 0.001% |
| edge-focus-diff         | focus with added, removed, and highlight marks      | 0.000% | 0.000% |
| edge-mark-edit          | a highlighted line is edited and stays highlighted  | 0.000% | 0.000% |
| edge-focus-change       | focus moves to other lines, the marks stay          | 0.000% | 0.000% |
| edge-focus-off          | the second step has no focused line                 | 0.000% | 0.000% |
| edge-line-start         | the first line number goes from 1 to 98             | 0.000% | 0.000% |
| edge-plain-text         | two Plain Text tabs                                 | 0.000% | 0.000% |
| edge-plain-blank-lines  | Plain Text with blank lines, line numbers off       | 0.000% | 0.000% |
| edge-plain-blank-gutter | Plain Text with blank lines, line numbers on        | 0.000% | 0.000% |

Five one-off cases that are not in the script also pass. A full-width space, a ZWJ emoji, combining accents, and a no-break space with arrows and box-drawing characters score 0.000% at both ends. An Arabic word in a comment scores 0.047% and 0.043%.

`renderAnimationScenes` was also called with three steps, with a step list that returns to its first tab, with holds of 0 ms, with a transition of 0 ms, and with one step. Every call returned scenes whose durations add up to the settings, and every scene rendered. `timeline.test.ts` now holds the scene order for these inputs, including one step, one step held for 0 ms, and a 1 ms transition. The type of `AnimationSettings.steps` rejects an empty step list. A step whose tab is gone throws `The snapshot has no tab "gone"`.

`--encode` also writes each case as WebP, GIF, and APNG with Takumi `renderAnimation` and decodes them with `animation-frames.ts`. For rename and grow, the decoded WebP and APNG frames match direct renders at 0.000%. GIF scores 0.071% and 1.162% from its 256-color palette.

## Perf

The verdict is no measurable difference for the static export, and compile time is far under its budget. Both probes ran only after the 1-minute load average fell under 8. Other sessions' headless Chrome processes kept it near 10 most of the time. The machine has 8 cores, 4 of them performance cores.

The static export probe is `pnpm exec tsx scripts/parity/animation-perf.ts --base-dist packages/render/dist-trunk/dist`. It renders the sample document as a PNG at scale 2, ten times per side, alternating trunk and head in one process after one warm-up each. Every render is compared with the first trunk PNG.

| Run | Load at start | Trunk median | Head median | Head / trunk | Trunk range     | Head range      | Mismatches  |
| --- | ------------- | ------------ | ----------- | ------------ | --------------- | --------------- | ----------- |
| 1   | 7.70          | 16.59 ms     | 16.77 ms    | 1.011        | 16.0 to 21.1 ms | 16.0 to 18.8 ms | not counted |
| 2   | 6.90          | 20.88 ms     | 18.38 ms    | 0.880        | 16.7 to 38.0 ms | 16.5 to 28.7 ms | 0           |
| 3   | 7.07          | 17.83 ms     | 17.67 ms    | 0.991        | 16.7 to 20.4 ms | 16.7 to 21.8 ms | 0           |
| 4   | 7.07          | 17.32 ms     | 17.10 ms    | 0.987        | 15.9 to 26.7 ms | 16.0 to 26.5 ms | 0           |
| 5   | 7.25          | 17.60 ms     | 17.86 ms    | 1.015        | 16.4 to 21.3 ms | 15.8 to 22.7 ms | 0           |
| 6   | 7.25          | 16.69 ms     | 17.19 ms    | 1.030        | 15.4 to 19.3 ms | 15.9 to 23.2 ms | 0           |
| 7   | 7.25          | 16.85 ms     | 17.02 ms    | 1.010        | 15.1 to 25.0 ms | 15.8 to 22.6 ms | 0           |

Every run passes the rule of at most 1.05 times trunk. Runs 3 and 4 are the fix round's head against the same trunk build. Runs 5 to 7 are the head of the second review against a build of the new base, `cd6bb473`. Three runs before them started at loads of 10.67 and 9.97 by mistake. They are discarded, with ratios of 0.940, 0.974, and 1.026. The gap between the sides is smaller than the run-to-run range, and both builds draw byte-identical PNGs, so they do the same work. A third run started at load 10.77 by mistake. It is discarded, with medians of 32.8 ms and 36.6 ms and ranges up to 83 ms. The limiter was not profiled. Trunk and head make the same Takumi measure and render calls on the same markup, so the static path has no new work to be slower.

The compile probe is `pnpm exec tsx src/core/animation/animation.perf.ts` from `apps/codeimage`. It times `pairScene` plus `compileScene` with line numbers on the 35-line pair of the prototypes, 197 and 218 tokens, 30 runs after 5 warm-ups.

| Run | Load at start | Median  | Range           | Keyframes CSS |
| --- | ------------- | ------- | --------------- | ------------- |
| 1   | 7.70          | 0.79 ms | 0.67 to 1.03 ms | not counted   |
| 2   | 6.90          | 0.83 ms | 0.67 to 1.43 ms | 16,660 bytes  |
| 3   | 7.57          | 0.95 ms | 0.76 to 3.87 ms | 16,660 bytes  |
| 4   | 7.57          | 0.86 ms | 0.72 to 2.59 ms | 16,660 bytes  |
| 5   | 7.07          | 0.81 ms | 0.68 to 0.98 ms | 16,660 bytes  |
| 6   | 7.07          | 0.84 ms | 0.71 to 1.07 ms | 16,660 bytes  |
| 7   | 3.50          | 0.89 ms | 0.72 to 1.40 ms | 16,660 bytes  |
| 8   | 3.50          | 0.87 ms | 0.72 to 1.17 ms | 16,660 bytes  |
| 9   | 3.50          | 1.01 ms | 0.77 to 2.01 ms | 16,660 bytes  |

Runs 3 and 4 are the review's rerun at `76f8a8ff`, runs 5 and 6 are the fix round's head, and runs 7 to 9 are the head of the second review. Their medians differ from runs 1 and 2 by less than the range of one run, so no round makes a measurable difference. Runs 5 to 9 read the same 35 lines from `animation.perf.fixture.txt` and count the same 197 and 218 tokens and 16,660 bytes of keyframes.

The rule is a median of at most 20 ms. A CPU profile of one unreported run splits the time about evenly between `pair.ts` and `compile.ts`. The magic-move diff is not among the ten largest entries.

### Cost of animating `left` and `top`

The verdict is no measurable difference between `left` and `top` moves and `transform` moves, in Takumi and in Chromium. The scene is the 35-line pair with line numbers, 263 spans, 194 of them moving. A copy of its stylesheet rewrites every move as `transform: translate()` on the final position.

| Renderer                              | Measure                                 | `left` and `top`       | `transform`                  |
| ------------------------------------- | --------------------------------------- | ---------------------- | ---------------------------- |
| Takumi native, 1848 by 2326 raw frame | render, median of 75 frames             | 37.9 ms, 32.9 to 103.9 | 39.3 ms, 32.5 to 99.9        |
| Takumi native                         | layout only, median of 75 `measure`     | 8.6 ms                 | 9.0 ms                       |
| Chromium headless, device scale 2     | frame interval, median and p95 per run  | 8.3 ms and 9.2 ms      | 8.3 to 8.4 ms, 9.1 to 9.3 ms |
| Chromium headless                     | frames over 25 ms, of about 480 per run | 0, 0, 0                | 0, 0, 0                      |
| Chromium headless                     | layout plus style per frame             | 0.80 to 1.02 ms        | 0.86 to 1.02 ms              |

The Takumi probe alternated the two sides over 15 times of the first half of the transition, for 5 rounds, at a 1-minute load of 6.6. All 14 consecutive frames differ, so the animation ran. Takumi lays out every frame in both variants. Layout is about 9 ms of a 38 ms frame. Drawing the 4.3-megapixel frame takes the rest and bounds the frame time.

The Chromium probe played each variant three times for 4 s, alternating, and started at a load of 7.6. Headless Chromium ticks at 120 Hz, and both variants hit every tick. The code box animates `width` and `height` in both variants, so Chromium runs layout on every frame either way. A first run started at a load of 10.0 by mistake. It is discarded, with the same medians. The probe does not cover Firefox, Safari, or a real display. A3 checks those in its preview lane.

## Findings that changed the design

- Takumi rounds layout positions to device pixels but not transforms. A token translated by `-22.4px` from `top: 44.8px` lands on 45.2 device pixels, while the static row sits on 45. Moves animate `left` and `top` instead of `transform`, so both endpoints are layout positions.
- The page clips its overflow. A frame translated into a larger video was cut to the height of the page, which scored 79% on the grow case. Each scene is now as large as the video.
- The tab header shows the active tab. A transition is two scenes that switch the active tab at the midpoint, with negative `animation-delay` on the second scene, so both endpoints match their static exports.

## Deviations from the plan

- `compileScene` takes a `Scene` with code, gutter, and mark layers and the size of each step's code box, instead of a flat list. `metrics` has no `origin`, because each layer sits in the box of the static layout that holds it, and the theme's paddings place it.
- Moves animate `left` and `top`, not `translate`, for the rounding reason above.
- A transition is two scenes, not one.
- `renderAnimationScenes(snapshot, settings, measure)` takes a measure function. The entry has no Takumi, and the video size and the character metrics need a layout. The result also carries `fontFamily` and `backgroundImage`, which the renderer needs to register fonts and fetch images.
- `renderFrame(snapshot, editorId)` takes the tab to render. Without it, only the first tab has a static export.
- A mark key is `mark:<kind>:<occurrence>:<text>`, so two marks of the same kind on equal lines stay distinct. A test holds this case.
- A line number is keyed by its value and stays on its row, as lane 4 explains. The plan's build step should read "Treat line numbers as tokens keyed by their value with a `gutter:` prefix, so a number keeps its row when lines are inserted above it." Lane 4 should read "Pass when the middle frame shows the code between its two places, every kept number on its own row, and no number drawn twice."
- A kept token that changes color is a `move` with a `fromClasses` field, not a leave and an enter. It compiles to two spans and two keyframes rules, one per color.
- A mark whose line was edited stays, when the other step marks the same row with the same kind. The plan fades every mark whose line text differs.
- `planTimeline` and `measureCode` in `core/animation` plan the scenes, outside the entry. `renderAnimationScenes` measures pages, calls them, and renders the scenes they return. The plan put all of it in the entry, which only Node can run.
- `compileScene` takes a fourth argument, the prefix of its keyframes names, so scenes that share a stylesheet do not collide.
- A mark transition carries its kind as `mark`, typed `MarkKind`. `kind` is already the move, enter, or leave field of every transition.
- Focus dims the rows outside `focusedLines`, as the static view does since P5. The plan dimmed the rows without a highlight mark.

## Review changes

A second model reviewed the branch at `4e4ae4f1` and changed four things.

- A kept token whose highlight class changes, such as `foo` in `foo` to `foo()`, was a leave and an enter. It was invisible from 30% to 70% of the transition and did not slide. It now slides in both colors while the old one fades out over the new one. `edge-recolor` holds the endpoints, and `media/a1-recolor.png` shows `foo` and `baz` halfway between white and green at the midpoint.
- A highlight on a line that the next step edits faded out and back in on the same row. The mark now stays. `edge-mark-edit` holds the endpoints, and `media/a1-mark-edit.png` shows the band at the midpoint.
- A tab with CRLF line endings caused one extra render and layout pass, to measure `\r\n` as a wide glyph. A CRLF pair now takes 4 passes, down from 5.
- A hold scene rebuilt the window rule that `targetLayout` returns. It now reuses that rule.

The review kept the other deviations. Moves stay on `left` and `top`, because both endpoints must come from layout to match the static export and the cost probe above shows no penalty. A transition stays two scenes, because one page cannot show two active tabs. The layered scene, the measure function, the `renderFrame` tab argument, the mark occurrence number, and the measured wide glyphs stay as they are.

## Fix round

An audit blocked the branch at `755796c2`. The fix round made five commits, each verified on its own.

1. `fix(app): keep blank lines of a Plain Text tab`. Without a parser, `tokenizeCode` returned one empty span for a blank line. `StaticCodeView` draws a `<br>` only for a line with no spans, so the line had no height when line numbers were off. The static export of `alpha\n\nbeta\n\ngamma` drew 3 rows, and the animation drew 5, so the content jumped at every hold boundary. A blank line now has no spans. A `tokenize.test.ts` case and a `StaticCodeView.test.ts` case failed first and pass now. The static export of that text is 270 px tall, the same as with the TypeScript parser. This fix also repairs the P1 static export, outside the A1 file boundary, with the operator's approval.
2. `test: fail animation endpoints that move the layout`. The 0.5% pixel limit missed this defect. The script now checks the layout, as [Live](#live) describes, and has two Plain Text cases with blank lines. With the old `tokenize.ts`, `edge-plain-blank-gutter` scores 0.185% and 0.264%, under the pixel limit, and the layout check fails it, because the code box is 67.2 px tall in the hold and 112.0 px in the transition. `edge-plain-blank-lines` fails on the frame size, 289 px against 334 px. A hold compared with the wrong step's end, with equal boxes, fails on the first moved character. In `rename` that check compared 116 characters of the hold with 132 of the frame.
3. `refactor(app): plan animation scenes in pure functions`. `measureCode(measure, code)` returns the code metrics and the glyph widths from any function that lays out code. `planTimeline(steps, options)` takes each step's tokens, measured layout, and hold, and returns the video size, the scenes in order, and the keyframes. A scene is a hold or a transition. A transition scene has its active step, its start time in the transition, the compiled code, and the frame motion, a slide between centered offsets or a window that moves inside an export target. Neither function imports Solid SSR, a store, Node, or the DOM. The 138 PNGs of the endpoint run are byte-identical before and after.
4. `refactor(app): tighten the animation types`. Marks have their own `MarkTransition`. `AnimationSettings.steps` is non-empty. A scene without line numbers has a null gutter, and the gutter holds its own columns. `compileScene` requires its keyframes prefix. `Point` and `Size` are defined once. The 138 PNGs are byte-identical again.
5. `test(app): assert where compiled tokens are, not their CSS`. The compile and view tests assert positions, sizes, and opacity over time instead of keyframes text. Five mutations of `compile.ts` each fail a test: a later leave fade, no `<` escaping, no diff indent, a positive delay, and no crossfade. `animation.perf.ts` reads its input from `animation.perf.fixture.txt`, the same 35 lines it read from `use-export-image.ts`.

### How A2, A3, and A4 use the plan

- A2 calls `renderAnimationScenes(snapshot, settings, measure)` with Takumi's native `measure`, as now.
- A3 measures in the page. Its `measure` for `measureCode` lays out code in a hidden element and builds the node tree from DOM ranges, and it reads each tab's frame size and window from the DOM. It calls `planTimeline`, mounts `AnimatedCodeView` with each transition scene's code, adds the timeline's keyframes, applies the frame motion, and scrubs with `getAnimations()`.
- A4 can run `measureCode` and `planTimeline` in a worker with the Takumi WASM `measure`, since both are pure. The frame markup around each scene's code still comes from a renderer, which is the SSR entry in Node and the page in the browser.

## Rebase and second review

The base moved from `ffc0827c` to `cd6bb473`. `TabMarks` now has `focusedLines` instead of a `focus` flag. `StaticCodeView` dims every line outside that list when at least one focused line is inside the code, whatever the marks are.

**Rebase.** The 23 commits were replayed one at a time onto `cd6bb473`. The commit that introduced each focus site carries its change, so every commit passes `tsc` and the app tests on the new base. `entry-server.tsx` conflicted once, on the default marks, and `pair.ts` once. Outside the focus sites, the A1 files are the same as at `1463dbff`. After the rebase the base gained `03489ca3`, one changeset file that A1 does not touch.

**Focus.** `dimmedRows` in `pair.ts` applies the static rule to a step. Tokens, marks, and line numbers read the same rows, so a row whose focus changes fades between 1 and 0.35 while its tokens move. `edge-focus-change` moves the focus to other lines and keeps the marks, and `edge-focus-off` drops it. `media/a1-focus-change.png` shows the highlighted line halfway to dimmed and the added line halfway to full at the midpoint.

**A dimmed row with a mark is 3 levels lighter.** The static view fades a dimmed line and its mark as one group. The animation fades the mark and each token apart, so the mark shows through the text. On a highlighted row the glyph pixels are 1 to 3 of 255 levels lighter than in the static export, which pixelmatch at 0.1 does not see. One opacity per row would need the tokens of a row in one box, and tokens leave their row. The paint check allows such a row 0.5 levels. In the three cases that have one, it moves at most 0.326.

**The gate passed defects that only change paint.** The pixel limit is 0.5% of the image, and the layout check sees no opacity and no color. Each defect below was injected, the render bundle rebuilt, and the cases rerun. Before the paint check, three of them failed, all on the pixel limit: the first two in one case each, at 0.693%, and the focus defect in the two new focus cases.

| Defect                                     | Case              | Pixel diff | Layout | Paint                    |
| ------------------------------------------ | ----------------- | ---------- | ------ | ------------------------ |
| Leaving tokens stay visible                | rename            | 0.110%     | ok     | row 1 moved 3.645 levels |
| Entering tokens are visible from the start | rename            | 0.062%     | ok     | row 1 moved 2.267 levels |
| The highlight mark is not drawn            | marks             | 0.018%     | ok     | row 5 moved 13.381       |
| Marks sit one row low                      | marks             | 0.045%     | ok     | row 2 moved 18.042       |
| The dim opacity is 0.5 in `compile.ts`     | focus             | 0.056%     | ok     | row 1 moved 2.284        |
| The dim opacity is 0.4 in `marks.css`      | focus             | 0.000%     | ok     | row 1 moved 0.766        |
| Line numbers are not dimmed                | focus             | 0.027%     | ok     | row 1 moved 0.159        |
| The old color of a recolored token stays   | edge-recolor      | 0.002%     | ok     | row 2 moved 0.263        |
| Diff signs do not draw                     | marks             | 0.008%     | ok     | row 2 moved 0.096        |
| Focus dims the rows without a highlight    | edge-focus-change | 0.574%     | ok     | row 1 moved 9.443        |
| Every token is 0.4 px to the right         | rename            | 0.043%     | ok     | ok                       |

A matching row moves at most 0.010 levels over the 36 cases, so the limit of 0.05 is five times the noise and half the smallest defect. The focus defect passes `focus` and `edge-focus-diff` at 0.000%, where the focused line is the highlighted one, so the two new cases are what catches it.

The last row still passes. A hold does not report the padding of its lines, so the layout check allows each layer one constant horizontal offset, and a shift keeps the mean color of a row. At 1 px the pixel limit fails `rename` at 0.784% and `identity` at 0.716%. A whole layer that sits between 0.5 px and about 1 px off passes all three checks. Fix round 3 closes this gap, and a layer 0.25 px off now fails the layout check.

An empty tab is now checked down to its code box and gutter. Both steps share one frame, so the path to the code box of the other step leads to it.

**Smaller changes.**

- `AnimatedCodeView` no longer writes `data-line-marks`, `data-line-focus`, and `data-line-diff` on its root. `marks.css` reads the first and the last from the marks box that `compileScene` writes. The 146 PNGs of the endpoint run are byte-identical.
- `model.ts` defines the `Token` and `Mark` shapes once, and `pair.ts` uses them.

**The seam for A3 and A4.** `measureCode`, `planTimeline`, `pairScene`, and `compileScene` import no Solid SSR, store, Node, or DOM API, and `AnimatedCodeView` renders on both sides. Two things stay with the renderer, and one is a known gap.

- Since fix round 2 the frame rules are the core's. `frameRules(scene, selectors)` in `timeline.ts` turns a scene's frame placement or motion into CSS for the selectors it gets. The SSR entry passes `[data-snapshot-frame]` and `[data-snapshot-window]` under each scene, and A3 passes the page's selectors.
- The web `FittedWindow` centers the window with `translate(-50%, -50%) scale()` from the center. A `WindowPlacement` is a top left corner, a size, and a scale from the top left. A3 reads the placement of each step from the DOM and pins the window that way while a transition plays.
- `targetLayout` computes a `WindowPlacement` from a natural size, and it lives in the SSR entry. A worker that plans a target frame from a Takumi WASM measure needs that math, so A4 moves it next to `fitScale` first.
- `measureCode` finds the run of a wide grapheme by its text anywhere in the measured page. A renderer must measure a page that draws no other text the code may hold. The SSR entry blanks the tab names since fix round 2, and A3 does the same in its hidden element.

## Open after the review

- `renderAnimationScenes` passes `holdMs` and `transitionMs` through. Takumi rejects a `timeMs` that is not an integer, so the code that reads the settings must round them. A2 and A3 own that code.
- A project whose durations add up to 0 ms, such as one step held for 0 ms, has no scenes. A2 and A3 reject it where they read the settings.
- On a long static line each glyph sits up to 1/64 of a device pixel further right for every text run before it, and the animation does not follow that rounding. A 2000-character line ends 1.18 px apart, and the layout check allows it. [Fix round 2](#fix-round-2) has the probe.
- A1 sits on `b7004dad`, the rewritten `feat/cli-feature-flags`, since fix round 3.

## Fix round 2

An audit blocked the branch at `6a492e45`. The round made five commits, each verified on its own.

1. `fix(app): keep a growing frame centered on the video` (`6a73f8fe`). A slide moved the frame between its two centered offsets on the transition easing, but the frame took its width from layout, the larger of the tab header and the code. While the code was narrower than the header, the frame slid before it widened. The slide now animates the frame's width and height between the two hold sizes on the same easing as its offset. Both ends are the holds' frames, and the frame's center stays on the video's. `frameRules` and `targetWindowCss` moved into `timeline.ts` as pure functions of a scene and its selectors. A timeline test failed first on the old keyframes, because the frame had no size to play, and passes now.
2. `fix(app): show the step a 1 ms transition leaves on its first frame` (`eba0fcda`). The halfway switch rounded down, so a 1 ms transition was one scene that showed the next tab with the tokens of the first step, a frame that matched neither static export. It now rounds up. For 900 ms nothing changes, and for 901 ms the first half is 451 ms instead of 450.
3. `fix(app): measure wide glyphs without the tab names` (`07168531`). The measuring page now blanks every tab name. `edge-glyph-tab`, with tabs named `世` and `界`, failed the layout check before, with the `;` after `世` out of place and row 1 moved 0.092 levels. It passes now at 0.000% at both ends.
4. `test: allow a long static line its run rounding` (`4c845cd6`). See below.
5. `test: render the scenes of a two-step animation` (`ba160761`). [Unit](#unit) describes it.

**The center, before and after.** The endpoint script measured the frame's center at nine times of every transition, on a build of `6a492e45` and on head. Every other case stays within 0.703 px on both builds.

| Case              | Frames at head               | `6a492e45` | Head     |
| ----------------- | ---------------------------- | ---------- | -------- |
| grow              | 466x267, 491x491, 516x715    | 12.441 px  | 0.188 px |
| edge-header-cross | 694x267, 864x267, 1034x267   | 56.602 px  | 0.102 px |
| edge-long-line    | 466x267, 3217x278, 5969x289  | 28.091 px  | 0.441 px |
| edge-line-2000    | 466x267, 9919x278, 19371x289 | 28.095 px  | 0.441 px |

`edge-header-cross` names its first tab `animation-before-the-change.ts`. Its window is 566 px wide for the tab header at the start and 906 px wide for its code at the end. At `6a492e45` its middle frame was 751 px wide in a 1034 px video and sat about 56 px left of center.

**Which PNGs changed.** The 38 cases that both builds run were compared frame by frame. 32 are byte-identical in their start, middle, and end frames and in both static exports. Every static export is byte-identical. The middle frame changed in `grow` and `edge-header-cross`, whose frames widen. The middle and end frames changed in `ligatures`, `ligatures-off`, `edge-long-line`, and `edge-line-2000`. In each of them the end frame is wider than its code box, so it now takes the static frame's width instead of the truncated width of its code. The end of `ligatures` went from 0.112% to 0.001%, and `edge-long-line` from 0.031% to 0.011%. Frames whose size already followed the code box on the same easing did not change. That covers every frame that only grows taller, and `edge-mark-edit`, which is wider than its header at both ends.

**Long lines.** At `6a492e45`, `edge-line-2000` failed on its code box, 19371.2 px in the hold and 19370.0 px in the transition. With the frame sized by the timeline, the boxes match and a glyph at x 16439.4 failed. A probe measured where each token of the line sits in the hold and in the last frame. The animation puts each token on its exact cell, truncated to 1/64 of a device pixel. The hold sits 0.594 device px further right at the 125th token, 1.188 at the 250th, and 2.359 at the 500th, linear along the line. Takumi starts each text run of a static line where the run before it ends, rounded up to 1/64 of a device pixel. At the 16 px code size of the case a cell is 19.2 device px, so a run of n cells ends 0.8n/64 past a boundary, and each run adds 0.2/64. The 125th token follows 60 items of three runs each, the string, the comma, and the space, which predicts about 0.59 device px. The verifier saw the same drift in four fonts, which fits a drift that depends only on the cell width. Matching it would put Takumi's per-run rounding at one pixel ratio into CSS that the browser preview also plays, so it is a known limit. The layout check allows each glyph 1/64 of a device pixel more for every run before it on its line, 1/128 px per run at scale 2. That is the most each run can add. The real drift at the end of the 2000-character line is 1.18 px.

**Checks.** `pnpm lint` reports 0 errors, and `pnpm typecheck` passes after `prisma generate` and the API build. The app tests and the render tests pass as [Unit](#unit) says. `pnpm why shiki --filter=@codeimage/app` prints nothing. `animation-endpoints.ts`, `animation-frames.ts`, and `animation-perf.ts` typecheck by hand, with the two expected TS1470 errors in the first. All 39 endpoint cases of `ba160761` pass. `844538b4` then added `edge-periodic`, so `0ebb11ac` runs 40. The perf tables were not rerun. The static export path did not change, and the compile step gained no work.

## Fix round 3

An audit blocked the branch at `0ebb11ac`. The base `feat/cli-feature-flags` had been force-pushed to `b7004dad` with rewritten history. A1's 37 commits were replayed onto it with `git rebase --onto`. The only conflict was `pnpm-lock.yaml`. It was regenerated from the base's lockfile with `@shikijs/magic-move` added, and the base's `example-basic` link path kept. The only other file both changed is `apps/codeimage/package.json`, which git merged on its own. The Plain Text blank line fix in `tokenize.ts` is not on the base, so A1 keeps it. The round then made three commits.

1. `test: reproduce the window drift of a rescaling target frame` (`6b5b1786`). Three timeline tests, which fail 2 of 13 on the old keyframes. The endpoint script gained three target cases and measures the window inside a target frame.
2. `fix(app): keep a rescaling window centered inside its target frame` (`084a4fb8`).
3. `test: fail the layout check on any shift of a whole layer` (`be2008f4`).

**The window.** A target frame placed its window by its left, top, width, height, and a scale from the top left, and a transition keyframed each of them on its own. The visible width is width times scale, so when the scale changes it is not on the easing path. The center misses its path by (w1 − w0)(s0 − s1)/8 at the midpoint, and the visible box can outgrow both ends. In `edge-target-scale-wide` the window reached 1079 px in a 952 px padded area, and its center sat 173 px right of the frame's at 50%. `windowAt` in `timeline.ts` now places the window at each progress. Its size moves with the code inside it. Its scale is the largest that keeps its visible box within the straight line between the two end boxes on both axes. Its visible center moves on the line between theirs. That keeps the box inside any area that holds both ends. CSS cannot interpolate that path, so a window whose scale changes plays 200 stops of it with linear timing, each at the progress the easing gives its time. The progress function matches Takumi's `cubic-bezier` within 0.0002 px over a 1000 px move. Both ends keep the declarations of the holds. A window whose scale stays keeps its two keyframes, which already move its box on the easing.

The endpoint script measured each target frame's window at nine times of the transition. Drift is how far its visible center strays from the line between its two ends. Out is how far its visible box reaches into the padding.

| Case                   | Scale          | Drift at `0ebb11ac` | Out at `0ebb11ac` | Drift now | Out now |
| ---------------------- | -------------- | ------------------- | ----------------- | --------- | ------- |
| edge-target            | 1 to 1         | 0.016 px            | 0 px              | 0.016 px  | 0 px    |
| edge-target-scale      | 1 to 0.701     | 36.047 px           | 0 px              | 0.017 px  | 0 px    |
| edge-target-scale-wide | 1 to 0.360     | 173.229 px          | 228.441 px        | 0.017 px  | 0 px    |
| edge-target-scale-both | 0.662 to 0.360 | 95.341 px           | 41.733 px         | 0.018 px  | 0 px    |

The verifier's script measures the same three inputs at every 60 fps frame. It now gives a window center within 0.020 px with the smooth easing, 0.104 px with snappy, and 0.023 px with linear, and 0 px in the padding with all three. At `0ebb11ac` it gave 36.047 px, 173.220 px, and 81.748 px with smooth. Between two stops the path is a straight line, which is where the remaining tenth of a pixel comes from.

**Which PNGs changed.** The 126 PNGs of this run were compared pixel by pixel with renders of `0ebb11ac`. 123 are identical, which covers every static export and every frame of the 40 cases that `0ebb11ac` runs, `edge-target` included. The three that changed are the sheets of the new cases, compared with the verifier's renders of the same inputs at `0ebb11ac`. Their start and end panels are identical. Only the panels at 25%, 50%, and 75% changed, where the window now stays centered.

**The layout check.** It took the most common offset between hold and frame characters as the line padding that hold runs leave out, with no bound, so a whole layer could move. A 2 px shift of the code layer in the first frame passed it in `rename`, `gutter`, `marks`, and `edge-target`. The pixel limit caught three of them, at 1.278% to 1.516%, but not `edge-target`, at 0.103%. A 2 px shift of the gutter layer passed every check in `gutter` and `marks`, at 0.130% and 0.057%. The offsets that really occur are the left padding of the hold's line. In the code layer it is 8 px, or 27.25 px with diff marks, which is 8 px and two cells. In the gutter it is 8 px, or 0 px in fleetDark, which wraps the number in a box of its own. Long lines moved the most common offset to 7.75 px or 7.5 px through run drift. The check now measures each hold a second time with an empty inline block first in every line and gutter element. That block sits where the line's text starts, so each character is measured from it with no offset to guess. Every character must be within 0.15 px of its place, plus the run drift. The largest distance in any of the 43 cases is 0.031 px. `--shift code:2` or `--shift gutter:2` moves a layer of the first frame.

| Shift in the first frame | rename | gutter | marks | edge-target |
| ------------------------ | ------ | ------ | ----- | ----------- |
| code layer, 2 px         | fail   | fail   | fail  | fail        |
| code layer, 0.25 px      | fail   | fail   | fail  | fail        |
| gutter layer, 2 px       | pass   | fail   | fail  | pass        |
| gutter layer, 0.25 px    | pass   | fail   | fail  | pass        |

`rename` and `edge-target` show no line numbers, so a gutter shift moves nothing there. Each fail names the first character out of place, such as `code "f" at 88.0,138.2 has no match`.

**Checks.** `pnpm lint` reports 0 errors, and `pnpm typecheck` passes after `prisma generate` and the API build. `pnpm --filter=@codeimage/app test` passes 111 tests in 18 files, and `pnpm --filter=@codeimage/render test` passes 48 in 4 files. `pnpm why shiki --filter=@codeimage/app` prints nothing. `animation-endpoints.ts`, `animation-frames.ts`, and `animation-perf.ts` typecheck by hand, with the two expected TS1470 errors in the first. All 43 endpoint cases pass. The per-run slack on long lines stays a known limit.

## Split from the core

The core went to #734, branched from `main` at `4fbf6e37`, so the animation UI can ship with the new editor before the CLI. It holds 29 commits. 26 are A1 commits replayed without the SSR entry, the parity scripts, and this file. The others are A2's `fps` fix for `planTimeline`, a note in the plan, and one new fix. This branch is P3 at `75c84c22`, then those commits, then the Node part as four commits. The Node part is the final state of each file. Its early commits call core functions that the core no longer exports, so a replay of them one by one would not typecheck.

**Line marks.** P5 changed how the static export draws a mark after A1's last base. The band now covers the line number too and reaches into the window inset on both sides. The diff sign and the highlight bar sit in the inset, or on the line number when the gutter shows. Diff code is no longer indented by two columns. On P3 the animation still drew the earlier style, and 5 of the 6 mark cases failed, with start and end at up to 1.114% and the code 2 cells right of the hold. `fix(app): draw animated line marks like the static export` drops the indent and draws each band again on its line number. `AnimatedCodeView` takes `showLineNumbers` and sets `data-line-marks` and `data-line-numbers` like `StaticCodeView`, so `marks.css` draws the inset and the sign the same way.

**The endpoint script.** P3 now loads the CodeMirror CSS before the app stylesheet, so `marks.css` keeps the gutter and the scroller from clipping a band. The script still used the old order, and its `reference` check drifted from `renderSnapshot` by up to 0.027%. A marked line draws its band with pseudo-elements, and Takumi then wraps its text in an anonymous box, so the line-start marker is no longer the line's first child. The script now takes the leftmost empty node of the line.

**Results.** All 43 cases pass with the numbers of the tables above, `reference` is 0.000% in every case, and the frame center stays within 0.703 px. Every mark case is 0.000% at both ends. A one-off case with added, removed, and highlight marks, focus, and no line numbers also scores 0.000% at both ends, and its start frame shows each sign and band. `--shift code:2` and `--shift gutter:2` still fail `marks`.

**Checks.** `pnpm lint` reports 0 errors, and `pnpm typecheck` passes after `prisma generate` and the API build. `pnpm --filter=@codeimage/app test` passes 121 tests in 20 files, and `pnpm --filter=@codeimage/render test` passes 48 in 4 files. `pnpm why shiki --filter=@codeimage/app` prints nothing. `animation-endpoints.ts` typechecks by hand with only the expected TS1470 errors.

## Port to the P10 export path

`feat/p3-node-renderer` replaced the static export of the SSR entry with `composeFrame`, which draws the shared `FrameView` with media resolved before render, a fitted window in two passes for an export target, the window types, the signature, and a watermark that `packages/render` places afterwards. The merge kept that path and dropped A1's copy of the frame. The `media/` screenshots above are per-run evidence and no longer ship in the repo.

**Holds.** `composeFrame` now runs through `composeStep`, which composes one tab, and `renderAnimationScenes` calls it for every step. A hold is that step's static export: the same `FrameView` body, the same media and images, and the same frame size, which the timeline pins and centers. A transition draws the same `FrameView` with `AnimatedCodeView` as its code. The timeline pins a target's window in a frame without padding, and `FittedWindow` places it inside the padding, so a transition scene keeps the frame's own padding and the window keyframes start from the box of the hold. A Takumi probe showed that a keyframe overrides the window's inline place. The static path is unchanged: the 70 `takumi-cells` documents without a remote image render byte-identical PNG and SVG on a build of the merge and on head.

**Watermark.** A transition still holds tokens that are hidden at its ends, so placing the watermark again on a transition scene moved it to another slot (`grow` started 1.362% off). `watermarkScenes` in `packages/render` places each step's static export as `createRenderer` does and copies that mark into the step's scenes. A moved mark in a transition hangs from its corner of the frame, so it follows a frame that resizes.

**Results.** All 43 endpoint cases pass at scale 2. `reference` is 0.000% in every case, start is at most 0.023%, end at most 0.160% (`edge-line-2000`), and the frame center stays within 0.703 px. P10 rounds a target window's place to whole pixels and fits the rounded size, so a static export can reach into the padding: 0.290 px in `edge-target-scale-both` and 0.056 px in `edge-target-scale-wide`. The script now lets a transition reach as far as its ends, plus 1/64 device px, and every frame in between stays inside. `edge-target-scale` ends at 0.092% instead of 0.032%, for the same rounding. `--shift code:2` and `--shift gutter:2` still fail `marks`.
