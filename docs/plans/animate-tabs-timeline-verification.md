# Animate tabs timeline verification

Implementation worktree: `/Users/riccardoperra/.t3/worktrees/codeimage/animate-timeline`, branch `feat/animate-tabs-timeline`, based on `45f68cd7`. All setup and checks use Node `v24.14.0`. The prototype at `80e93f87` was read with `git show`; it was not merged or cherry-picked.

## Slice checks

| Slice                      | App unit tests       | API unit tests      | Typechecks         | Other checks                                                                            |
| -------------------------- | -------------------- | ------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| 1: model/schema/projection | 547 passed, 68 files | 78 passed, 15 files | App and API passed | Frozen install, libraries build, touched-file oxfmt/oxlint, comment audit passed        |
| 2: engine                  | 550 passed, 68 files | Unchanged           | App passed         | Libraries build, touched-file oxfmt/oxlint, comment audit passed; Takumi parity blocked |
| 3: script editing          | 556 passed, 70 files | Unchanged           | App passed         | Libraries build, touched-file oxfmt/oxlint, comment audit passed                        |
| 4: timeline/bar            | 556 passed, 70 files | 79 passed, 15 files | App and API passed | Libraries build, production build, touched-file oxfmt/oxlint, comment audit passed      |
| 5: verification            | 555 passed, 68 files | 80 passed, 15 files | App and API passed | Root lint, touched-file oxfmt, and all seven Animate journeys passed                    |

Prisma generation and its package build were necessary for the API typecheck. API unit tests use synthetic test environment values for the required database/Auth0/origin configuration; no database migration or connection is needed for those unit tests.

## Browser lane

Backend: the skill's existing MSW/Auth0 development adapters. The helper owns Vite, a fresh Chromium profile, isolated contexts and traces. It closes contexts/browser/server and removes its temporary profile and Vite cache on completion. Every run uses an available dedicated port and a new evidence directory.

The first two passes exposed and corrected a CodeMirror transaction reconfiguration issue, a keyboard chip reopen guard that also affected Space, and an i18n context issue in layout icons. Browser fixture corrections narrowed duplicate add-tab locators, avoided localStorage writes in opaque origins, and configured the window before switching to phone size. These failures are retained in the earlier run artifacts; they are not reported as passing.

Seven distinct journeys passed across the final targeted reruns:

| Journey                                                               | Result | Evidence directory              |
| --------------------------------------------------------------------- | ------ | ------------------------------- |
| One/two/three tabs and Cards/List                                     | Passed | `/tmp/animate-timeline-audit-3` |
| Script creation, line Enter, middle-step removal and stable selection | Passed | `/tmp/animate-timeline-audit-2` |
| Enter/Space chip popover and focus return                             | Passed | `/tmp/animate-timeline-audit-2` |
| Done and keyboard Escape leave Animate                                | Passed | `/tmp/animate-timeline-audit-3` |
| IndexedDB script/ranges/IDs survive reload                            | Passed | `/tmp/animate-timeline-audit-2` |
| 390×844 List and bottom-sheet close/focus return                      | Passed | `/tmp/animate-timeline-audit-3` |
| Real script GIF export and aid exclusion                              | Passed | `/tmp/animate-timeline-audit-3` |

The successful export contains 20 decoded GIF frames. Every submitted scene was checked for aid attributes, badge text and script decoration classes. First and last decoded frames are retained as `animate-script-frame-0.png` and `animate-script-frame-19.png` and visually inspected. `animate-script-scenes.json` retains the submitted scene HTML/CSS. The browser helper also passed its editor-to-PNG baseline and decoded the actual PNG download. Screenshots of the Cards timeline and phone bottom sheet were also visually inspected. Final run doctor: Chromium `143.0.7499.4`, MSW active, server `http://127.0.0.1:4479`; owned browser/profile/server cleanup completed.

The first verification run is `/tmp/animate-timeline-audit-1`; its failures remain evidence of the issues found. Run 2 retains three passing journeys and failed layout/phone checks; run 3 passes all four selected journeys after those fixes. This is seven distinct passing journeys across two runs, not a claim that the complete historical audit passed.

## Limits

- The retained Takumi parity script cannot execute because `packages/render/dist/index.mjs` and the render package are absent on this baseline. A direct Node 24 invocation reaches that missing module; tsx additionally rejects its top-level await in CommonJS. Engine unit tests pass, but this is not a parity result.
- The browser lane uses mocked services. Production OAuth, real API/PostgreSQL persistence, Safari, Firefox and physical touch devices are not covered.
- Script Leave/Focus controls, pointer tab reordering and minimap panning/hover/follow have source and unit coverage where applicable but were not individually exercised by these seven browser journeys.
- The complete historical animation export/layout/locale/reduced-motion matrix has not been run for this implementation. The seven focused journeys report only the assertions they actually exercise.

## Lint gate follow-up

Merged `origin/main` with PR #791 before the cleanup. Timeline, overview, script badge, and canvas toolbar styles now use classes on their elements. Long rendering, model, CodeMirror setup, and browser journey functions are split into smaller modules. The API keeps its existing exports, with animation schemas in `project.contract.animation.ts` and parsing in `project.model.animation.ts`.

Optional values are narrowed without assertions. Conditional branches replace nested ternaries. The phone sheet restores focus through the timeline viewport reference. Keyboard input tracking uses listeners scoped to the editor and Animate overlays. `pnpm lint:tighten` lowered 35 baseline entries; no findings were accepted and no disable directives were added.

Validation uses Node 24.14.0:

- Root `pnpm lint` passes.
- App `tsc --noEmit -p tsconfig.json` and API `pnpm typecheck` pass.
- App Vitest: 555 tests in 68 files pass.
- API unit tests: 80 tests in 15 files pass with synthetic database, Auth0, and origin values.
- Touched-file oxfmt checks pass. Existing library builds were sufficient for both typechecks.

All seven Animate journeys and the editor-to-PNG baseline pass in `/tmp/animate-timeline-lint-788-final`. The script GIF contains 20 decoded frames across four submitted scenes, with edit aids absent. The first and last decoded frames were visually inspected. The existing server on `localhost:5199` remains running.

The controlled style comparison retains captures in `/tmp/animate-timeline-lint-788-styles-before` and `/tmp/animate-timeline-lint-788-styles-after`. Screenshots settle animations, and adjacent JSON files record computed dimensions, spacing, typography, colors, and opacity for transport controls, duration fields, transition popovers, menus, List rows, and script aids. The four repeated journeys cover Cards and List, script editing and the step menu, keyboard transition popovers, and the phone sheet. The separator correction was rerun in `/tmp/animate-timeline-lint-788-separator`. Across 13 captures, all 2,490 recorded style values match the merged source. `style-comparison.json` retains that comparison. The Cards and List timeline, chips, popover, step menu, overview ruler, canvas transport, Animate mode pill, phone sheet, script badge, and dimming were visually inspected.

Production services, non-Chromium browsers, physical touch devices, and the unavailable Takumi render package remain outside this verification.
