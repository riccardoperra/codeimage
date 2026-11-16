# P4 renderer integration evidence

CodeImage's CLI renders files and stdin through the browser-free P3 renderer.
P4 is restacked on `0ea61effea91467b4baf1f9954f14a7dcb329207`.
All ten CLI lanes pass, including the four web parity cells below.
The operator's visual review and independent review remain outstanding.
Do not merge on this implementation report alone.

Verification ran on macOS arm64 with Node 26.5.0, pnpm 10.32.1, and
Hyperfine 2.0.0 on 2026-11-14. Trunk has no CLI.
Raw commands, logs, tmux captures, images, and profiles are in
`/tmp/swarm-p4-restack/` on the implementation machine.

## Implementation

- P4 already lets P3 choose content width. No hard-coded width remains.
- `DEFAULT_SCALE = 1` still supplies argument parsing and help text.
- No production CLI or web rendering code changed in this restack.
- `packages/cli/scripts/web-parity.ts` makes lanes 1 and 5 reproducible.
  It copies real saved presets through the web menu and invokes the built CLI.
- The CLI tarball includes P3's updated SSR bundle and fallback fonts.

Laziness Protocol kept the production change at zero. Prove It Works led to
asserting the actual Chrome DPR and testing the packed command outside the repo.
No nested agent or independent review ran in this implementation task.

## Web parity

Run the app with the mock API and mock auth enabled on port 4434, then run:

```sh
pnpm exec tsx packages/cli/scripts/web-parity.ts
```

The reference is a Chrome element screenshot of the live web app's export
node, not a dom-export download and not P3's SSR markup rendered in Chrome.
The script imports `launchChrome(scale)` from `scripts/parity/lib.ts`, opens
pages with `viewport: null`, and asserts `devicePixelRatio === scale`.
It never calls `setViewportSize` or emulates `deviceScaleFactor`.

Capture makes the hidden export portal visible, hides its debug label and
nodes marked `data-export-exclude`, and hides the surrounding app while taking
the screenshot. It does not change the export node's geometry, typography, or
colors. Scale 1 omits `--scale` to test the CLI default. Scale 2 passes it explicitly.

Both lanes render `const answer: number = 42;` followed by
`console.log(answer);` in `index.tsx`. Lane 1 uses Dracula. Lane 5 switches to
GitHub Dark, saves a second preset, copies it with **Copy as CLI config**, and
passes that JSON to `--preset`.

Pixelmatch threshold is 0.1. Each cell must be at most 0.5% and have identical
pixel dimensions. The script stops at the first failing cell.

| Lane | Preset             | CLI scale | Chrome DPR | Size    | Difference | Result |
| ---- | ------------------ | --------- | ---------- | ------- | ---------- | ------ |
| 1    | Dracula            | 1         | 1          | 420×267 | 0.191725%  | Pass   |
| 5    | GitHub Dark preset | 1         | 1          | 420×267 | 0.226503%  | Pass   |
| 1    | Dracula            | 2         | 2          | 840×534 | 0.086499%  | Pass   |
| 5    | GitHub Dark preset | 2         | 2          | 840×534 | 0.092518%  | Pass   |

[Machine-readable results](media/p4-parity/results.json) and the paired Chrome,
CLI, diff, and copied-preset files are committed in [p4-parity](media/p4-parity/).
The largest difference is 0.226503%. Inspection shows differences concentrated
in the tab title and watermark lettering, with a few terminal-corner pixels.
There were no failed pixel cells.

The old 0.943% and 0.642% results used dom-export downloads and emulated DPR.
They are superseded by this reference. The old reference changes font size,
so those values do not describe parity against the live export node.

An initial UI attempt timed out locating the preset dialog by ARIA role even
though its textbox was visible. The script now locates the actual dialog panel
and input. This happened before capture and was not a failed pixel cell.

## Other live lanes

CLI commands ran in the `p4-restack` tmux session. Each lane has an exit-code
receipt and a terminal capture in the raw evidence directory.

| Lane                 | Result                                                                                                             | Raw evidence                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| 2. README file       | Pass. Markdown input renders a valid 4395×2327 PNG. P3 expands to the longest line instead of wrapping at 1920 px. | `p4-file.png`, `tmux-lane-2.txt`               |
| 3. Python stdin      | Pass. PNG stdout is 439×334 and shows Python highlighting.                                                         | `p4-stdin.png`, `tmux-lane-3.txt`              |
| 4. Lines 5–12        | Pass. Exactly eight code lines, numbered 5 through 12.                                                             | `p4-lines.png`, `tmux-lane-4.txt`              |
| 6. Three files       | Pass. TypeScript, Python, and Rust tabs are visible.                                                               | `p4-multi.png`, `tmux-lane-6.txt`              |
| 7. Unknown theme     | Pass. Exit 2, `--theme` named, valid theme IDs listed.                                                             | `p4-bad-theme.png`, `tmux-lane-7.txt`          |
| 8. SVG stdout        | Pass. Chromium parses one SVG without a parser error and renders it.                                               | `p4.svg`, `p4-svg.png`, `image-checks.json`    |
| 9. No terminal input | Pass. Usage is on stderr and exit is 2.                                                                            | `p4-usage.png`, `tmux-lane-9.txt`              |
| 10. Packed npx       | Pass. A clean directory and isolated npm cache render a 430×1364 PNG. PATH contains only Node, npx, and sh.        | `p4-npx.png`, `lane-10.sh`, `tmux-lane-10.txt` |

