# Export parity

Install workspace dependencies and build the libraries with `pnpm install` and `pnpm libs:build`. Copy the app's development environment into `apps/codeimage/.env.local`. Chromium must be installed for Playwright 1.57.0.

Run the complete comparison from the repository root:

```sh
pnpm exec tsx scripts/parity/export-matrix.ts --base main --head HEAD
```

The script archives each Git ref into a temporary directory. Both copies use the current checkout's installed dependencies and built libraries. It starts trunk on port 4412 and head on port 4401. The archived fixtures use the worker supplied by the installed MSW package, since the repository's checked-in worker predates the installed client.

To compare already-running development servers, pass `--base-url http://127.0.0.1:4412 --head-url http://127.0.0.1:4401`. This also tests uncommitted app changes. The servers must use matching MSW workers if mocks are enabled.

Each case selects a theme, terminal and line-number setting through the UI and downloads a PNG of an 11-line snippet numbered from 42. Pixelmatch uses threshold 0.1. Any dimension mismatch or pixel difference above 0.5% fails. Results, exported PNGs and diff images go to `/tmp/swarm-p1/matrix`; override it with `--out`. Use `--theme Dracula` for one theme.

`export-cases.ts` compares base and head on cases the matrix does not cover: a numbered 300-line file, gutters starting at 998 and at 9, ligatures off, three tabs in different languages, `App.vue` and `app.component.html` tabs whose names change the parser, the Windows terminal with glass, SVG, and the clipboard image. Pass `--case <name>` to run one, and `--base-url` and `--head-url` to point at the servers.

`scripts/parity/lib.ts` supplies browser actions and PNG comparison for other renderer checks. `live-p1.ts` compares default and 300-line exports, measures ten interleaved warm exports per side after one warm-up, and counts intervals around fifty edits. Its end mark records creation of the PNG Blob used for downloading. These scripts use the running servers on ports 4412 and 4401 by default.

A cell can stay under 0.5% and still be wrong. Open the diff image of every nonzero cell. Before they were fixed, line numbers drifting 1.4 px per line scored 0.16% to 0.38%, and `.vue` and Angular tabs highlighted with the wrong parser scored 0.27% and 0.38%.

The synchronous renderer accepts a preloaded language from `loadLanguage(languageId, tabName)`. Pass it as `StaticCodeView.language`, or as `PreviewFrame.language` together with `PreviewFrame.tab`. `getStaticTheme(theme)` exposes scope classes and StyleModules; SSR consumers can collect each module's `getRules()`. Client rendering mounts those modules once per theme. Font changes use CSS variables.

## Takumi across operating systems

The `Takumi snapshots` jobs render the shared `takumi-cells.ts` matrix on Linux, macOS, and Windows. Each runner downloads the same Linux-built `libs-dist` artifact and loads its local native Takumi binary from `node_modules`. These jobs need no browser or app environment file.

After installing dependencies and building the libraries, render one set from the repository root:

```sh
node_modules/.bin/tsx scripts/parity/takumi-cross-os.ts --out dist/takumi-cross-os/macOS
```

The output contains numbered PNGs, a manifest with cell names, SHA-256 hashes and dimensions, and `runtime.json` with the OS, architecture, Node version and loaded native binding paths. Put the three outputs in `dist/takumi-cross-os/{Linux,macOS,Windows}`, then compare:

```sh
node_modules/.bin/tsx scripts/parity/compare-takumi-cross-os.ts
```

The comparator reports byte-identical counts and the maximum percentage of differing pixels against Linux. PASS means byte-identical PNGs. WARN allows at most 0.01% differing pixels with a maximum RGBA channel delta of 2/255. Any larger difference or dimension change fails. The comparison artifact contains `table.md`, `results.json`, and diff PNGs for changed cells. Chrome parity keeps its separate tolerances and Linux job. Both scripts render the full shared matrix, including P10 signatures, local avatar and background fixtures, and marks cells.
