# P4 renderer integration evidence

The CLI now calls `@codeimage/render` directly and uses its snapshot schema.
The packed command renders without a browser. P4 is not merge-ready because
the live web-export comparison exceeds the planned 0.5% pixel-diff limit.

Verification ran on macOS arm64 with Node 26.5.0 and pnpm 10.32.1 on
2026-11-14. The base is P3 commit `34f2bf89`. Trunk has no `packages/cli`.
Raw commands, tmux captures, fixtures, images, profiles, and JSON results are
in `/tmp/swarm-p4-wire/` on the implementation machine.

## Implementation

- `bin.ts` imports `renderSnapshot` normally. The duplicate schema and the
  placeholder renderer module are deleted.
- The renderer owns the snapshot width. The CLI no longer sets 960.
- `DEFAULT_SCALE = 1` supplies argument parsing and help text.
- The CLI build follows the renderer build in `pnpm libs:build`.
- The CLI bundle contains the renderer JavaScript. The package build copies
  the renderer's SSR files and fonts, and derives the published runtime
  dependencies from the renderer manifest. npm installs Takumi's native binding.
- The generated distribution is excluded from pnpm workspace discovery.

Type System Discipline drove the shared-schema imports. Prove It Works drove
the clean-directory tarball test and the direct-render comparison. One owner
kept branch and build changes serial, then ran independent live lanes in tmux.
No nested agents or independent reviewer ran in this implementation task.

## Live lanes

Every lane ran through the `p4-wire` tmux session. Browser actions used
Playwright against a production build with the mock API enabled. The local
mock service worker needed regeneration for the installed MSW version. That
verification-only file change was restored before commit.

| Lane | Result | Evidence in `/tmp/swarm-p4-wire/` |
| --- | --- | --- |
| 1. Compare with web export | **Fail.** Both images are 420×267 at scale 1. Pixelmatch at threshold 0.1 reports 0.9434635%, above 0.5%. | `parity.json`, `web-export.png`, `p4-parity.png` |
| 2. `README.md` file | Pass. Markdown inference is covered by the real config test. The PNG decodes at 1920×2394. | `p4-file.png`, `tmux-lane-2.txt` |
| 3. Python stdin | Pass. PNG stdout decodes at 439×334 and shows Python highlighting. | `p4-stdin.png`, `tmux-lane-3.txt` |
| 4. `--lines 5-12` | Pass. Eight visible lines, gutter numbered 5 through 12. | `p4-lines.png`, `tmux-lane-4.txt` |
| 5. Saved web preset | Copy action, JSON import, and rendering pass. Exact web-image parity fails as in lane 1. | `web-preset.json`, `web-lane.log`, `p4-preset.png` |
| 6. Three input files | Pass. TypeScript, Python, and Rust tabs are visible. | `p4-multi.png`, `tmux-lane-6.txt` |
| 7. Unknown theme | Pass. Exit 2, flag named, valid theme IDs listed. | `p4-bad-theme.png`, `tmux-lane-7.txt` |
| 8. SVG stdout | Pass. Chromium parses one SVG with no parser error and renders it. | `p4.svg`, `p4-svg.png`, `image-checks.json` |
| 9. No input in a terminal | Pass. Usage on stderr, exit 2. | `p4-usage.png`, `tmux-lane-9.txt` |
| 10. Clean packed npx | Pass. PNG decodes at 430×1364. PATH contains only Node, npx, and sh. | `lane-10.sh`, `p4-npx.png`, `tmux-lane-10.txt` |

Lane 10 uses an isolated npm cache and the tarball from
`pnpm --filter @codeimage/cli pack --pack-destination /tmp/swarm-p4-wire`.
The installed native module is `@takumi-rs/core-darwin-arm64`.
The published manifest has no workspace or unpublished-renderer dependency.
Other operating systems were not tested.

The lane 5 image is byte-identical to a direct `renderSnapshot` call with the
same preset and source. `direct.mjs` asserts this. That locates the parity gap
in the renderer path, rather than CLI snapshot translation or bundling.
A separate web comparison at explicit scale 2 also fails, at 0.6416087%, with
both images 840×534. The difference image shows text rasterization differences.
The web image also has a different header background. These remain P3 follow-ups.
The CLI default remains 1.

## Performance

The fixture is a 50-line TypeScript file, `foo.ts`. The measured command is
`codeimage foo.ts -o foo.png` against the built CLI at default scale 1.

```sh
hyperfine --warmup 2 --runs 20 --export-json hyperfine.json \
  'codeimage foo.ts -o foo.png'
```

- Cold median is **970 ms**. The range is 418–2,151 ms and standard deviation
  is 456 ms. All 20 measured runs exit 0. This passes the 1.5-second median rule.
- A matching warm `renderSnapshot` call has a 146 ms median over 20 runs after
  two warmups. Its range is 49–339 ms. The warm output is byte-identical to the
  cold CLI output, a 430×1364 PNG.
- The host had eight logical CPUs and load averages of 37.51, 29.61, and 22.49
  when the cold run began. Other work was running on the machine.
- A separate Node CPU profile shows module compilation, Takumi helper loading,
  garbage collection, and asynchronous waiting. The broad wall-time spread
  is consistent with host contention. The warm/cold gap is not a controlled
  attribution of startup cost under that load.

`hyperfine.json`, `perf-summary.json`, `perf-load.txt`, `warm.json`,
`warm-output.png`, and `CPU.*.cpuprofile` retain the measurements. The earlier
P3 PR reports 353 ms for a different 300-line, scale-2 fixture. That is not a
matching baseline for this CLI fixture.

## Checks and review media

- `pnpm install` and `pnpm libs:build` pass.
- CLI tests pass, 41 tests. Renderer tests pass, 25 tests.
- `pnpm lint` passes. The CLI has zero warnings. Existing app warnings remain.
- `pnpm typecheck` fails with the six app implicit-any errors previously listed
  in P4's PR body. They are in `projectMockHandlers.ts`, `ProjectItem.tsx`, and
  `editor.ts`. CLI and renderer typechecks pass. No unrelated type changes
  were made to hide those failures.
- The production app build passes.

Review artifacts are [file input](media/p4-review-file.png),
[web preset](media/p4-review-preset.png),
[invalid theme](media/p4-review-bad-theme.png), and
[terminal recording](media/p4-review.mp4). The recording shows live tmux output
from file, stdin, and preset commands. It lasts about 34 seconds.

The operator's visual review and the independent review remain outstanding.
The PR must not be merged on this evidence alone.
