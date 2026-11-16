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

`-o -` writes only image data to stdout. Without `-o`, redirected stdout receives
the image; a terminal writes `codeimage.<format>`. Help, lists, paths, progress and
errors go to stderr. `--quiet`, CI and non-TTY output use plain text. Exit codes are 0 for success, 1 for render or
write failures, and 2 for invalid options, presets, or inputs. Running with no
files from a terminal prints usage and exits with 2.

## Fonts and offline rendering

Inter and JetBrains Mono are bundled. Other code fonts and emoji/CJK fallbacks
download on first use. Each URL pins a version or Git commit and a SHA-256.
Every cached read verifies the size and hash. A corrupt entry downloads again;
a mismatched download fails without installing the bytes.

```sh
codeimage foo.ts --font fira-code -o out.png
codeimage fonts install fira-code noto-sans-kr twemoji
codeimage fonts install --all
codeimage fonts list --json
codeimage foo.ts --font fira-code --offline -o out.png
codeimage foo.ts --font-file ./MyMono.ttf --offline -o out.png
codeimage fonts clean -y
```

The cache defaults to `~/Library/Caches/codeimage` on macOS,
`$XDG_CACHE_HOME/codeimage` or `~/.cache/codeimage` on Linux, and
`%LOCALAPPDATA%\codeimage` on Windows. `CODEIMAGE_CACHE_DIR` overrides the root.
Verified objects live in `fonts/sha256/<hash>`. Two CLI versions can share them.
A read-only cache uses verified downloaded bytes for that operation and reports
how to choose a writable directory.

`fonts list` reports bundled, cached, partial or missing families, file counts,
and available/total bytes. `install` fetches every subset of a named family;
`--all` also installs fallbacks. `install --offline` verifies existing files.
Without names, an interactive terminal offers a selection; scripts require
names or `--all`. `clean` confirms in an interactive terminal unless `-y` is set.
It removes only the managed font subtree. Active renders can refill it.

A default Latin render works offline with an empty cache. `--offline` disables
all network access, including background and avatar requests. Avatars use
initials; a remote background fails. A missing font prints its install command.
`--font-file` accepts one TTF, OTF, WOFF or WOFF2 file. It overrides preset font
selection, cannot be combined with `--font`, and never enters the cache.
Collections are unsupported. Local font output depends on that file.

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
Without `-o` the file is `codeimage.webp`, or stdout when it is redirected, as
for a still image. Progress and notes go to stderr.

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
20 fps. When `--fps` or the preset asks for another rate, the command names the
rate it used on stderr. Each GIF frame has its own 256 colors, so a gradient
shows bands and a small detail can change color between frames. WebP and
animated PNG keep every pixel.

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
presets using the schema exported by `@codeimage/render`. `src/bin.ts` renders
through `createRenderer`, with `renderAnimation` for `--animate`, and owns
files, streams, and exit codes. `src/ui.ts` writes everything else to stderr. Feature flags live in `src/flags/`, one file each.

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

## MP4 animations and ffmpeg

```sh
codeimage a.ts b.ts --animate -o demo.mp4
codeimage a.ts b.ts --animate --format mp4 -o - > demo.mp4
codeimage a.ts b.ts --animate -o demo.mp4 --ffmpeg /opt/bin/ffmpeg
codeimage install-ffmpeg
```

MP4 uses H.264 High profile, a keyframe every two seconds, BT.709 limited
range, and YUV 4:2:0. Odd dimensions grow by one pixel with the edge repeated.
The file supports progressive playback (`faststart`). Redirected stdout holds
only the MP4 bytes; diagnostics and download progress go to stderr. Encoding
uses a temporary file before publishing the output, including when stdout is
redirected. Ctrl+C removes temporary downloads and video output and stops the
encoder.

The CLI tries these ffmpeg locations in order, skipping missing executables:

1. `--ffmpeg <path>`
2. `CODEIMAGE_FFMPEG`
3. `ffmpeg` on `PATH`
4. The CodeImage cache; if empty, download the pinned release on first MP4 use.

`codeimage install-ffmpeg` installs into that cache even if ffmpeg is already
on PATH. It prints the executable path on stdout. Run it once in CI and cache
`codeimage/ffmpeg/b6.1.1/<platform>-<arch>/` beneath the OS cache directory:
`~/Library/Caches` on macOS, `$XDG_CACHE_HOME` or `~/.cache` on Linux, and
`%LOCALAPPDATA%` on Windows. MP4 downloads do not happen at npm installation
or for PNG, WebP, GIF, or APNG exports. `--offline` controls fonts and remote
backgrounds; preinstall ffmpeg or provide an executable to export MP4 without
network access.

The download uses [ffmpeg-static release b6.1.1](https://github.com/eugeneware/ffmpeg-static/releases/tag/b6.1.1).
Each compressed platform asset has a pinned SHA-256 in `src/video/checksums.ts`.
The release's platform-specific `LICENSE` and `README` are stored beside the
binary, which is published only after verification and both notices arrive.
Download failures exit with code 2 and list all four ways to supply ffmpeg.

The downloaded ffmpeg builds include GPL components. They are separate
executables and are not bundled in the CLI npm package. Operators should
review the cached release notices and confirm the GPL-3.0 handling described
in the animation plan before merging A6 or redistributing these binaries.

Reproduce the CLI live lanes from a tmux pane after building:

```sh
node packages/cli/scripts/verify-mp4.mjs /tmp/a6-live /absolute/base/dist/bin.js
node packages/cli/scripts/benchmark-mp4.mjs /tmp/a6-perf /absolute/base/dist/bin.js
```

The base build must retain its sibling `dist` assets and runtime dependencies.
The live helper exercises lanes 1–9, including a real upstream download and an
unreachable proxy for the offline case. It temporarily moves an existing
ffmpeg cache aside and restores it when finished; run it without other MP4
exports using that cache. Set `A6_FFMPEG` / `A6_FFPROBE` to change the native
executables used for inspection. Lane 10 needs the web animation editor and a
manual comparison of the same saved project. The perf helper waits for load
below 8 before every timed cold process, records ten interleaved WebP pairs,
then ten cached MP4 exports, and checks output dimensions and frame counts.
