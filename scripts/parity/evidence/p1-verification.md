# P1 verification

CodeImage exports every line from a static token view. The editable CodeMirror instance stays in the canvas. The export view has no EditorView, transaction subscription or printing override.

## Checks

| Check                          | Result                                                                     |
| ------------------------------ | -------------------------------------------------------------------------- |
| App Vitest                     | 9 tests pass in 3 files, including synchronous SSR without `document`      |
| Workspace lint                 | Pass, with 33 existing app warnings and no errors                          |
| Workspace typecheck            | Pass                                                                       |
| Parity scripts typecheck       | Pass                                                                       |
| Default Dracula export         | 0.0000% diff, 593 × 468                                                    |
| 300-line TypeScript export     | 0.0000% diff, 439 × 7589; line 300 is visible                              |
| Theme/terminal matrix          | 208 cases, 26 themes × 4 terminals × line numbers off/on                   |
| Largest matrix diff            | 0.1603%, below 0.5% at pixelmatch threshold 0.1                            |
| Gutter                         | Starts at 42                                                               |
| Ligatures off                  | Computed `font-variant-ligatures: none`; PNG exported                      |
| SVG opened in Chromium         | 0.0304% diff from PNG                                                      |
| Tabs                           | TypeScript, Python and JSON titles appear; active JSON code is highlighted |
| Windows glass                  | PNG exported with reflection on                                            |
| Native clipboard paste         | 0.0000% diff from downloaded PNG at the same resolution                    |
| 50 edits, then 10 seconds idle | Same export node; no newly recurring intervals left in the CDP trace       |

The [full matrix](p1-matrix.md) and [raw results](p1-matrix.json) list every case. The [live results](p1-live.json), [feature checks](p1-features.json), [idle check](p1-idle.json), and [22 validated timing PNG outputs](p1-perf-images.json) preserve the measurements.

## Export wall time

The timed region starts with the export confirmation click and ends when the PNG Blob used for downloading reaches `URL.createObjectURL`. Both pages run in one Chromium profile at device pixel ratio 1. Each side gets one warm-up, then ten alternating measured runs on the same 300-line TypeScript file. All 22 PNGs decode and have the expected dimensions.

| Version     | Measured runs | Median     | Range                  |
| ----------- | ------------- | ---------- | ---------------------- |
| Trunk       | 10            | 7,746.1 ms | 6,651.8 to 10,251.3 ms |
| Static view | 10            | 7,930.9 ms | 6,528.2 to 10,759.6 ms |

The median ratio is **1.024**, below the plan's **1.1** limit. The ranges overlap. Other builds ran on the machine. These dev-server runs pass the requested regression gate. A separate CPU profile identified DOM attribute and CSS property copying as the main export cost. Unstyled token spans were removed to match CodeMirror's text-node structure.

After fifty edits and a ten-second idle window, trunk's active intervals grow from 24 to 127. Head returns from 3 to 3. The independent CDP trace records zero newly installed recurring intervals left after the idle window.

## Screenshot files

All image files remain under `/tmp/swarm-p1/` on the verification machine.

- `live/p1-default.png` and `live/p1-default-diff.png`.
- `live/p1-long.png`, `live/p1-long-diff.png`, and `p1-long-tail.png`.
- `p1-themes.png`, in row order Fleet Dark, Dracula, XCode Light, Material Ocean, and Shades Of Purple.
- `p1-gutter.png`.
- `p1-svg.png` and `p1-svg-diff.png`.
- `p1-tabs.png`.
- `p1-idle.png` and `p1-idle-trace.json`.
- `p1-ligatures.png`.
- `p1-windows.png`.
- `p1-clipboard.png`, `p1-clipboard-download.png`, and `p1-clipboard-diff.png`.

## Setup and integration

Trunk was `27b185f18d36f2baec3a8cc5a43e8794586096c3`. Head ran on port 4401 and trunk on port 4412. The original checkout was read only. Local Prisma generation and an API declaration build were needed before the workspace typecheck. The tracked MSW worker remains unchanged; the temporary servers served the worker matching installed MSW 2.12.14. Inter's existing dev-font 404 was present on both sides.

`PreviewFrame` accepts an explicit `tab` and preloaded `language`. The header uses that tab's id and its export takes its natural content size, so callers can export another tab without activating it. `StaticCodeView` is synchronous. SSR callers preload with `loadLanguage()` and collect `getStaticTheme(theme).modules.map(module => module.getRules())`.
