# P1 verification

CodeImage exports every line from a static token view. The editable CodeMirror instance stays in the canvas. The export view has no EditorView, transaction subscription or printing override.

Trunk is `27b185f18d36f2baec3a8cc5a43e8794586096c3`. The review reran parity, idle and perf checks against trunk at the head that adds this file. Trunk ran on port 4422 and head on port 4421, both with the mock API.

## Fixed in review

The first head passed its own checks. Four of the defects below still scored under the 0.5% limit, so each one was confirmed by looking at the diff image and measuring the DOM.

| Defect at `aca5a099` | Cause | Before | After |
| --- | --- | --- | --- |
| Line numbers drift 1.4 px per line below the code | CodeMirror's `.cm-gutter {display: flex !important}` overrode the static subgrid, so gutter rows stayed 21 px while code rows were 22.4 px | 0.38% on 300 lines, 0.16% on the default snippet | 0% |
| The gutter is one digit narrower with a custom first line | CodeMirror sizes the gutter for `maxLineNumber(lines) + start - 1`, 140 for 11 lines from 42 | 2.06% from 42, 2.03% from 9 | 0% |
| `App.vue` and `app.component.html` tabs highlight as TypeScript and plain HTML | The tab-name language override in `@codeimage/config` was ignored | 0.27% and 0.38% | 0% |
| Duotone Dark, Duotone Sea and Coldark Dark gutters use the dark base colour | The scope came from `darkMode`, but CodeMirror reads the `EditorView.darkTheme` facet, which `defineEditorTheme` never sets | 0.06% | 0% |
| Line-number glyphs sit 0.69 px below the code glyphs | A fixed 21 px gutter line height inside 22.4 px rows | 0.69 px, also in the canvas editor | 0 px in the canvas editor and the export |
| Server-rendered tab corners take the text colour | `TerminalHost` wrote empty tab colour variables, which Solid SSR emits as `--x:;` and which override the `var()` fallback | `--x:;` in SSR output, removed by Solid on the client | Unset variables are omitted |

Unit tests cover the tab-name parser and the gutter width. Both new tests fail on `aca5a099` and pass here.

The tab-name change kept one trunk behaviour. Choosing the selected language again in the language menu clears `languageId`. The canvas editor then keeps its last parser, and so does the export view.

## Checks

| Check | Result |
| --- | --- |
| App Vitest | 10 tests pass in 3 files |
| Workspace lint | Pass, with the 33 existing app warnings and no errors |
| Workspace typecheck | Pass after `prisma generate`, the `prisma-models` build and the API `build:ts` |
| Parity scripts typecheck | Pass |
| Skeleton while typing, switching tabs, loading Python and Rust, switching themes | 0 skeleton insertions on both sides. An injected skeleton was counted, and tab switching changed the rendered code |
| Theme chunks delayed by 4 s | No page errors and all lines rendered on both sides |
| Intervals after 50 typed characters and 10 s idle | Trunk 16 to 119 live intervals, about 29,000 callbacks per second while idle. Head 2 to 2, none while idle |

## Parity against trunk

`export-matrix.ts` covers 26 themes, 4 terminals, and line numbers off or on from 42 on an 11-line snippet with tabs, ligatures, a regular expression, CJK and emoji. All 208 cells have the same size on both sides. 204 are 0%. The four numbered Fleet Dark cells are 0.0169%, and every differing pixel lies in the gutter column, x 103 to 118. That is the intended line-number baseline change. The [table](p1-matrix.md) and [raw results](p1-matrix.json) list every cell. A contact sheet of sampled cells confirmed that both sides drew distinct, nonblank frames.

`export-cases.ts` covers what the matrix does not. Results are in [p1-cases.json](p1-cases.json).

| Case | Diff % | Note |
| --- | --- | --- |
| Default | 0 | |
| 300 lines, numbered | 0.0562 | Gutter column only, line 300 present, 870 × 8260 on both sides |
| Gutter from 998 | 0.0303 | Gutter column only, four-digit gutter on both sides |
| XCode Light, gutter from 9 | 0 | |
| Ligatures off | 0 | `!==` drawn as three glyphs on both sides |
| Three tabs, TypeScript, Python and JSON | 0 | Python tab active |
| `App.vue` tab in TypeScript | 0 | HTML parser |
| `app.component.html` tab in HTML | 0 | Angular parser |
| Windows terminal with glass | 0 | |
| SVG, rasterised by Chrome | 0.0102 | Gutter column only |
| Clipboard image | 0.0088 | Gutter column only |

The first head reported a matrix maximum of 0.1603%. That number came from the line-number drift and was not explained at the time.

Lines never wrap in an export. Dragging the frame handle 900 px left kept the frame at its content width.

## Export wall time

The timed region runs from the Confirm click to the PNG Blob passed to `URL.createObjectURL`, for a 300-line TypeScript file at pixel ratio 1. Each side got one warm-up and seven runs, alternating which side went first. The load average was 15 to 21 on 8 cores, from other sessions on the machine. The raw numbers are in [p1-perf.json](p1-perf.json).

| Version | Median | Range |
| --- | --- | --- |
| Trunk | 6,348 ms | 6,106 to 7,560 ms |
| Head | 6,206 ms | 5,997 to 7,528 ms |

The ratio is 0.98, inside the run-to-run spread, so head shows no measurable difference. The plan's limit is 1.1.

The cost is real work, not waiting on other processes. Chrome used 9.3 to 10.9 s of CPU for 6.3 to 7.4 s of wall time on 300 lines. Time grows linearly with lines, about 0.4 s for 10, 2 s for 100 and 6.3 s for 300, on both sides. Both sides clone about the same DOM. Head keeps all 2,452 elements mounted. Trunk mounts 326 elements for the 32 lines in the viewport and expands to every line through the printing override during export.

A CPU profile puts the limit in `@codeimage/dom-export`'s per-element style copy on the main thread. Self time was `setAttribute` 21%, `setProperty` 17%, `getPropertyValue` 11% and native work 17%. For each element, `cloneCSSStyle` reads `-webkit-background-clip`, `align-items` and `perspective` from the clone's inline style. Unset properties read as `''`, which never equals the default, so the whole style string is rewritten and reparsed three times per element. Fixing that check could save at most about the 21% spent in `setAttribute`. That fix belongs with the rasterizer work in P2.

The first head's run measured a median of 7,746 ms on trunk and 7,931 ms on head over ten runs each, with a different 300-line file. Its PNG validation is in [p1-perf-images.json](p1-perf-images.json), and its timer data in [p1-live.json](p1-live.json) and [p1-idle.json](p1-idle.json).

## Integration

`PreviewFrame` accepts an explicit `tab` and preloaded `language`. The header uses that tab's id, and its export takes its natural content size, so callers can export another tab without activating it. `StaticCodeView` is synchronous. SSR callers preload with `loadLanguage(languageId, tabName)` and collect `getStaticTheme(theme).modules.map(module => module.getRules())`. Those modules do not include CodeMirror's own base theme, which only an `EditorView` mounts. The static layout no longer depends on it, but a theme that sets no gutter colour still takes it from that base theme in the browser, `#6c6c6c` in the light scope. P3 has to supply that colour to match.

The tracked MSW worker is unchanged. The Inter dev-font 404 is present on both sides.
