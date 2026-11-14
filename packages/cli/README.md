# CodeImage CLI

Render source files or stdin with the same themes and presets as the web app.
Requires Node.js 24 or later and `@codeimage/render` from P3.

```sh
codeimage src/example.ts -o example.png
cat example.py | codeimage --lang python -o - > example.png
codeimage a.ts b.py c.rs --theme dracula --format svg -o tabs.svg
codeimage src/example.ts --lines 10-30 --scale 2 -o lines.png
codeimage src/example.ts --preset preset.json -o preset.png
```

Each input file becomes a tab. The first tab is active. With no files, the command
reads stdin. Use `-` among filenames to include stdin as a tab. Unknown extensions
use plain text. `--lang` overrides the language for every tab.

`--lines` selects an inclusive range in each file and shows the gutter starting at
the first selected line. The end is clipped to the file's last line. A start past
the last line is an error.

In the web app, open a saved preset's menu and choose **Copy as CLI config**. Save
the copied JSON to a file and pass its path to `--preset`. The JSON contains
`appVersion`, `frame`, `terminal`, and `editor`, just like the saved preset's data.
Explicit flags override preset values. `--theme` also applies the theme's frame
and terminal colors. Presets using the web app's initial `fleetTheme` id resolve
to Fleet Dark.

The default output is `codeimage.png`. `--format` accepts `png`, `jpeg`, `webp`, or
`svg` and changes the default filename extension. The output path does not infer
the format. `--scale` accepts a positive finite number and defaults to 1. The
snapshot width is 960 CSS pixels.

`-o -` writes only image data to stdout. File output prints the path after the
write succeeds. Errors go to stderr. Exit codes are 0 for success, 1 for rendering
or output failures, and 2 for invalid options, presets, or inputs. No input prints
usage and exits with 2. `--help` prints usage and exits with 0.

## Development

```sh
pnpm install
pnpm libs:build
pnpm --filter=@codeimage/cli test
node packages/cli/dist/bin.js README.md -o /tmp/readme.png
```

`src/args.ts` parses options. `src/snapshot.ts` constructs the serializable
snapshot. `src/bin.ts` owns files, streams, and exit codes. `src/render.ts` is the
single integration point with P3. Add future feature flag modules in `src/flags/`.
