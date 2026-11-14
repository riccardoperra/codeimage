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

## Feature flags

`--diff` imports unified diffs from stdin or files. Each changed text file
becomes a tab with added and removed marks. Binary-only and malformed input
is a usage error.

```sh
git diff | codeimage --diff -o changes.png
codeimage changes.diff --diff --split-tabs -o changes.png
codeimage foo.ts --focus 3-5 --focus 9 --highlight 4 -o focused.png
```

`--highlight` and `--focus` accept comma-separated line numbers and inclusive
ranges such as `3-5,9`. Repeat either flag to add ranges. Focus keeps those lines
bright and dims the others, independently of highlight, added, or removed
marks. A line can be both focused and highlighted. If no focused line is in
the output, dimming stays off. A bare `--focus` is a usage error.

With `--lines`, both flags refer to the numbered lines in the output. Shiki
annotation comments become marks through the language's comment syntax.
`[!code focus]` focuses one line and `[!code focus:N]` focuses N lines. These
ranges add to `--focus` without adding highlights. The CLI removes annotation
comments before applying `--lines`. A standalone annotation targets the next
code line. Existing focus ranges are clipped and remapped to the selection.

Secret redaction runs by default. Diagnostics go to stderr with the input
name, line, column, and rule id, followed by `redacted 1 secret` or `redacted N secrets`. Images and
alt text use the masked code. `--no-redact` preserves the original code.

`--size` sets an exact output size. Like the web export, a target has no
pixel ratio, so `--scale` with `--size` is a usage error.

| Target              | Pixels      |
| ------------------- | ----------- |
| `x-landscape`       | 1600 × 900  |
| `square`            | 1080 × 1080 |
| `linkedin-portrait` | 1080 × 1350 |
| `og`                | 1200 × 630  |

The window centers inside the target and scales down to fit.
`--signature @handle` adds a frame signature. `--signature-position` accepts
`bottom-left` or `bottom-right`, with `bottom-right` as the default. It needs
`--signature` or a preset that has a signature.

`--split-tabs` writes one image per tab as `out-01.png`, `out-02.png`, and so
on for `-o out.png`. It also supports JPEG, WebP, and SVG. Each image contains
only its input tab. `--alt` writes `out.png.alt.txt` using the web app's
`altText` function for the visible tab. With both flags, each numbered image
gets its own sidecar. Both flags require a file output instead of stdout.

```sh
codeimage foo.ts --size x-landscape --signature @me -o social.png
codeimage a.ts b.py c.rs --split-tabs --alt -o out.png
codeimage foo.ts --lines 5-12 --alt -o range.png
```

## Animation

`--animate` writes one animated image. Each input file is a step, in the order
given. A step holds its tab, then morphs into the next one. Tokens that both
steps keep slide to their new place, removed tokens fade out, and new tokens
fade in.

```sh
codeimage step1.ts step2.ts step3.ts --animate -o demo.webp
codeimage step1.ts step2.ts --animate --hold 1200 --transition 600 -o demo.gif
```

The format comes from `--format`, else from the `-o` extension, else WebP.

| Extension       | Format                  |
| --------------- | ----------------------- |
| `.webp`         | Animated WebP, lossless |
| `.gif`          | GIF                     |
| `.apng`, `.png` | Animated PNG            |

Any other extension is a usage error. MP4 arrives in a later version.

| Flag           | Value                           | Default  |
| -------------- | ------------------------------- | -------- |
| `--hold`       | Milliseconds a step stays still | 800      |
| `--transition` | Milliseconds of each morph      | 900      |
| `--easing`     | `smooth`, `snappy`, or `linear` | `smooth` |
| `--fps`        | 24, 30, 50, or 60               | 30       |

The image is as large as the largest step, and a smaller step sits centered in
it. The first and last frame of a morph are the still images of its two steps.
The other flags apply to every step, so `--theme`, `--preset`, `--lines`,
`--size`, `--signature`, `--diff`, and redaction work as for a still image.
`--split-tabs` and `--alt` do not combine with `--animate`.

A GIF frame lasts whole hundredths of a second, so a GIF plays at 50, 25, or
20 fps. When `--fps` asks for another rate, the command names the rate it used
on stderr. Each GIF frame has its own 256 colors, so a gradient shows bands
and a small detail can change color between frames. WebP and animated PNG keep
every pixel.

A preset can hold an `animation` section in the shape the web app stores,
with `steps`, `transitionMs`, `easing`, and `fps`. The steps give their
`holdMs` to the input files in order. Flags override the preset.

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
`renderSnapshot`, or `renderAnimation` with `--animate`, and owns files,
streams, and exit codes. Feature flags live in `src/flags/`, one file each.

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

The Node-only feature checks run the built CLI and inspect its output files.
Run them inside tmux when verifying a change.

```sh
node packages/cli/scripts/verify-feature-flags.mjs /tmp/swarm-cli-flags
```

## Packed distribution

Run `pnpm --filter=@codeimage/cli pack` after `pnpm libs:build`. The build
bundles the renderer JavaScript and copies its SSR assets and fonts into the
CLI distribution. `scripts/package.mjs` creates the publish manifest from the
CLI metadata and the renderer's runtime dependencies. npm installs Takumi and
its platform-specific native binding. No browser is needed.

`publish/` is generated and excluded from the workspace. `DEFAULT_SCALE` in
`src/args.ts` controls both argument parsing and the help text.
