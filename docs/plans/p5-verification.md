# P5 web verification

CodeImage users can mark added, removed, and highlighted lines, keep those marks through edits, and export them today. CLI flags and StaticCodeView rendering remain deferred until P4 and P1 merge.

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

## Reuse after P1

`plugins/lineMarks/marks.css` contains the global mark colors, focus rules, and sign rules. The root carries `data-line-marks`, `data-line-focus`, and `data-line-diff`. CodeMirror lines use `.cm-line`; a static renderer can use `data-line` with `data-mark` on the marked lines. The stylesheet accepts theme overrides through `--codeimage-line-added`, `--codeimage-line-removed`, `--codeimage-line-highlight`, `--codeimage-line-accent`, and the sign color variables.

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
