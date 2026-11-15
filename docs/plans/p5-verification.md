# P5 web verification

CodeImage users can mark added, removed, and highlighted lines, keep those marks through edits, and export them today. P5 is now stacked on P1 and renders marks through StaticCodeView. CLI flags remain deferred until P4.

## Checks

- `pnpm install` and `pnpm libs:build` completed in this worktree.
- `pnpm --filter @codeimage/app test` passed 28 tests, including the shared language inference export and stripped context prefixes.
- `pnpm --filter @codeimage/api test:unit --maxWorkers=2` passed 28 tests with the unit environment configured.
- `pnpm lint` passed with the existing warning set.
- `pnpm typecheck` passed across the workspace.
- Prisma generated the client and validated the schema. The migration adds only nullable `SnippetEditorTab.marks` JSONB.

## Live lanes

Chromium 143 from Playwright's cached chromium-1200 drove the app on port 4405. The comparison fixture came from `27b185f18d36f2baec3a8cc5a43e8794586096c3` on port 4415. Screenshots and run logs are in `/tmp/swarm-p5/`.

| Lane | Result                                                                                                                                                                                                               | Evidence                                      |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 1    | Unmarked default PNG has 0 changed pixels out of 277,524 at pixelmatch threshold 0.1. Both images are 593 × 468.                                                                                                     | `parity.json`, `p5-no-marks.png`              |
| 2    | A two-file diff imports two syntax-colored tabs. Plain code beginning with a minus gets no diff offer.                                                                                                               | `p5-import.png`, `p5-import-export.png`       |
| 3    | Inserting two lines above a highlight on line 5 moves it to line 7.                                                                                                                                                  | `p5-mapping.png`                              |
| 4    | Focus dims non-highlighted code to opacity 0.35 in the export.                                                                                                                                                       | `p5-focus.png`                                |
| 5    | Local reload restores marks. A signed-in mock project writes added and highlight marks in the PUT payload and restores them from GET after reload.                                                                   | `p5-persist.png`, `p5-persist-remote.png`     |
| 6    | The selection bar marks lines 3–5 as added and exports the sign column.                                                                                                                                              | `p5-selection-bar.png`, `p5-added-export.png` |
| 7    | Chromium's Mod-Alt-1 and undo passed. Firefox could not launch in this macOS environment. Its sandbox refused plugin-container access and SWGL failed to map the framebuffer. No Firefox shortcut result is claimed. | `p5-shortcuts.png`, `firefox-unavailable.txt` |
| 8    | Pasted Shiki comments become marks. The toast Undo restores the comments.                                                                                                                                            | `p5-annotations.png`                          |
| 9    | Deferred with the CLI flags.                                                                                                                                                                                         | Not run                                       |
| 10   | Fleet Dark, VSCode Dark, XCode Dark, Night Owl, and Material Light keep all three mark kinds readable.                                                                                                               | `p5-theme-*.png`                              |

Gutter click and range drag passed. Switching tabs keeps the same EditorView, retains focus, and keeps scroll at 200 px while restoring each tab's marks. The hidden editor matches the active tab. Italian toolbar, toast, Undo, and shortcut labels passed.

## Development mock setup

The checked-in worker remains unchanged at MSW 0.47.4, as requested by the coordinator. These lanes used temporary Vite middleware to serve the installed MSW 2.12.14 worker. Neither the middleware nor a generated worker is in this patch. The copied `.env.local` was used only in this worktree with MSW enabled.

The mock database now hydrates before the worker starts. New mock IDs use the browser's `crypto.randomUUID()`.

## Shared static and editor styles

`plugins/lineMarks/marks.css` contains the global mark colors, focus rules, and sign rules. The root carries `data-line-marks`, `data-line-focus`, and `data-line-diff`. Both CodeMirror and StaticCodeView use `.cm-line` with `data-mark` on marked lines. StaticCodeView receives the selected tab's marks through PreviewFrame, including its explicit tab override. The stylesheet accepts theme overrides through `--codeimage-line-added`, `--codeimage-line-removed`, `--codeimage-line-highlight`, `--codeimage-line-accent`, and the sign color variables.

`inferLanguageFromPath(path)` is exported from `@codeimage/config` and returns a language id or undefined. The UI and P4 can share it.

Only the repository boundary validates raw database marks. API request schemas validate incoming payloads. `project.service.ts` and the generated service worker have no diff against trunk. Migration `20261114093000_add_tab_marks` stays separate from P7's frame migration.

