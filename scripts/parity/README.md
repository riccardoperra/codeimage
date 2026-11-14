# Export parity

Install workspace dependencies and build the libraries with `pnpm install` and `pnpm libs:build`. Copy the app's development environment into `apps/codeimage/.env.local`. Chromium must be installed for Playwright 1.57.0.

Run the complete comparison from the repository root:

```sh
pnpm exec tsx scripts/parity/export-matrix.ts --base main --head HEAD
```

The script archives each Git ref into a temporary directory. Both copies use the current checkout's installed dependencies and built libraries. It starts trunk on port 4412 and head on port 4401. The archived fixtures use the worker supplied by the installed MSW package, since the repository's checked-in worker predates the installed client.

To compare already-running development servers, pass `--base-url http://127.0.0.1:4412 --head-url http://127.0.0.1:4401`. This also tests uncommitted app changes. The servers must use matching MSW workers if mocks are enabled.

Each case selects a theme, terminal and line-number setting through the UI and downloads a PNG. Pixelmatch uses threshold 0.1. Any dimension mismatch or pixel difference above 0.5% fails. Results, exported PNGs and diff images go to `/tmp/swarm-p1/matrix`; override it with `--out`. Use `--theme Dracula` for one theme.

`scripts/parity/lib.ts` supplies browser actions and PNG comparison for other renderer checks. `live-p1.ts` compares default and 300-line exports, measures ten interleaved warm exports per side after one warm-up, and counts intervals around fifty edits. Its end mark records creation of the PNG Blob used for downloading. `live-features.ts` checks custom gutters, ligatures, SVG, Windows glass, native clipboard paste and three language tabs. These scripts use the running servers on ports 4412 and 4401.

The synchronous renderer accepts a preloaded language from `loadLanguage(languageId)`. Pass it as `StaticCodeView.language`, or as `PreviewFrame.language` together with `PreviewFrame.tab`. `getStaticTheme(theme)` exposes scope classes and StyleModules; SSR consumers can collect each module's `getRules()`. Client rendering mounts those modules once per theme. Font changes use CSS variables.
