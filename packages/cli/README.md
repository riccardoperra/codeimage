# CodeImage CLI

Render source files or stdin with the same themes and presets as the web app.
Requires Node.js 24 or later. The package includes `@codeimage/render`.

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
`--scale` is the pixel ratio, above 0 and at most 3, default 1. The image width
follows the content.

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
presets using the schema exported by `@codeimage/render`. `src/bin.ts` calls
`renderSnapshot` and owns files, streams, and exit codes. Feature flags live in
`src/flags/`, one file each.

With the mock web app running on port 4434, check CLI parity with:

```sh
pnpm exec tsx packages/cli/scripts/web-parity.ts
```

The script copies saved presets through the web menu and compares the CLI
output with Chrome screenshots of the export node at native scales 1 and 2.
It uses `launchChrome(scale)` with `viewport: null` and checks the actual DPR.
Scale 1 exercises the CLI default without a `--scale` flag. Images and results
go to `/tmp/swarm-p4-restack`. Use `--url` and `--out` to change the defaults.
The script stops at the first cell above 0.5% at pixelmatch threshold 0.1.
Inspect that cell's diff before continuing.

## Packed distribution

Run `pnpm --filter=@codeimage/cli pack` after `pnpm libs:build`. The build
bundles the renderer JavaScript and copies its SSR assets and fonts into the
CLI distribution. `scripts/package.mjs` creates the publish manifest from the
CLI metadata and the renderer's runtime dependencies. npm installs Takumi and
its platform-specific native binding. No browser is needed.

`publish/` is generated and excluded from the workspace. `DEFAULT_SCALE` in
`src/args.ts` controls both argument parsing and the help text.