## Performance

The final probe passed the 1.1× limit. The measured ranges overlap, so this is not a claim of a general speedup. The reproducible probe is `scripts/verify-p5-exports.cjs`. It needs Playwright in `P5_TOOLS_ROOT` or Node's module search path, with optional `P5_CHROMIUM`, `P5_HEAD_URL`, `P5_TRUNK_URL`, and `P5_OUT` overrides.

The probe warms each variant, then alternates trunk, unmarked head, and head with 100 marks for ten runs each. It times the real `exportSnippet()` call until the PNG blob resolves. PNG decoding and assertions happen after the timed region. Every run checks the full 300-line DOM during printing, the last line, the mark count, PNG dimensions, and non-empty bytes.

The separate CPU profile identified DOM attribute and style copying as the main JavaScript cost. It was excluded from reported timings. The initial sign gutter added too many cloned nodes, so the final implementation uses a CSS sign column. The machine also ran other project checks; variants were interleaved to share that load. These measurements check the 1.1× gate and do not establish a general speedup.

| Variant         | Runs |  Median |         Range |
| --------------- | ---: | ------: | ------------: |
| Trunk, no marks |   10 | 5.781 s | 4.537–7.976 s |
| Head, no marks  |   10 | 5.236 s | 4.637–7.587 s |
| Head, 100 marks |   10 | 5.326 s | 4.730–7.092 s |

Head with 100 marks divided by the trunk median is **0.921×**, below the 1.1× limit. All 30 measured runs passed the output assertions. Three warm-up runs were excluded. Both pages confirmed the 400-weight, 16 px JetBrains Mono face was loaded before measurement.

Raw runs are in [p5-perf-runs.json](media/p5-perf-runs.json), with the summary in [p5-perf-summary.json](media/p5-perf-summary.json).

## Review rerun

An independent review reran the web lanes at the review head in Chromium 143 against trunk `27b185f1`. Screenshots are in `/tmp/swarm-p5-opus/`. The review video is [p5-review.mp4](media/p5-review.mp4).

| Lane | Result                                                                                                                  |
| ---- | ----------------------------------------------------------------------------------------------------------------------- |
| 1    | Pass. The unmarked default PNG has 0 changed pixels out of 277,524 against trunk.                                       |
| 2    | Pass. A two-file diff imports two tabs with green and red lines. Plain code that starts with a minus gets no offer.     |
| 3    | Pass. A highlight on line 5 moves to line 7 after two lines are typed above it.                                         |
| 4    | Pass. The export source dims 5 code lines and their 5 line numbers.                                                     |
| 5    | Pass. A local reload restores marks. On the mock API, the PUT carries the marks and the GET after reload restores them. |
| 6    | Pass. The toolbar marks lines 3 to 5 as added and turns on the sign column.                                             |
| 7    | Chromium pass. Firefox not run: two installs downloaded the archive, then stalled in extraction with the process idle.  |
| 8    | Pass. Pasted annotations become marks, and the toast Undo restores the comments.                                        |
| 9    | Deferred with the CLI flags.                                                                                            |
| 10   | Pass. Fleet Dark, VSCode Dark, XCode Dark, Night Owl, and Material Light keep all three kinds readable.                 |

The mock API lane served the installed MSW 2.12.14 worker through Playwright routing and started Vite with `VITE_ENABLE_MSW=true`. The repository worker is unchanged.

The perf probe ran 10 interleaved exports per variant with load average near 10 on 8 cores. Head with 100 marks has a median of 4,635 ms against 4,393 ms on trunk, a ratio of 1.055. Head without marks has a median of 4,641 ms, so the marks add no measurable time. A CPU profile of one marked export spends 46% of samples in `setAttribute`, `setProperty`, and `getPropertyValue` inside `@codeimage/dom-export`, which copies computed styles for every cloned node. Raw runs are in [p5-review-perf-runs.json](media/p5-review-perf-runs.json).

## Stack on P1, 2026-11-14

P5 now builds on P1 `17233c9353d5f1f7c27eaeab50470a5a3eb21c0d`. The reference renderer is Opus's reviewed P5 head `3e437b2b89304853f396a408d596bbb597feecbe`. P1's deletion of PreviewExportEditor and its shared Vitest setup are retained.