The tarball from `pnpm --filter=@codeimage/cli pack` is **14,126,299 bytes**,
about 14.13 MB or 13.47 MiB. It contains 290 files under `dist/fonts`, including
font metadata and licenses. The published manifest declares only Zod and
Takumi, with no workspace or unpublished-renderer dependency. npm installs
`@takumi-rs/core-darwin-arm64`.

An additional command in that clean directory renders `🇮🇹 你好世界 한글`.
Visual inspection confirms the flag, Chinese, and Korean glyphs in
`p4-npx-unicode.png`. No host font path is supplied. Other operating systems
were not tested in this P4 run.

## Performance

The fixture is `foo.ts`, with exactly 50 TypeScript lines. The measured command
uses the built CLI at its default scale 1:

```sh
hyperfine --warmup 2 --runs 20 --export-json hyperfine.json \
  'codeimage foo.ts -o foo.png'
```

- Cold median is **960.564 ms**, passing the 1.5-second rule. Range is
  455.144–3,118.640 ms and standard deviation is 674.715 ms.
- All 20 measured commands exit 0. The final PNG is 430×1364 and is byte-identical
  to the matching warm `renderSnapshot` output.
- The warm renderer median is 71.522 ms over 20 runs after two warmups.
  Range is 39.275–262.382 ms, with zero errors.
- The host has eight logical CPUs. Load averages at the cold run's start were
  26.00, 57.76, and 55.01. Median process CPU time is 647.017 ms.
- A separate, unreported-for-timing CPU profile shows module compilation,
  font reads, garbage collection, and asynchronous native waiting. Cold execution
  includes process startup and font registration. Host contention and native
  work limit attribution of the cold/warm gap. This is a gate result, not a
  controlled speedup or a measurement of font-loading cost alone.

`hyperfine.json`, `perf-summary.json`, `perf-load.txt`, `warm.json`,
`profile-summary.json`, and `CPU.*.cpuprofile` retain the measurements.

## Checks and review media

- `pnpm install` and a complete `pnpm libs:build` pass.
- CLI tests pass, 41 tests. Renderer tests pass, 34 tests.
- `pnpm lint` passes with the existing 33 app warnings and no CLI warnings.
- `pnpm typecheck` passes. The new parity script also passes a separate TypeScript check.
- Fresh checkout setup requires `pnpm --filter=@codeimage/api exec prisma generate`,
  the Prisma models build, and `pnpm --filter=@codeimage/api build:ts` before
  full typecheck. The old six app implicit-any errors came from missing API
  schema declarations. No application-source changes were needed.
- The verification copy of `.env.local` is ignored. The locally regenerated MSW
  service worker is restored before commit.

Updated review artifacts are [file input](media/p4-review-file.png),
[web preset](media/p4-review-preset.png),
[invalid theme](media/p4-review-bad-theme.png), and
[terminal recording](media/p4-review.mp4). The recording shows live tmux output
from file, stdin, and copied-preset commands for about 34 seconds.

## Restack on P3 69a4c64e

This run supersedes the earlier parity results. All four cells assert equal PNG dimensions and native Chrome DPR. Pixelmatch threshold remains 0.1 and the limit remains 0.5%.

| Lane | Scale / native DPR | Chrome and CLI dimensions | Difference |
| ---- | ------------------ | ------------------------- | ---------- |
| 1    | 1                  | 420×267                   | 0.446763%  |
| 5    | 1                  | 420×267                   | 0.480649%  |
| 1    | 2                  | 840×534                   | 0.401953%  |
| 5    | 2                  | 840×534                   | 0.408641%  |

Command: `pnpm exec tsx packages/cli/scripts/web-parity.ts --url http://localhost:4436 --out /tmp/p4-parity-69a4c64e`. Browsers ran sequentially. The dev server was stopped afterward.

`pnpm install`, `pnpm libs:build`, 41 CLI tests, 42 renderer tests, `pnpm lint` and `pnpm typecheck` passed. Lint retains 33 existing warnings. Fresh-checkout setup required Prisma generation, the API `build:ts` command for schema declarations, and local MSW worker regeneration. The worker was restored after verification. The environment file remains ignored. Hyperfine was not rerun.
