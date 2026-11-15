# A3 verification

A3 of `docs/plans/2026-code-animation.md` adds the Animate panel and a live preview of the tab-to-tab morph in the editor. This file records the unit, parity, and live evidence. The base is A1 at `29521428`, which did not move during the work. The lanes, the parity run, and the video ran at `546bd8f0`. The head adds `45f6d606`, which changes types only, and lane 1, lane 2, and lane 9 ran again there.

Every pixel diff uses pixelmatch at threshold 0.1, and the limit is 0.5% of pixels.

## How the preview works

The preview plays in place of the editor frame. Pressing play plans the timeline in the page with the same functions the server renderer uses. `measureCode` reads the code font with DOM ranges, and each step's static frame is laid out in a hidden copy of the export frame. `planTimeline` then gives the scenes and keyframes. Every scene stays mounted with its frame rules from `frameRules`, and the playhead sets `currentTime` on the animations of the shown scene. While it plays, the playhead steps on the frame times of the chosen fps, so the preview shows the frames the video will hold.

Playback is a reducer over `editing`, `playing`, `paused`, and `scrubbing`. Any change to a tab's code returns it to `editing`. The stage covers the editor while it previews, so typing on the focused stage returns to the editor and the key lands in the code. Esc and the stop button also return to the editor. Space plays and pauses only while the stage or the scrubber has focus.

## Unit

`pnpm --filter=@codeimage/app test` passes 125 tests in 20 files. `animation.test.ts` has 11 of them. It covers the default steps, a deleted tab and a new tab, rounding and clamping, the 0 ms timeline, invalid saved fields, and every playback transition, including typing back to `editing`.

The API unit run passes 62 tests in 13 files with the CI environment. `mapper/animation.test.ts` checks that an update carries the animation, that a request without one leaves the saved one alone, that fractional durations and unknown easings or frame rates fail the schema, that a 0 ms animation is dropped, and that a clone points its steps at its own new tabs.

The project integration tests ran on a fresh `postgres:18-alpine` with `prisma migrate deploy` and a setup that only connects the seed client, since Prisma refuses `migrate reset` for an agent. All 34 integration tests pass on three fresh databases. The new test saves an animation that names a stored tab and a new tab. The server gives the new tab its own id and the saved step follows it. A failing variant that skips that remap fails the test.

Reusing one database across runs makes `PUT /v1/project/:id -> 200` fail about one run in ten on tab order. The API reads tabs without an `ORDER BY`, and that test asserts an order. Fresh databases pass every time. This predates A3.

## Gates

| Gate | Result |
|---|---|
| `pnpm lint` | 0 errors |
| `pnpm typecheck` | 10 packages pass |
| App tests | 125 passed |
| API unit tests | 62 passed |
| API integration tests | 34 passed on 3 fresh databases |
| `@codeimage/render` tests | 48 passed |
| `pnpm why shiki --filter=@codeimage/app` | prints nothing |

## Preview parity

`scripts/parity/animation-preview.ts` loads each case into the running app's stores, pauses the preview at 0%, 25%, 50%, 75%, and 100% of the first transition, and captures the shown scene in Chrome at the snapshot's device scale. It renders the same times with Takumi from `renderAnimationScenes` with `timeMs`, and compares them. Each case has holds of 500 ms, a 900 ms transition, and the smooth easing.

```sh
pnpm exec tsx scripts/parity/animation-preview.ts --worker apps/codeimage/node_modules/msw/lib/mockServiceWorker.js
```

| Case | Size | 0% | 25% | 50% | 75% | 100% |
|---|---|---|---|---|---|---|
| rename | 1338x668 | 0.000% | 0.000% | 0.000% | 0.000% | 0.000% |
| grow | 1032x1430 | 0.000% | 0.014% | 0.000% | 0.031% | 0.005% |
| target-scale | 1600x900 | 0.102% | 0.044% | 0.053% | 0.189% | 0.592% |
| gutter | 1080x936 | 0.003% | 0.148% | 0.002% | 0.094% | 0.014% |
| marks-focus | 1444x712 | 0.000% | 0.054% | 0.000% | 0.047% | 0.008% |

24 of 25 cells pass. `grow` grows from 2 to 22 lines, `target-scale` is an X landscape target whose window scales down to 45 lines, `gutter` has line numbers, and `marks-focus` has added, removed, and highlighted lines with focus. The raw rows are in `media/a3-parity.json`, and `media/a3-scrub.png` shows the grow case at 25%, 50%, and 75%, Chrome on top and Takumi below.

