# CLI feature flag evidence

The CLI uses P5's diff and annotation parsers, P6's detector and redactor,
P7's target definitions and signature view, and P9's alt-text function.
P8's CLI behavior needs no P8 web code.

## Reproduce

All commands run with Node. No development server or browser is needed.

```sh
pnpm install
pnpm --filter=@codeimage/api exec prisma generate
pnpm --filter=@codeimage/prisma-models build
pnpm --filter=@codeimage/api build:ts
pnpm libs:build
pnpm --filter=@codeimage/cli test
pnpm --filter=@codeimage/render test
pnpm --filter=@codeimage/app test src/core/diff/parseAnnotations.test.ts src/core/diff/parseUnifiedDiff.test.ts src/core/altText.test.ts
pnpm lint
pnpm typecheck
```

Run the live verifier in a tmux pane after the build.

```sh
node packages/cli/scripts/verify-feature-flags.mjs /tmp/swarm-cli-flags
```

The script invokes the built CLI, creates its own synthetic inputs, asserts
output contents, and writes `feature-flags-results.json`. It saves stdout
and stderr for every run. The original run also has `tmux-pane.txt` and the
build and check logs in `/tmp/swarm-cli-flags/`.

## Results

These results are from the independent review run, after the rebase onto
P4 head `37665921`.

- CLI tests pass, 70 tests across six files, including one test file per flag.
- Renderer tests pass, 42 tests.
- Shared diff, annotation, and alt-text tests pass, 31 tests.
- `pnpm libs:build`, `pnpm lint`, and `pnpm typecheck` pass. Lint retains the app's existing warnings.
- A packed tarball installs in an isolated directory and renders a redacted 1200 by 630 image with a signature, a focused highlight, and an alt sidecar.
- Twenty-three CLI invocations pass in tmux, and their output files satisfy the assertions below. Two of them assert usage errors with exit code 2.

| Plan lane         | CLI evidence                                                                                                                                                                                                                                                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P5 lane 9         | A two-file diff through stdin and a `.diff` file becomes tabs with inferred languages and added/removed marks. Highlight and focus change rendered pixels. `--focus` with no highlighted line exits with 2. Annotation comments disappear from the alt sidecar.                                                                                                   |
| P6 lanes 7 and 8  | Three synthetic secrets produce three location/rule diagnostics and one summary. PNG and SVG render successfully. The redacted SVG is byte-identical to an unredacted render of the masked code from the alt sidecar, and that sidecar contains no token. `--no-redact` emits no diagnostics, preserves the original alt text, and produces different PNG pixels. |
| P7 lane 7         | All four target PNGs have their exact dimensions. `--scale` with `--size` exits with 2, and the renderer still exports a target at its exact size when a snapshot asks for scale 2. Signatures render in both corners. A 60-line snippet fits inside the target. Open Graph also renders as JPEG.                                                                 |
| P8 lane 7         | Three input files produce `out-01.png` through `out-03.png`. Each sidecar contains its own tab's code. Every PNG remains 1600 by 900 when combined with `--size`. Split SVG also produces numbered files.                                                                                                                                                         |
| P9 lanes 6 and 10 | The image gets a `.png.alt.txt` sidecar. Its header names the language, tab, and line range. `--lines 5-12` reports lines 5 to 12. Long Unicode input ends with the shared truncation note within 1,000 graphemes.                                                                                                                                                |

The CLI tests also inspect the static markup for marks, focus, and
signature positions. The CLI tests compare sidecars with the shared
`altText` function. The verifier's synthetic credentials are test fixtures.

## Independent review

The rebase replays the four dependency merges onto the new P4 head. Each
conflict takes the original merge's resolution, because the restack touched
none of those files. The replayed alt-text merge differs from the original
one by exactly the P4 restack diff, with the same `git patch-id`. The renderer
commit's conflict with P4's device-pixel sizing resolves so that a named
target measures and renders at pixel ratio 1.

Review changes, each verified against the rebased head:

- The Node target layout copied FittedWindow's 480 px minimum width and
  FrameSignature's 66 px signature space. It now lives in the render entry
  and imports both. A named target's scale of 1 is set once where the
  snapshot is parsed. All 34 verifier artifacts are byte-identical before
  and after this change.
- `bin.ts` and the flag tests now share one pipeline, so the tests exercise
  the shipped flag order.
- `--size` with `--scale`, `--signature-position` without a signature, and
  `--focus` with no highlighted line were silently ignored or dimmed every
  line. Each is now a usage error naming the flag. The help aligns with the
  P4 options, and one match prints `redacted 1 secret`.
- The verifier's SVG token search could never fail, because Takumi draws
  glyphs as paths. It is replaced by the masked-render equality above.

Redaction was also probed by hand on stdin, two files, `--split-tabs` with
`--alt`, `--diff` input, an annotated line, and PNG to stdout. Every run
printed a location and rule per match, and no output or sidecar held a token.

One P4 behavior is out of scope here. `buildSnapshot` keeps a file's final
newline as an empty last line, so a two-line file renders three lines and its
alt text says `lines 1 to 3`.

## Reviewed images

The added and removed lines have visible signs and colored backgrounds.
Focus dims the other lines and preserves the highlighted lines.

![Imported diff](media/cli-feature-flags/p5-diff-01.png)

![Annotation marks and focus](media/cli-feature-flags/p5-annotations.png)

![Three masked secrets](media/cli-feature-flags/p6-redacted.png)

The named target centers the window, preserves the web target's minimum
window width, and keeps the signature in the selected corner.

![X landscape and signature](media/cli-feature-flags/p7-x-landscape.png)

![Sixty-line input fitted to X landscape](media/cli-feature-flags/p7-overflow.png)

## Limits

The task requires Node-only verification. Web comparison lanes, browser
recordings, and feature performance benchmarks were not run for this CLI
integration. The upstream feature PRs own their web verification. An
independent Opus review ran after the implementation, recorded above.

The root `libs:build` skips Prisma models until the client is generated.
The API's `build:types` script currently lacks `declaration` in its tsconfig.
The commands above use `build:ts` to produce the API schema declarations
needed by the app typecheck. No source workaround is needed.