StaticCodeView accepts the selected tab's `TabMarks`, indexes them by physical line, and emits the same root attributes and per-line `data-mark` as CodeMirror. It imports the existing global `marks.css`. The sign column uses the same gradients and padding. Unfocused gutter numbers use the existing `cm-lineMarkDim` class. The editor controls, mapping, paste handlers, and undo logic have no changes against the reviewed P5 head.

### Export parity

The same seven-line TypeScript project contains removed and added lines, two highlighted lines, focus mode, an empty line, and continuous numbers. Both renderers download PNGs through the real export dialog. Chromium 143 uses `--force-device-scale-factor=1`, without an emulated deviceScaleFactor. Pixelmatch uses P1's shared helper at threshold 0.1.

| Theme          | Changed pixels | Pixel difference |
| -------------- | -------------: | ---------------: |
| Fleet Dark     |   20 / 202,386 |        0.009882% |
| VSCode Dark    |    0 / 202,386 |               0% |
| XCode Dark     |    0 / 202,386 |               0% |
| Night Owl      |    0 / 202,386 |               0% |
| Material Light |    0 / 202,386 |               0% |

No result exceeds 0.1%. The Fleet Dark difference is confined to the bright gutter digit 5. It follows P1's existing line-number baseline correction. Code, mark backgrounds, accent bars, signs, and all other pixels match. The unmarked default export is identical both to old P5 and to trunk `27b185f1`, with 0 changed pixels out of 277,524.

[Before PNGs](media/p5-static/before) · [After PNGs](media/p5-static/after) · [Diff PNGs](media/p5-static/diff) · [Raw parity](media/p5-static/parity.json).

Rerun `node scripts/parity/p5-capture.cjs before <old-P5-url>` and `node scripts/parity/p5-capture.cjs after <head-url>`, then `pnpm exec tsx scripts/parity/p5-diff.ts`. `P5_OUT` selects the output directory. `P5_CHROMIUM` overrides the cached Chromium executable. Use `trunk` as the capture phase to export only the unmarked default. The fixture and assertions are identical on both renderers.

### Live lanes after the rebase

| Lane | Result                                                                                                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | Pass. The default unmarked PNG matches trunk with 0 changed pixels.                                                                                                                  |
| 2    | Pass. A two-file diff imports two syntax-colored tabs with added and removed marks. Plain code starting with a minus gets no import offer.                                           |
| 3    | Pass. Inserting two lines above a highlight on line 5 moves it to line 7.                                                                                                            |
| 4    | Pass. Focus dims unhighlighted code and gutter numbers in the static export. The parity fixture retains two bright highlighted lines.                                                |
| 5    | Pass. Local reload restores marks. A signed-in mock project sends marks in PUT and restores them from GET after reload.                                                              |
| 6    | Pass. The selection toolbar marks lines 3 to 5 as added and enables the sign column.                                                                                                 |
| 7    | Chromium pass. Mod-Alt-1 applies a highlight and Mod-Z removes it. Firefox launch failed with a sandbox permission error and a SWGL framebuffer error. No Firefox result is claimed. |
| 8    | Pass. Shiki annotations become marks and toast Undo restores the comments.                                                                                                           |
| 9    | Deferred with the CLI flags.                                                                                                                                                         |
| 10   | Pass. All three mark kinds remain readable in all five exported themes, including focus mode.                                                                                        |

The live lane scripts and screenshots are in `/tmp/p5-stack/lanes`, with logs in `/tmp/p5-stack-live.log` and `/tmp/p5-stack-remote.log`. [Firefox launch diagnostics](media/p5-static/firefox.txt).

### Workspace checks and setup

- 47 app tests passed under P1's unchanged Vitest configuration, including two new static-mark rendering tests.
- 28 API unit tests passed with the required test environment values.
- `pnpm lint` passed with 32 existing warnings and no errors.
- `pnpm typecheck` passed across the workspace.
- `pnpm install` and `pnpm libs:build` completed. Prisma generation and `@codeimage/prisma-models` build supply fresh-worktree types. `pnpm --filter=@codeimage/api build:ts` supplies API declaration exports for app typecheck.

The extra `pnpm --filter=@codeimage/api build:types` command hits the existing TS5069 error in tsconfig.schema.json because emitDeclarationOnly lacks declaration. It is not required for the successful workspace typecheck and was left outside this change.