**target-scale at 100% fails at 0.592%.** It is the hold of the 45-line step, which a target frame draws at device scale 1 with the window scaled to 0.70. The window's edges match to the pixel in both renderers, at x 631 to 968 and y 63 to 836. The diff sits on whole rows of glyphs that Chrome and Takumi snap to different pixel rows at that scale. Promoting the window to its own compositing layer made it worse, at 0.805%. No motion is involved at 100%, so the cause is static text rasterization, not the keyframes. [The review](#the-target-scale-cell-at-100) measured the static frames and found the cause.

**Fonts.** The page draws with the render package's font files unless `--app-fonts` is set. The app ships Inter 3 from `inter-ui`, and the render package ships Inter 4. With the app's own files, 21 of 25 cells pass. `grow` scores 0.705%, 0.651%, and 0.716% at 0% to 50%, because its first frame takes its width from the tab header, which is 2.5 CSS px narrower in Inter 3. The other cells score 0.060% to 0.276%, apart from target-scale at 100% at 0.601%, mostly from the tab names and the watermark. This is the static gap between the web app and the Node renderer, and it is outside A3.

**The script found two harness bugs and one product bug.**

- A `waitForFunction` predicate that returns a promise passes at once. The script keeps the editor store on `window` and checks the paused playhead synchronously.
- Cases that reuse tab ids let the mounted code editor map the last case's marks onto the new code. Each case now names its own tabs.
- After the editor frame stayed laid out under the stage, every step was measured at the editor frame's size, and three cases failed on size. The measuring frames now size from their own code.

## Live lanes

The lanes ran at `546bd8f0` in the Chromium of Playwright 1.57, against `vite` with `VITE_ENABLE_MSW=true` and `VITE_MOCK_AUTH=true`, one browser at a time.

| Lane | What it checks | Result | Evidence |
|---|---|---|---|
| 1 | Single tab, PNG export on base and head | Pass at `45f6d606`. 593x468 on both, 0 px differ. Head shows no Animate button with one tab. | `media/a3-single-tab.png` |
| 2 | Three tabs, play, pause at the middle of the first transition | Pass. Paused at 1.36 s with tokens between their two places. | `media/a3-play.png` |
| 3 | Drag the third step to the top, play | Pass. The first scene shows the third tab's code. | `media/a3-reorder.png` |
| 4 | Scrub to 25%, 50%, 75% of a transition | Pass. The parity table above, at 0.000% to 0.189% for those times. | `media/a3-scrub.png` |
| 5 | Type while the preview plays | Pass. Playback returns to `editing`, the key reaches the tab, and the editor shows the tab's code. | `media/a3-edit-stops.png` |
| 6 | Save, reload, reopen | Pass. One PUT carried the animation. After reload the order, a 1200 ms hold, 650 ms, linear, and 24 fps came back. | `media/a3-persist.png` |
| 7 | Delete a tab that is a step | Pass. Three steps become two, playback returns to `editing`, and Play runs the two steps. | `media/a3-delete-tab.png` |
| 8 | Chrome, Firefox, WebKit | Chrome and WebKit play and scrub. Firefox not run. | `media/a3-browsers.png` |
| 9 | Space with the preview focused, then the editor focused | Pass. Space pauses and plays on the stage. In the editor it types a space and stays in `editing`. | `media/a3-space.png` |
| 10 | 1440 by 900 and 390 by 844 | Pass. No horizontal overflow, step rows 40 px, island padding 12 by 16 px. | `media/a3-layout.png` |

Lane 6 swaps `apps/codeimage/public/mockServiceWorker.js` for the installed MSW worker during the run and restores it after. A reload updates the service worker past Playwright's route, and the checked-in worker is MSW 0.47 while the app uses 2.12.

Lane 8: the Firefox install stalled while it extracted, with 888 KB written, as it did in earlier lanes. The WebKit build Playwright 1.57 expects stalled the same way, so WebKit ran on the complete 2388 build with `playwright-core` 1.65.1. WebKit first drew scrollbars inside the moving code box, which Chrome's overlay scrollbars hide. The stage now clips the code box as Takumi does, and the parity numbers did not change.

## Perf

Not run. The plan allows timings only at a load average under 8, and the machine stayed between 8.8 and 44 during the session. The typing path adds one effect per keystroke that maps the tabs' code while the editor is in `editing`. The planner reads tabs only while previewing, so typing plans nothing. That is read from the code, not measured.

