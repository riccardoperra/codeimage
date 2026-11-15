# Animate unified editor verification

Verified on 2026-11-15 on `feat/animate-new-ui`, based on `dc07a549` and the
unchanged unified-editor base `60f84ab65177237a67096d57651241c83c27865e`.

## Commits

| Slice | Commit      | Result                                                  |
| ----- | ----------- | ------------------------------------------------------- |
| 1     | `a2c0ca35`  | Per-transition timing and easing curves                 |
| 2     | `397c612b`  | Stable steps, store, API and persistence                |
| 3     | `af1a99f7`  | Preview headers, split planning, pill and edit step     |
| 4     | `a3d816ca`  | Shared island in all layouts                            |
| 5     | `7f984a66`  | Resize, snap, nudge and buffered durations              |
| 6     | `d03599d1`  | Easing popover, custom curves and bounded playback      |
| 7     | This commit | Sweep, integration fixes, verification and review media |

All commits carry the requested co-author trailer. Each implementation slice
was pushed to `feat/animate-new-ui`. No other branch was pushed, no PR was
merged, and the PR body was left unchanged.

## Review after merging main

`origin/main` at `532da1e81e38b187704d9885c256bc915e635960` (the unified
editor #711/#737 and Takumi #731) was merged in as `291e6d5f`. Four files
conflicted:

| File                                        | Resolution                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `apps/api/.../project.repository.ts`        | Both import lists: `parseAnimationSettings` and main's reordered `parseTabMarks`             |
| `apps/codeimage/.../Frame/PreviewFrame.tsx` | This branch's `FrameView`/`PreviewFrame` split; main's copy-hotkey renderer moves into `PreviewFrame` |
| `apps/codeimage/src/i18n/index.ts`          | `animationLocale` and main's `whatsNewLocale` in every locale                                |
| `.../editor-controls/stage.tsx`             | `Stage` keeps `AnimatePanel` and `AnimateToggle` and gains main's `compact`                 |

After the merge and the review fixes:

| Check                                   | Result                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------- |
| App Vitest                              | 275 passed, 42 files                                                      |
| API unit Vitest (CI env)                | 77 passed, 15 files                                                       |
| API update/GET against Docker Postgres  | 5 passed                                                                  |
| `pnpm libs:build`, API `build:ts`       | Passed                                                                    |
| `pnpm typecheck`, `pnpm lint`           | Passed; lint has warnings only, none in Animate files                     |
| Chrome UI matrix                        | 66 passed: 11 lanes × 3 layouts × 2 sizes                                 |
| Localization browser matrix             | 24 passed: en/it/de/es × 3 layouts × 2 sizes                              |
| Locale keys                             | 514 keys and placeholders match in it, en, de, es                         |
| Default timelines vs `main`             | 20 byte-identical                                                         |
| Static export vs `main`                 | DOM and Chrome pixels identical, 5 window styles × all tabs/active tab    |
| Chrome/Takumi preview parity            | Target 1× and 2×, free 2×: 39/39. Free 1×: 35/39, see [below](#free-size-parity) |

Two lanes needed main's What's new nudge (#725) hidden: it settles over Dock's
phone bar and took the click meant for the Animate toggle.

## Results

| Check                                        | Result                                                      |
| -------------------------------------------- | ----------------------------------------------------------- |
| App Vitest                                   | 205 passed, 33 files                                        |
| API unit Vitest                              | 77 passed, 15 files                                         |
| API update/GET against Docker Postgres       | 5 passed                                                    |
| App and API typecheck                        | Passed                                                      |
| `pnpm libs:build` and API `build:ts`         | Passed                                                      |
| Default timeline compatibility               | 20 complete serialized outputs byte-identical to `dc07a549` |
| Chrome UI matrix                             | 66 passed: 11 lanes × 3 layouts × 2 sizes                   |
| Localization browser matrix                  | 24 passed: en/it/de/es × 3 layouts × 2 sizes                |
| Locale keys/placeholders and hard-coded text | 481 matching keys; negative controls passed                 |
| Target-size Chrome/Takumi comparison         | 39/39 within 0.5%; worst 0.175% (first harness)            |
| oxfmt                                        | Passed on changed files                                     |
| oxlint                                       | No errors; existing layout reactivity warnings remain       |

Firefox and WebKit were skipped as requested. Chrome ran at 1440×900 and
390×844 with Inspector `?v=2`, Dock `?v=3` and Studio `?v=4`.

The UI lanes are Placement, Playback, Scrub, Resize, Nudge, Easing, Pill,
Header, Steps, Persistence and Hotkeys. They cover frozen-axis geometry and
ripple positions, 100/10 ms snapping, one IndexedDB write per drag, keyboard
entry in NumberField, custom validation/clamping, bounded playback, focus
return, repeated tabs, duplication, removal and reload. Header checks also
exercise macOS, Windows, Card, Editor and Shell. Same-name header pixels are
compared at a common origin to exclude frame-centering antialiasing changes.

The real CodeMirror regression test covers reused views, delayed tab binding,
read-only focus, and cancellation when preview resumes. The default-output
comparison executes the pinned base's unchanged timeline fixtures against
both implementations and compares the complete serialized timelines.

## Reproduce

Use pnpm 12.18.0 and Node 24.14.0. Install with
`pnpm install --frozen-lockfile`, generate Prisma, then build the libraries and
API before typechecking. The lockfile has no changes.

For the UI run, clear `apps/codeimage/node_modules/.vite`, then start:

```sh
VITE_ENABLE_MSW=true VITE_MOCK_AUTH=true fnm exec --using=v24.14.0 pnpm --dir apps/codeimage exec vite --host 127.0.0.1 --port 4377 --strictPort
```

From the repository root:

```sh
fnm exec --using=v24.14.0 node scripts/parity/live-animate.ts --video
fnm exec --using=v24.14.0 node scripts/parity/animation-defaults.ts
fnm exec --using=v24.14.0 node apps/codeimage/src/prototypes/editor-controls/verify-locale-parity.mjs
fnm exec --using=v24.14.0 node apps/codeimage/src/prototypes/editor-controls/verify-i18n.mjs http://localhost:4377
```

API integration uses the local Docker test database on port 5433, the deployed
migrations and `apps/api/.env.test`. It preserves the database schema:

```sh
fnm exec --using=v24.14.0 pnpm --dir apps/api exec dotenv-cli -e .env.test -- prisma migrate deploy
fnm exec --using=v24.14.0 pnpm --dir apps/api exec vitest run --config vitest.animation.config.ts
```

The live parity adapter renders the app's scene HTML/CSS independently in
Chrome and native Takumi 2.19.0 with identical font files. It uses the
`x-landscape` target at 2× and samples every hold plus both halves of the
701 ms custom and 431 ms Strong incoming transitions, for all header modes.
The existing renderer checkout supplies only its native dependency and fonts;
its source, SSR entry and branch remain untouched:

```sh
fnm exec --using=v24.14.0 node scripts/parity/animation-preview.ts --preview --url http://localhost:4377/ --render-root /path/to/packages/render
```

## Free-size parity

The first run of this report found the free-size comparison at 1× **not
green**: 2/39 frames within 0.5%, worst 1.579%, while target size passed
39/39. The review after the merge of `main` (`532da1e8`) traced it. It is not
a regression of this branch: two harness artefacts plus one Takumi limit that
predates it.

| Harness                         | Free 1×          | Free 2×          | Target 1×        | Target 2×        |
| ------------------------------- | ---------------- | ---------------- | ---------------- | ---------------- |
| Before the fix                  | 12/39, 1.514%    | 0/39, 1.139%     | 39/39, 0.050%    | 39/39, 0.148%    |
| Before the fix, no step timings | 10/39, 0.999%    | 0/39, 1.246%     | 39/39, 0.046%    | 39/39, 0.158%    |
| Doctype only                    | 35/39, 0.943%    | 14/39, 0.802%    | 39/39, 0.008%    | 39/39, 0.122%    |
| Doctype and real device scale   | **35/39, 1.146%** | **39/39, 0.071%** | **39/39, 0.008%** | **39/39, 0.003%** |
| Same, no step timings           | 39/39, 0.472%    | 39/39, 0.337%    | 39/39, 0.008%    | 39/39, 0.002%    |

1. **Quirks mode (harness).** The reference page was written with
   `setContent` and no doctype, so Chrome drew it in quirks mode. There a line
   that holds only an inline `<svg>` gets no strut: the watermark box
   (`terminal.css.ts` `watermark`, absolute at `bottom: -6px`, holding a
   125 px wide SVG) is 24.297 px tall instead of 28.797 px, and the logo sits
   4.5 px lower than in the app. Takumi lays it out as standards mode does.
   That is 540 to 620 changed pixels on every hold at 1×: 0.5 to 0.6% of a
   410×267 free-size frame, but 0.04% of a 1600×900 target, which is the only
   reason target size passed.
2. **Emulated device scale (harness).** The 2× reference used Playwright's
   `deviceScaleFactor`, which moves edges and glyphs by sub-pixels. A Chrome
   launched with `--force-device-scale-factor` and `viewport: null` takes
   free 2× from 14/39 to 39/39 (holds about 0.001%).
3. **Fractional transform edges (Takumi, pre-existing).** The four frames
   still over the bar at free 1× are mid-transition (2109 ms in every header
   mode, 2217 ms in Current tab). In free size the frame box animates its size
   and position: at 2109 ms it is `translate(0.479px, 0.585px)` and
   409.016×265.578 px. Chrome antialiases those edges (edge alphas 106, 132,
   123, 149); Takumi rounds them (127, 128, 0, 0). A lone `<div>` with the same
   transform reproduces it with no app code. One full edge row is 0.37% of a
   410×267 image, so a few edges pass 0.5%; at 2×, or at a target size where
   the frame does not resize, the same edges stay under it. The no-step-timing
   row passes only because its samples fall elsewhere in the motion: sampled
   every 25 ms it scores 48/58, worst 0.988% at 2150 ms, the same edge pattern.

Why it is not this branch:

- The static export frame, snapshotted the same way on `main` and on this
  branch, gives the same diffs (quirks 1×: 492, 589, 499 px; standards 1×: 54,
  57, 42 px). The export DOM and its Chrome pixels are identical to `main` for
  macOS, Windows, Card, Editor and Shell, with all tabs and with only the
  active one.
- `scripts/parity/animation-defaults.ts --base 532da1e8` passes: the 20
  default timelines are byte-identical to `main`.
- `parseInt` of the scene size truncates nothing: `planTimeline` rounds the
  scene to whole pixels.

`scripts/parity/animation-preview-live.ts` now writes a doctype and renders
the reference in a Chrome with a real device scale. Free size at 1× stays a
known Takumi limit, not a gate. Reproduce with the preview command above plus
`--free-size --scale 1` (or `--scale 2`, with or without `--free-size`). Results:
[free-size-parity.json](media/animate/free-size-parity.json), and the worst
frame's [Chrome](media/animate/free-size-chrome.png),
[Takumi](media/animate/free-size-takumi.png) and
[diff](media/animate/free-size-diff.png) images.

The CLI's independent SSR export integration remains owned by #726, as the
plan specifies. This verification does not claim that its unre-based renderer
already consumes the new fields. Static FrameView behavior stays unchanged
when no animation header is supplied, including Windows' existing tab
visibility behavior.

## Review media

| Layout    | Desktop                                       | Phone                                        | Video                                       |
| --------- | --------------------------------------------- | -------------------------------------------- | ------------------------------------------- |
| Inspector | [Screenshot](media/animate/layout-2-1440.png) | [Screenshot](media/animate/layout-2-390.png) | [8.28 s video](media/animate/layout-2.webm) |
| Dock      | [Screenshot](media/animate/layout-3-1440.png) | [Screenshot](media/animate/layout-3-390.png) | [6.56 s video](media/animate/layout-3.webm) |
| Studio    | [Screenshot](media/animate/layout-4-1440.png) | [Screenshot](media/animate/layout-4-390.png) | [7.80 s video](media/animate/layout-4.webm) |

The recordings show playback, pausing, selecting a transition, changing its
easing and returning to editing through the pill.
