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

**target-scale at 100% fails at 0.592%.** It is the hold of the 45-line step, which a target frame draws at device scale 1 with the window scaled to about 0.47. The window's edges match to the pixel in both renderers, at x 631 to 968 and y 63 to 836. The diff sits on whole rows of glyphs that Chrome and Takumi snap to different pixel rows at that scale. Promoting the window to its own compositing layer made it worse, at 0.805%. No motion is involved at 100%, so the cause is static text rasterization, not the keyframes. Whether a static web export of the same frame shows the same gap was not measured.

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
| 7 | Delete a tab that is a step | Pass. Three steps become two and playback keeps running. | `media/a3-delete-tab.png` |
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
- The timing popover does not close on Esc while a segmented control has focus. A click outside closes it. The kit's radio group handles the key.
- On a phone the stage can sit off center when the video is wider than the editor frame, because the mobile canvas scale is computed from the editor frame once.