## Review gate

- `media/a3-review-play.png`, `media/a3-review-reorder.png`, `media/a3-review-layout.png`, and `media/a3-review-timing.png`.
- `media/a3-review.mp4`, 33 s at 1440 by 900 and 30 fps. It makes three tabs, drags the third step to the top, sets a 700 ms snappy transition at 60 fps and a 1.2 s hold, plays, scrubs, pauses with Space, and returns to the editor with Esc. It was captured with the Chrome screencast and encoded to H.264 with AVFoundation, since the only local ffmpeg writes WebM.

## Deviations from the plan

- The strings live in `apps/codeimage/src/i18n/animation.ts` in it, en, de, and es. `packages/locale` holds the i18n library, not string tables.
- Shared presets hold no tabs, so they carry no animation.
- The preview stage renders its own frame from `FrameView` with a plain window wrapper, as the server renderer does, instead of pinning `[data-fitted-window]`. `FrameView` is the frame markup that `PreviewFrame` now shares.
- The API keeps assigning ids to tabs it does not store yet and moves the animation steps that name them. Trusting client ids would have broken an existing test that sends another project's tab id.
- Outside the plan's file list, A3 edits `Toolbar/FrameToolbar.tsx` for the Animate button, `KeyboardShortcuts.tsx` for Space and Esc, the mock database, and `apps/api/src/api-types.ts`.

## Open decisions

