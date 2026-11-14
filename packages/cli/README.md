# CodeImage CLI

Render source files or stdin with the same themes and presets as the web app.
Requires Node.js 24 or later and `@codeimage/render`.

```sh
codeimage src/example.ts -o example.png
cat example.py | codeimage --lang python -o - > example.png
codeimage a.ts b.py c.rs --theme dracula -o tabs.svg
codeimage src/example.ts --lines 10-30 --scale 2 -o lines.png
codeimage src/example.ts --preset preset.json -o preset.png
```

Each input file becomes a tab. With no files, the command reads stdin. Use `-`
among the files to add stdin as a tab. The language comes from each file name
through `inferLanguageFromPath` in `@codeimage/config`, falling back to plain
text. `--lang` sets it for every tab.

`--lines 10-30` keeps lines 10 to 30 of each file and numbers the gutter from 10.
An end past the last line is clipped. A start past the last line is an error.

In the web app, open a saved preset's menu and choose **Copy as CLI config**.
Save the JSON to a file and pass it to `--preset`. It holds the preset's
`frame`, `terminal`, and `editor` sections. Flags override the preset, and
`--theme` also replaces the preset's background and terminal colors.

The format comes from `--format`, else from the `-o` extension, else PNG.
`--scale` is the pixel ratio, above 0 and at most 3, default 1. The snapshot is
960 CSS pixels wide.

`-o -` writes only image data to stdout. A file output prints its path once
written. Errors go to stderr. Exit codes are 0 for success, 1 for render or
write failures, and 2 for invalid options, presets, or inputs. Running with no
files from a terminal prints usage and exits with 2.

## Development

```sh
pnpm install
pnpm libs:build
pnpm --filter=@codeimage/cli test
pnpm --filter=@codeimage/cli build
node packages/cli/dist/bin.js README.md -o /tmp/readme.png
```

`src/args.ts` parses options. `src/snapshot.ts` builds the snapshot and reads
presets. `src/document.ts` mirrors the snapshot schema from `@codeimage/render`
until that package is in the workspace. `src/render.ts` is the one call into the
renderer. `src/bin.ts` owns files, streams, and exit codes. Feature flags live in
`src/flags/`, one file each.