The copied `.env.local` enables MSW and mock auth and remains ignored. The repository service worker is unchanged. Temporary Vite middleware serves the installed MSW worker. Both comparison servers use the same temporary scanner alias from react/jsx-runtime to solid-js/jsx-runtime to avoid an MDX dependency-scan error. Initial optimizer hash changes invalidated language imports; fresh browser contexts after optimization completed produced the recorded captures.

The requested branch was already checked out elsewhere, so this work uses `t3/static-export-line-marks` and pushes HEAD to `feat/p5-line-marks`. Port 4426 was initially occupied by another baseline server. Old P5 uses 4427 and head uses 4428. After that baseline server stopped, a source archive of trunk `27b185f1` ran on 4426 with a separate Vite cache. The read-only source checkout was not changed.

### Performance after the rebase

Pass, with no measurable difference between variants. Head with 100 marks is **1.0081 times** the trunk median, within the 1.1 limit. The ranges overlap. This run does not establish a general speedup or slowdown.

| Variant                | Runs |     Median |                 Range |
| ---------------------- | ---: | ---------: | --------------------: |
| Trunk, no marks        |   10 | 4,794.5 ms | 4,326.1 to 5,121.4 ms |
| Static head, no marks  |   10 | 4,790.1 ms | 4,292.2 to 5,055.7 ms |
| Static head, 100 marks |   10 | 4,833.3 ms | 4,163.2 to 5,307.0 ms |

The existing `scripts/verify-p5-exports.cjs` now handles both the old hidden editor and P1's static root. It times the real export call until the PNG blob resolves, with performance marks around that interval. The 300-line file uses 100 marks, alternating added, removed, and highlight. The order reverses each round for ten interleaved runs per variant. Three warm-up exports and one separately profiled export are excluded. Every measured run checks 300 rendered lines, the last line's text, the expected 0 or 100 marks, a tall image, and non-empty PNG bytes. All 30 runs passed. Both pages loaded the same 400-weight, 16 px JetBrains Mono face.

The machine had a load average around 48 to 57 on eight cores during setup and other program work. These are development-server exports with identical rasterizer/library builds on both sides. The separate CPU profile records 2,112 samples. `setAttribute`, `setProperty`, and `getPropertyValue` account for 40.3% of all samples, with stacks in `@codeimage/dom-export`'s clone/style copy. Idle samples account for 30.2%. The mark renderer adds no nodes for its signs. Rasterizer style copying remains the largest sampled cost.

[Raw runs](media/p5-static/perf-runs.json) · [Summary](media/p5-static/perf-summary.json) · [CPU profile](media/p5-static/export.cpuprofile) · [Live screenshots](media/p5-static/lanes) · [App tests](media/p5-static/tests.txt) · [API unit tests](media/p5-static/api-tests.txt) · [Lint](media/p5-static/lint.txt) · [Typecheck](media/p5-static/typecheck.txt).

Rerun the perf script with `P5_HEAD_URL`, `P5_TRUNK_URL`, `P5_CHROMIUM`, and `P5_OUT`. `P5_PROFILE_PATH` enables the separate profile. `P5_WORKER_PATH` optionally routes the installed MSW worker without changing the repository worker.

The implementation follows Model the Domain by indexing `TabMarks` by physical line. Type System Discipline reuses the existing `TabMarks` type. Laziness Protocol keeps the existing CSS and editor logic. Build the Lever and Prove It Works keep the capture, pixel comparison, and real export probe rerunnable. Attack the Premise replaced the assumption of slow startup with a direct check of the optimizer hashes and failed import URLs.

The remaining review limits are Firefox availability and the fresh stack review. No merge was attempted.

## Import undo, 2026-11-14

Import as diff now records the tab list and active tab in the same CodeMirror history step as the code and marks. Cmd+Z and the new import toast's Undo both restore the exact state immediately before clicking Import as diff. That state includes the pasted raw diff. Redo restores the imported tabs with the same IDs. A subsequent text edit undoes before the import.

The snapshot belongs only to an import transaction. Ordinary tab operations keep their existing behavior. The toast follows the annotation toast's guard and only undoes while the imported tab's code and marks are unchanged.

The two history regression tests failed without the import's inverted effect and pass with it. Chromium verification uses an existing tab plus an active Python tab with a highlight, focus mode, and a non-default starting line number. Importing a two-file TypeScript diff renames the active tab and adds a tab. Both undo paths restore every stored tab field and the live editor's code and marks. Redo and later-edit ordering pass too.