- A frame the user resized by hand previews at the natural width of each step. The editor does not store a user width, only the measured width of the frame on screen, so the preview cannot tell the two apart. A4 decides what width the export uses.
- On a phone the stage can sit off center when the video is wider than the editor frame, because the mobile canvas scale is computed from the editor frame once. [The review](#the-phone-canvas) found the same offset in the editor frame of the base.

## Review

A second model reviewed `43355f85` in Chrome and added the commits from `9f925484` on the same branch. The lanes and the parity run below used the app code of `081ae6ea` and the scripts of `6ee9ed9c`. The base is still A1 at `29521428`.

### Defects fixed

| Finding | Severity | Commit |
|---|---|---|
| A key typed on the focused preview also ran the app's hotkey for that key. P typed `p` and doubled the padding from 64 to 128, and B hid the background. | High | `51dc4ea0` |
| A key typed on the preview of a project the user does not own changed its code. | High | `015dfb96` |
| After one plan failed, Play started the clock and showed nothing, with no message, until a tab or a setting changed. | Medium | `cd578ea0` |
| The stage stayed in the page after Stop, after closing the panel, and after opening another project. Three tabs of 35 lines kept 7286 nodes. | Medium | `cafb891d` |
| Esc did not close the timing popover while Easing or Frame rate had the focus. | Medium | `8fa6ed7f` |
| A click inside a hold popover moved the playhead to that step and replaced the editor with the preview. | Low | `e9033bb4` |
| Stop left the focus on the body. | Low | `7d6e6ff5` |
| A measuring frame whose render threw stayed in the page. | Low | `5113f130` |
| The parity capture forced every part of the stage visible, so Chrome drew the hidden spacer of the gutter. | Low | `6ee9ed9c` |

Esc is a defect of the base as well. `SegmentedControl` is a Kobalte tab list, which cancels Escape, and a Kobalte popover or dialog skips a cancelled Escape. On `29521428` Esc leaves the colour picker open while its Gradient, Color, Custom control has the focus. The fix is in `SegmentedField`, which every such control in the app goes through, and the colour picker now closes. A click and the arrow keys still select.

The stage stays mounted while the Animate panel is open. Entering the preview again then took 7 ms against 200 to 260 ms for a new plan, measured once at a load average of 13.8, so the two numbers show the order of magnitude and nothing finer.

`refactor(app): name the Animate panel's handlers` (`081ae6ea`) moves a step into `AnimationStep.tsx` and the two duration fields into `DurationField.tsx`, each with named handlers. `7ba7ef9b` lets the store return the saved animation in the shape the API takes, so the project sync no longer copies the steps at both save calls.

### Review lanes

`scripts/parity/live-a3.ts` drives the panel in Chrome against the mock API and asserts what a user sees.

```sh
pnpm exec tsx scripts/parity/live-a3.ts --url http://127.0.0.1:4200/ --worker apps/codeimage/node_modules/msw/lib/mockServiceWorker.js
```

At `9f925484`, before any fix, 7 of its 11 lanes failed. At `081ae6ea` 12 of 12 pass. The twelfth lane came with `5113f130`, where the children of the body went from 6 to 5 after a render that throws.

| Lane | `9f925484` | `081ae6ea` |
|---|---|---|
| Esc closes the timing popover from a segmented control | Fail | Pass |
| A click inside a hold popover leaves the playhead alone | Fail | Pass |
| A key typed on the preview reaches the code and no hotkey | Fail | Pass |
| A key typed on the preview of a read-only project edits nothing | Fail | Pass |
| Closing the panel removes the preview from the page | Fail | Pass |
| A preview that failed is planned again on the next play | Fail | Pass |
| A measuring frame whose render fails leaves the page | Not in the script | Pass |
| Stop returns the focus to the code | Fail | Pass |
| Play at the end starts again from the beginning | Pass | Pass |
| Scrubbing while it plays pauses at the scrubbed time | Pass | Pass |
| A tab deleted while it plays leaves the steps and the preview | Pass | Pass |
| Opening another project while it plays shows that project | Pass | Pass |

The last lane also loads a saved animation with a step for a tab that no longer exists. The step is dropped and the tab without a step is appended.

The lanes of the plan that these commits touch ran again at `081ae6ea` in the Chromium of Playwright 1.57.

| Lane | Result |
|---|---|
| 1 | Pass. 593x468 on base and head, 0 px differ, no Animate button with one tab. |
| 2 | Pass. Paused at 1201 ms, in a transition scene with 20 animations. |
| 3 | Pass. The steps are c, a, b and the first scene shows `c.ts`. |
| 5 | Pass. Playback returns to `editing` and the key lands in the active tab. |
| 6 | Pass. One PUT carried the animation. After a reload the order, a 1200 ms hold, 650 ms, linear, and 24 fps came back. |
| 9 | Pass. Space pauses and plays on the stage and types a space in the editor. |
| 10 | Pass. The island spans 340 to 1100 of 1440 px and 16 to 374 of 390 px, with 40 px rows. |

Lane 4 is the parity table below. Lane 7 is the deleted-tab lane of `live-a3.ts`. Lane 8 did not run again, since Firefox and WebKit still do not install here.

### Preview parity

The same command as above, at `6ee9ed9c`. 24 of 25 cells pass. Two cells changed, because the capture no longer shows the hidden spacer of the gutter: `gutter` at 100% went from 0.014% to 0.003% and `marks-focus` at 100% from 0.008% to 0.000%. The other 23 cells kept their numbers, and `media/a3-parity.json` holds the new rows.

### The target-scale cell at 100%

The cell fails at 0.592%. Chrome snaps the scaled window to a whole pixel and Takumi does not. That is the cause of 0.26 points of it. The rest is how the two renderers draw 11 px text, and the frame the web export draws has the same gap.

`--holds` compares the frames of each hold.

```sh
pnpm exec tsx scripts/parity/animation-preview.ts --case target-scale --holds --worker apps/codeimage/node_modules/msw/lib/mockServiceWorker.js
```

| Pair, for the hold at 100% | Diff |
|---|---|
| Stage against the Takumi hold | 0.592% |
| Takumi hold against Takumi's static export of the tab | 0.000% |
| The frame the web export captures, in Chrome, against Takumi's static export | 0.418% |
| Stage against the frame the web export captures | 0.478% |

Takumi draws the hold exactly as its static export, so the reference is right. The static frame of the web app already differs from Takumi by 0.418%, on whole rows of glyphs, and that predates A3. The stage differs from that static frame too, because it places the window as the Node renderer does, by `left`, `top`, and a scale from the top left, where `FittedWindow` centers the window with a transform.

The window of that hold is 480 by 1102 px at scale 0.7005, with `left: 631.869px`. `--stage-css` adds rules to the page, which shows what the fraction does.

| Rule added to the stage window | Stage against the Takumi hold |
|---|---|
| None | 0.592% |
| `left: 632px` | 0.592%, and the same pixels as with no rule |
| `left: 0; top: 0; transform: translate(631.869px, 64px) scale(0.700544)` | 0.331% |
| `translate: 0.1px 0` | 0.800% |
| `translate: 0.3px 0` | 1.067% |

Chrome draws `left: 631.869px` and `left: 632px` the same, so it snaps the offset of a transformed box to a whole pixel. Takumi keeps the fraction. With the offset inside the transform, where Chrome snaps nothing, the cell passes at 0.331%. A shift of 0.1 px moves 0.2 points. `media/a3-review-target-scale.png` shows the stage, the Takumi hold, and their diff.

Three more numbers come from a probe that is not in the repository. Rounding `left` and `top` in the rules Takumi gets changes 0.433% of Takumi's pixels, which is how the review knows that Takumi keeps the fraction. Moving the offset into the transform changes 0.107% of them. Shifting the stage by 0.2 px sideways changes 0.47% to 0.51% of the stage's own pixels, so on this frame the 0.5% limit equals a shift of a fifth of a pixel.

The fix was not made here. The rules come from `windowDeclarations` in `core/animation/timeline.ts`, which A1 owns and which the Node renderer and the static export of a target frame share. With the offset inside the transform, every target export of the CLI moves by a fraction of a pixel. That needs the endpoint parity of A1 and the outputs of A2 run again, and it is the operator's decision.

`--holds` also shows a static gap outside A3. For `gutter` at 100% the stage matches Takumi at 0.003%, and the frame the web export captures differs from Takumi's static export by 0.565%. The export frame takes its size from the editor frame on screen, and the preview and Takumi size the static view from its code.

### The phone canvas

The offset predates A3 and was left alone. At 390 by 844 on `29521428`, with one tab and no animation, the editor frame spans x 121 to 471, centered on 296 where the screen is centered on 195. `FrameHandler` scales the canvas with a transform, computed once when it mounts. The box keeps its unscaled width of 593 px in the layout, the grid cannot center a box wider than itself, and the scaled frame sits in the middle of that box. The head draws the same frame at the same place.

The stage inherits that canvas. With a second tab that holds a line of 96 characters the animation is 1092 px wide, the scaled stage spans x 223 to 868, and a phone shows only the checkerboard until the user scrolls. `media/a3-review-phone.png` shows the base, the head, and the head while it previews. A fix belongs in `FrameHandler`: compute the scale when the canvas changes size, and give the scaled box its visible size in the layout. That changes the phone layout of the editor itself, so it was not made in this PR.

### Left as it is

- A key typed on the preview lands in the active tab at its cursor, which is the tab the editor shows once the preview closes. It is not always the tab of the step on screen.
- Play starts the clock before the first plan is ready. The stage appears 0.2 s into the timeline at the load of this machine. With the default hold of 800 ms that part is a still frame. With a first hold of 0 ms it cuts the start of the first transition.
- Read from the code and not run: in a project the user does not own, a signed-in user can change the timing and the order, and the project sync then sends a PUT. `updateProject` in `project.repository.ts` scopes the update to the owner, so the API would reject it and the editor would show its save error. Randomize in the frame toolbar reaches the same path on the base.
- The base moved during the review. `feat/a1-animation-core` went from `29521428` to `ea3c8041`, and the PR conflicts with it, so GitHub starts no checks for this head. The 31 commits of this branch rebase onto `ea3c8041` without a conflict. That was tried in a scratch worktree and not pushed, because a restack needs a force-push. On that tree the app tests pass, 132 in 21 files, and `tsc` reports two errors that the new base causes. `planTimeline` now requires `fps`, as A2 also does, and `AnimatedCodeView` requires `showLineNumbers`. The fixes are `fps: settings.fps` in `planPreview.tsx` and `showLineNumbers={style.showLineNumbers()}` in `AnimationPreview.tsx`. Neither typechecks on `29521428`, so both wait for the restack.
- `ANIMATION_DEFAULTS` exists in A2 and in `state/editor/animation.ts` with the same values. Not merged here.

### Gates

| Gate | Result |
|---|---|
| `pnpm lint` | 0 errors in 11 packages |
| `pnpm typecheck` | 10 packages pass |
| App tests | 125 passed in 20 files |
| API unit tests | 62 passed in 13 files, with the CI environment |
| API integration tests | Not run. No database was running. |
| `@codeimage/render` tests | 48 passed |
| `pnpm why shiki --filter=@codeimage/app` | prints nothing |
| `scripts/parity/live-a3.ts` | 12 of 12 lanes pass |
| `scripts/parity/animation-preview.ts` | 24 of 25 cells pass |

Perf did not run. The 1-minute load average read 7.2 once, at the start, and 8.5 to 15 after that.
