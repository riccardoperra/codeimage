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
| Target-size Chrome/Takumi comparison         | 39/39 within 0.5%; worst 0.175%                             |
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

## Remaining rendering follow-up

The additional small free-size comparison is **not green** at the strict 0.5%
threshold: 2/39 frames pass at 1×, with a worst difference of 1.579%. This is
separate from the passing target-size fixture. The report retains this result
rather than relaxing the threshold. Investigate the free-size Chrome/Takumi
rendering gap before claiming parity for every export size.

Reproduce with the same command plus `--free-size --scale 1`. Results are in
[free-size-parity.json](media/animate/free-size-parity.json); a failing sample
has [Chrome](media/animate/free-size-chrome.png),
[Takumi](media/animate/free-size-takumi.png) and
[diff](media/animate/free-size-diff.png) images. Passing target results are in
[target-parity.json](media/animate/target-parity.json).

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