Run `node scripts/verify-p5-import-undo.cjs` against port 4433. `P5_URL`, `P5_OUT`, and `P5_CHROMIUM` override the URL, evidence directory, and browser executable. Screenshots, state snapshots, and logs are in `/tmp/swarm-p5-undo/`. The copied local environment enables MSW and mock auth. Temporary Vite middleware serves the installed MSW worker without changing the checked-in worker.

All 49 app tests pass. `pnpm lint` passes with the existing 32 warnings and no errors. `pnpm typecheck` passes across the workspace. P1 remains at `17233c93`, already contained in P5, so no rebase was needed.

## Focus redesign, 2026-11-14

Focus now belongs to individual lines. `TabMarks` stores independent `lines` and `focusedLines` collections. Focus adds the selected lines to the existing set. Dimming stops when that set is empty. Added, removed, and highlighted lines can also be focused.

Shiki focus annotations produce focused lines without adding highlights. PR #704 owns the CLI `--focus` flag and must adopt this shape separately.

The inline overlay appears on a marked line under the caret. Each button names its mark and clears the contiguous run of that mark around the caret. Clearing Focus preserves the line's color mark. The overlay hides during typing and stays outside StaticCodeView exports. Focus uses `Mod-Alt-4` and appears in the shortcuts dialog. All four locales include the updated action and hint.

Verification completed for this change:

- 55 app tests, 30 API unit tests, and 17 API integration tests pass. Integration tests use an isolated PostgreSQL container.
- `pnpm lint` passes with the same 32 existing warnings. `pnpm typecheck` passes.
- The new StaticCodeView focus tests fail twice against the original renderer. The updated schema suite fails four tests against the original schema, including legacy migration. Both suites pass after the implementation.
- Chromium verifies two separate focus ranges, per-kind inline clearing, undo, the Focus shortcut, and typing on an unmarked line.
- The exported PNG keeps lines 2, 3, 6, and 7 at full brightness. Only the other rows change compared with focus disabled. The PNG is identical with and without the clear overlay visible in the editor.
- Chromium verifies the selection toolbar and clear overlay at 390 px. Both remain within the viewport. CodeImage chooses its mobile layout at mount, so the probe reloads after changing the viewport.

### Review, 2026-11-14

An independent review changed four things and reran every check above.

- The app imported `parseTabMarks` from `@codeimage/api/schemas` at runtime. CI builds the app and the render package before the API, so Build App and Build packages failed to resolve it. Marks never reached `main`, so no stored record has the boolean shape. The legacy migration and the runtime import are gone. The app reads `marks ?? {lines: [], focusedLines: []}` as before the redesign, and `vite build` passes with no API dist.
- The overlay sat above the line, so a pointer moving to it crossed the line above. Hover then switched lines and hid the overlay at step 4 of 10. The overlay now follows the caret only, which removes the hover tracker. The probe asserts it stays visible on every step of the pointer path.
- Toolbar buttons and `Mod-Alt-N` toggle their mark. A button reports `aria-pressed` when every selected line has the mark, and pressing it again removes the mark. This answers whether a selection is already focused and gives keyboard users a way to remove one mark.
- The toolbar used the syntax theme's tooltip colors. Material Light rendered `#aabfc9` text on white. It now uses one neutral palette in every theme.

App tests 56/56, API unit 29/29, API integration 17/17 on a fresh PostgreSQL 13 container, `pnpm lint` (32 existing warnings), and `pnpm typecheck` pass. The probe below passes in Chromium. Touch at 390 px, Material Light, local reload, and mock API save and reload were also checked by hand.

Run the browser probe with `P5_URL=http://127.0.0.1:4447 P5_OUT=/tmp/p5-focus node scripts/verify-p5-focus.cjs`. Add `P5_STEP_MS=1100` for the review recording. It opens one Chromium and closes it on completion. It serves the installed MSW worker through a test route because the checked-in worker predates MSW 2.

Local setup used `pnpm install`, `pnpm libs:build`, Prisma client generation, and `pnpm --filter=@codeimage/api build:ts`. The copied app environment enables MSW and mock authentication. Environment files stay uncommitted.

Review artifacts:

- [Desktop clear overlay](media/p5-focus-clear-desktop.png).
- [Mobile clear overlay](media/p5-focus-clear-mobile.png).
- [Focus export](media/p5-focus-redesign.png).
- [Focus disabled export](media/p5-focus-off.png).
- [PNG assertions](media/p5-focus-png-check.json).
- [Review video](media/p5-focus-redesign.webm).
