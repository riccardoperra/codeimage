# CodeImage code animation plan

CodeImage gets animated exports. A user puts code steps in tabs, and CodeImage animates from one tab to the next. Tokens that stay slide to their new place, removed tokens fade out, and new tokens fade in. The web app exports MP4 as the main format and GIF as the second. The CLI also writes MP4 and GIF, plus animated WebP and APNG.
The program builds on what P1 to P4 already ship. The tabs are the steps. The Lezer tokens from `tokenizeCode` are the tokens. `@shikijs/magic-move/core` pairs tokens between steps. One CSS stylesheet with a `@keyframes` rule per token is the timeline. Takumi renders it, natively in Node and as WASM in the browser, and the browser plays the same CSS for the live preview.
The rule the program enforces is endpoint parity. The first frame of a transition matches the static export of the step it leaves, and the last frame matches the static export of the step it reaches, within 0.5% of pixels at pixelmatch threshold 0.1.
PR ids in order are A1, A2, A3, A4, A5, A6. A4 exports MP4 from the web app, A5 exports GIF from the web app, and A6 exports MP4 from the CLI.

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how-to. The appendices explain and record.

The program runs `~/.claude/skills/poteto-mode/playbooks/autopilot-stack.md`. The operator, Riccardo, lands every PR. Every PR id stops at merge-ready and waits for the operator.

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] State the protocol and this plan to the operator, then stop. Start execution only on the operator's explicit go.
- [ ] Confirm that P1, P3, and P4 of `docs/plans/2026-cli-and-renderer/plan.md` are merged, or base A1 on the stack tip that holds them. A4 also needs P2.
- [ ] Read these at program start. Re-read them at every tick.
  - [ ] `~/.claude/skills/poteto-mode/playbooks/autopilot-stack.md`
  - [ ] `~/.claude/skills/swarm/SKILL.md`
  - [ ] `~/.claude/skills/poteto-mode/playbooks/opening-a-pr.md`
  - [ ] `~/.claude/skills/poteto-mode/playbooks/visual-parity.md` for A1, A2, A4, and A5.
  - [ ] `git show origin/main:docs/plans/2026-code-animation.md` once this plan is on trunk.
  - [ ] `git show origin/main:apps/codeimage/src/core/snapshot/tokenize.ts`
  - [ ] `git show origin/main:apps/codeimage/src/components/CustomEditor/StaticCodeView.tsx`
  - [ ] `git show origin/main:packages/render/src/render.ts`
- [ ] On the operator's go, arm the audit tick as `/loop 1h` with the tick prompt below. Never leave the cadence to memory.
- [ ] Use this tick prompt, verbatim. "Re-read the execution playbook from trunk. Audit the operation against it and fix drift in this tick. Probe every active lane and judge progress by side effects only. Stand down a stuck lane and dispatch its replacement now. Then post a short status message to the operator in chat only when the audit found a tracked change that no earlier status message reported, such as a PR opened, a code-ready head, a round launched or closed, a verdict, a merge, a stuck agent and the action taken, a blocker added or cleared, or a decision only the operator can make. Name every such change and nothing else. Do not repeat a table, the merged list, or an unchanged blocker. If the audit found none, end the turn with no reply text. Either way, log this tick's row in your decision trail. The row names the items reported, or none."
- [ ] On the operator's hold or stand-down, send every owner a zero-writes order at once.

### Spawn owners

- [ ] Spawn one owner per PR with the full lifecycle the execution playbook names. A Codex agent writes the code. When the Codex owner reports code-ready, an Opus agent reviews the branch locally and improves it. Only one writer works on a branch at a time.
- [ ] Follow this dependency graph. Start dependent work only after its parent merges, or base it on the parent branch when the execution playbook stacks.
  - [ ] A1 is first. It branches from the stack tip that holds P1, P3, and P4.
  - [ ] A2 after A1.
  - [ ] A3 after A1. A2 and A3 are independent of each other.
  - [ ] A4 after A3 and P2. A3 ships as #736.
  - [ ] A5 after A4.
  - [ ] A6 after A2 and A4.
- [ ] Hold the file boundaries.
  - [ ] A1 touches only `apps/codeimage/src/core/animation/**`, `apps/codeimage/src/components/CustomEditor/AnimatedCodeView.tsx`, `apps/codeimage/src/render/entry-server.tsx`, `apps/codeimage/package.json`, and `scripts/parity/animation-*.ts`.
  - [ ] A2 touches only `packages/render/**`, `packages/cli/src/args.ts`, `packages/cli/src/bin.ts`, and `packages/cli/src/flags/animate.ts`.
  - [ ] A3 touches only `apps/codeimage/src/state/editor/**`, `apps/codeimage/src/components/Animation/**`, `apps/codeimage/src/components/Frame/PreviewFrame.tsx`, the editor page layout under `apps/codeimage/src/pages/Editor/**`, `apps/api/prisma/**`, `apps/api/src/**` for the new field, `packages/locale/**`, and `scripts/parity/animation-*.ts`.
  - [ ] A4 touches only `apps/codeimage/src/core/rasterize/**`, `apps/codeimage/src/core/video/**`, `apps/codeimage/src/core/animation/**` and `apps/codeimage/src/render/entry-server.tsx` for the `targetLayout` move, `apps/codeimage/src/hooks/use-export-animation.ts`, `apps/codeimage/src/workers/animation.worker.ts`, `apps/codeimage/src/pages/UnifiedEditor/shell/ExportControl.tsx`, `apps/codeimage/src/pages/UnifiedEditor/shell/export*.ts*`, `apps/codeimage/src/i18n/animation.ts`, and `apps/codeimage/package.json`.
  - [ ] A5 touches only `apps/codeimage/src/core/gif/**`, `apps/codeimage/src/hooks/use-export-animation.ts`, `apps/codeimage/src/workers/animation.worker.ts`, `apps/codeimage/src/pages/UnifiedEditor/shell/export*.ts*`, `apps/codeimage/src/i18n/animation.ts`, `apps/codeimage/package.json`, and `scripts/parity/animation-gif.ts`.
  - [ ] A6 touches only `packages/cli/src/video/**`, `packages/cli/src/args.ts`, and `packages/cli/src/bin.ts`.
- [ ] Hold the review gate. A2, A3, A4, A5, and A6 change an interaction. They wait for the operator's review in chat with screenshots and a video before merge.

### PR mechanics, for every PR

- [ ] Resolve the forge once. Default to `gh`. If `command -v origin` succeeds and Origin can resolve the repository, use `origin pr` for every PR operation. Record any fallback to `gh`. Never require `gt`.
- [ ] Open the PR ready, never draft, per **Opening a PR**. Use the run's built-in PR tool when it has one, else `origin pr create --status open --base <base-branch>` or `gh pr create --base <base-branch>` according to the resolved forge. A stack child targets its parent branch.
- [ ] Run `pnpm lint` and `pnpm typecheck` once before the PR-facing push. Push with hooks on.
- [ ] Add a changeset for every package the PR changes.
- [ ] Run `/deslop` before each commit and `/no-comments` before review. Without `deslop`, reread the diff and cut slop by hand.
- [ ] Triage every Bugbot and security-reviewer comment per `~/.claude/skills/poteto-mode/references/bugbot-triage.md`.
- [ ] Rebase onto current trunk before the code-ready report and babysit. Keep that merge base in fix rounds. Rebase again only at merge prep, on a `git merge-tree` conflict with trunk, on a CI failure that comes from a change on trunk, or when a known concurrent change to the same files lands.

### Verdict and merge, for every PR

- [ ] A full swarm runs once, at the code-ready head. Another full swarm runs only for new behavior, a redesign, or a large new diff. A rebase, a merge-conflict resolution, or a minor fix gets a single verifier at the new head, and a wording-only change gets none. Run each full swarm per `~/.claude/skills/swarm/SKILL.md`. One gates lane. The ten live lanes from the PR's **Verify, live** block. The perf lane from its **Verify, perf** block. Two or more audit lanes, each with its own focus, that read the diff and the receipts and distrust the PR body. The root audits the receipts in the merge-ready report before the verdict.
- [ ] Judge every finding by the execution playbook's blocking rule. The verdict is clean when none blocks. A failure on trunk behavior in a lane marked `Regression lane against trunk.` is recorded against trunk and does not block the PR. A new head gets a fresh verdict, except for results that stay valid under the patch-id rule in `playbooks/shipping.md`.
- [ ] On a clean verdict the owner appends the PR to the stack and reports merge-ready. The operator lands the stack bottom-up. A rebase that keeps the patch-id keeps the verdict, per `playbooks/shipping.md`.

### Boot recipe, for every live lane

Each live lane runs in its own git worktree at the PR head. There is no `control-ui` or `control-cli` skill in this harness, so web lanes drive Chrome through Playwright and CLI lanes run in a tmux pane. The machine also runs other programs, so open one browser per lane and run perf probes only when the load average is under 8.

- [ ] `git fetch origin <head-branch> && git checkout <head SHA>`.
- [ ] Run `pnpm install`, `pnpm libs:build`, and `pnpm prepare:env`. Then start the web app with `pnpm dev` and wait until `http://localhost:4200` answers. The `prepare:env` script sets `VITE_ENABLE_MSW=true`, so the app runs against the mock API in `apps/codeimage/src/mocks` and needs no database.
- [ ] For CLI lanes, run `pnpm --filter=@codeimage/cli build` and call `node packages/cli/dist/bin.js` inside tmux. Capture the pane with `tmux capture-pane -p`.
- [ ] Deliver input only through Playwright page actions or tmux `send-keys`. Read-only diagnostics are the browser console, `tmux capture-pane`, `webpmux -info`, `ffprobe` when it exists, and the output files.
- [ ] To look at frames of an animated file, extract them with `webpmux -get frame <n>` for WebP, or decode them with the `scripts/parity/animation-frames.ts` helper that A1 adds.
- [ ] Save every screenshot to `/tmp/swarm-<pr-id>/worker-<n>/<slug>.png` and return the paths with the report.

## Compile two steps into one keyframed scene (A1)

**Depends on.** P1, P3, and P4.

**Split.** On 2026-11-15 A1 became two PRs, so the animation UI can ship with the new editor before the CLI. The core is every file below except `entry-server.tsx` and `scripts/parity/animation-*.ts`, plus the A2 fix that makes `planTimeline` take `fps`. It needs only P1 and P5 and lands on `main` alone. #707 keeps the Node part on top of P3 and the core. A3 builds on the core, and A2 builds on #707.

**Files.**

- [ ] Create `apps/codeimage/src/core/animation/model.ts`.
- [ ] Create `apps/codeimage/src/core/animation/pair.ts`.
- [ ] Create `apps/codeimage/src/core/animation/compile.ts`.
- [ ] Create `apps/codeimage/src/components/CustomEditor/AnimatedCodeView.tsx`.
- [ ] Edit `apps/codeimage/src/render/entry-server.tsx` to export `renderAnimationScenes`.
- [ ] Edit `apps/codeimage/package.json` to add `@shikijs/magic-move`. Import only `@shikijs/magic-move/core`. Do not add `shiki`. Check with `pnpm why shiki --filter=@codeimage/app`, which must print nothing.
- [ ] Create `scripts/parity/animation-endpoints.ts` and `scripts/parity/animation-frames.ts`.

**Build.**

- [ ] Define the persisted shape in `model.ts` as `type AnimationSettings = {steps: {editorId: string; holdMs: number}[]; transitionMs: number; easing: 'smooth' | 'snappy' | 'linear'; fps: 24 | 30 | 50 | 60}`. A step points at a tab by `editorId`, so the tabs stay the only place that holds code.
- [ ] Define the derived shape as a discriminated union. `type Cell = {line: number; col: number}`. `type TokenTransition = {kind: 'move'; key: string; text: string; classes: string; from: Cell; to: Cell} | {kind: 'enter'; key: string; text: string; classes: string; to: Cell} | {kind: 'leave'; key: string; text: string; classes: string; from: Cell}`. A token that a step keeps is a `move` even when its cell does not change.
- [ ] In `pair.ts`, write `pairSteps(from: TokenLine[], to: TokenLine[]): TokenTransition[]`. Turn each `TokenSpan` into a magic-move token with `content`, `offset`, and the Lezer `classes`. Call `toKeyedTokens` and then `syncTokenKeys` with `enhanceMatching: true`. Skip whitespace tokens, because only their width matters and the cell already carries it.
- [ ] Treat line numbers as tokens keyed by their value with a `gutter:` prefix, so a number keeps its row when lines are inserted above it. The code slides past the numbers, as in an editor gutter.
- [ ] Treat each P5 line mark as an element keyed by `mark:<kind>:<text of the line>`. A mark that both steps keep moves with its line. When a step edits a marked line, a leftover mark of the same kind on the same row stays in place. Other marks fade.
- [ ] In `compile.ts`, write `compileScene(transitions, metrics, timing): {html: string; css: string}`. `metrics` is `{charWidth: number; lineHeight: number; origin: {x: number; y: number}}`. Each token is a `position: absolute` span at its `to` cell, or at its `from` cell for a `leave`. Each `move` gets a `@keyframes` rule from `translate(dx, dy)` to `translate(0, 0)`. `leave` fades out in the first 30% of the transition, and `enter` fades in during the last 30%. These are the magic-move defaults of 0.3 and 0.7.
- [ ] Measure `charWidth` once per font and size with Takumi `measure()` on a 40-character run, as `docs/plans/prototypes/animation/proto-a.mjs` does. In the browser, measure the same run with a DOM range. Never measure each token.
- [ ] Animate the code box `width` and `height` between the two steps' sizes in the same stylesheet. The video size is the largest frame over all steps, and the frame stays centered.
- [ ] A token that both steps keep with a different highlight class is a `move` with `fromClasses`. It slides on one path while the two colors crossfade.
- [ ] Map `easing` to one table. `smooth` is `cubic-bezier(0.65, 0, 0.35, 1)`, `snappy` is `cubic-bezier(0.2, 0, 0, 1)`, and `linear` is `linear`.
- [ ] Write `AnimatedCodeView.tsx` as `StaticCodeView` with the code area replaced by the compiled spans. Keep the terminal chrome, background, watermark, and signature from the static view, so only the code area differs.
- [ ] Export `renderAnimationScenes(snapshot, settings)` from `entry-server.tsx`. It returns `{scenes: {html: string; durationMs: number}[]; css: string; width: number; height: number}`. A hold is a static scene of the step. A transition is one scene of `AnimatedCodeView`.
- [ ] Write `scripts/parity/animation-endpoints.ts`. For each case it renders the transition at `timeMs: 0` and at `timeMs: transitionMs` with Takumi, renders the static export of each step with `renderSnapshot`, and compares them with pixelmatch. Write `animation-frames.ts` to decode any frame of an animated WebP, GIF, or APNG to PNG.

**You see.**

- [ ] `pnpm exec tsx scripts/parity/animation-endpoints.ts` prints one row per case with the start and end diff, and every diff is at most 0.5%.
- [ ] A frame at half the transition shows tokens between their two places, as in `docs/plans/prototypes/animation/frame-14.png`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `pair.test.ts` asserts that renaming one identifier gives one `leave`, one `enter`, and `move` for every other token. It asserts that inserting two lines at the top moves every old token down two lines and keeps its key. It asserts that two identical steps give only `move` transitions with `from` equal to `to`. Run `pnpm --filter=@codeimage/app test`.
- [ ] `compile.test.ts` asserts that a `move` from (0, 0) to (2, 4) gets `translate(-4ch, -2 lines)` in pixels, and that `leave` and `enter` opacity windows match 0.3 and 0.7 of `transitionMs`.
- [ ] `AnimatedCodeView.test.ts` renders a two-step snapshot with SSR and asserts one span per non-whitespace token and one `@keyframes` rule per `move`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Export the default snippet as PNG on trunk and on head. Save `a1-static.png`. Pass when the diff is at most 0.5%, because A1 must not change static exports.
- [ ] Lane 2. Run `animation-endpoints.ts` on a TypeScript pair with one renamed function. Save `a1-rename.png` with the start, middle, and end frames side by side. Pass when both endpoint diffs are at most 0.5%.
- [ ] Lane 3. Run the endpoint script on a pair where the second step adds 20 lines. Save `a1-grow.png`. Pass when the endpoint diffs are at most 0.5% and the middle frame shows a window between the two heights.
- [ ] Lane 4. Run the endpoint script with line numbers on and a pair that inserts lines at the top. Save `a1-gutter.png`. Pass when the middle frame shows the code between its two places, every kept number on its own row, and no number drawn twice.
- [ ] Lane 5. Run the endpoint script on a pair with P5 marks on both steps. Save `a1-marks.png`. Pass when a kept mark moves with its line and the endpoints match within 0.5%.
- [ ] Lane 6. Run the endpoint script with Geist Mono ligatures on, for a pair that contains `=>` and `===`. Save `a1-ligatures.png`. Pass when the endpoints match within 0.5%.
- [ ] Lane 7. Run the endpoint script on a pair with CJK text and an emoji in a comment. Save `a1-fallback.png`. Pass when the endpoints match within 0.5%. Record the diff if the fallback fonts are wider than one cell.
- [ ] Lane 8. Run the endpoint script on five themes, including one light theme. Save `a1-themes.png`. Pass when every endpoint diff is at most 0.5%.
- [ ] Lane 9. Run the endpoint script for each terminal type in `apps/codeimage/src/components/Terminal`. Save `a1-terminals.png`. Pass when every endpoint diff is at most 0.5%.
- [ ] Lane 10. Run the endpoint script on two identical steps. Save `a1-identity.png`. Pass when every frame of the transition matches the static export within 0.5%.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Trunk has no animation. Measure static PNG export wall time in Node at trunk and head, and the head time of `pairSteps` plus `compileScene` for a 35-line pair with about 200 tokens per step.
- [ ] Probe. Ten interleaved runs of `renderSnapshot` on trunk and head, then 30 runs of `pairSteps` plus `compileScene` on head.
- [ ] Baseline. Record the trunk median of the static export first.
- [ ] Rule. The head static export median is at most 1.05 times trunk. The median of `pairSteps` plus `compileScene` is at most 20 ms. Either one over fails.

**Review gate.** None. A1 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends A1 to the stack and the operator lands it bottom-up.

## Render animated images in Node and from the CLI (A2)

**Depends on.** A1.

**Files.**

- [ ] Edit `packages/render/src/render.ts` to add `renderAnimation`.
- [ ] Edit `packages/render/src/document.ts` to accept `animation` and the formats `webp`, `gif`, and `apng`.
- [ ] Create `packages/cli/src/flags/animate.ts`.
- [ ] Edit `packages/cli/src/args.ts` and `packages/cli/src/bin.ts`.

**Build.**

- [ ] Add `renderAnimation(document, {format, fps, scale})` next to `renderSnapshot` in `render.ts`. It calls `renderAnimationScenes` from the SSR entry, then Takumi `renderAnimation` with the same `css`, `fontFamilies`, and font registration that `renderSnapshot` uses.
- [ ] Pass `width` and `height` to Takumi as physical pixels, the CSS size times `scale`, and set `devicePixelRatio` to `scale`. The prototype showed that Takumi keeps `width` and `height` as the output size and scales the content inside it.
- [ ] Cap `fps` at 50 for GIF, because Takumi rejects more. Encode WebP lossy at quality 90 by default, with `--lossless` to opt out.
- [ ] Add the `--animate` flag. Every input file is one step, in the order given. A project JSON with `animation` settings uses its own steps. `--hold 800`, `--transition 900`, `--easing smooth`, and `--fps 30` set the timing.
- [ ] Choose the format from `-o`. `.webp` is animated WebP, `.gif` is GIF, and `.apng` or `.png` with `--animate` is APNG. Any other extension with `--animate` exits with code 2 and names the supported ones.

**You see.**

- [ ] `codeimage step1.ts step2.ts --animate -o demo.webp` writes an animated WebP, and `webpmux -info demo.webp` lists more than one frame.
- [ ] `codeimage step1.ts step2.ts --animate -o demo.mp4` exits with code 2 and says that MP4 arrives in a later version.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `render.test.ts` gains a case that renders a two-step animation to WebP and asserts the frame count and the output size. Run `pnpm --filter=@codeimage/render test`.
- [ ] `flags/animate.test.ts` covers the step order, a project JSON with settings, the GIF fps cap, and the error for an unsupported extension. Run `pnpm --filter=@codeimage/cli test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run `codeimage step1.ts -o out.png` on trunk and head. Save `a2-static.png`. Pass when the two PNGs differ by at most 0.5%.
- [ ] Lane 2. Run `codeimage a.ts b.ts c.ts --animate -o demo.webp`. Save `a2-three-steps.png` with one frame per step. Pass when the file has the three steps in order with two transitions.
- [ ] Lane 3. Render the same pair to `.gif` with `--fps 60`. Save `a2-gif.png`. Pass when the CLI warns that GIF is capped at 50 fps and the file plays at 50 fps.
- [ ] Lane 4. Render the same pair to `.apng`. Save `a2-apng.png`. Pass when the file opens in Chrome and plays.
- [ ] Lane 5. Render with `--scale 2`. Save `a2-scale.png`. Pass when the output is twice the width and height of `--scale 1` and the text is sharp.
- [ ] Lane 6. Export a project JSON with `animation` settings from the web app at A3 or a fixture, and render it with `--animate`. Save `a2-project.png`. Pass when the hold and transition times match the settings within one frame.
- [ ] Lane 7. Combine `--animate` with `--diff`, `--size x-landscape`, and `--signature @riccardoperra`. Save `a2-combined.png`. Pass when every frame carries the signature and the social size.
- [ ] Lane 8. Combine `--animate` with secret redaction on a file that holds an API key. Save `a2-redact.png`. Pass when no frame shows the key.
- [ ] Lane 9. Run `--animate -o demo.mp4` and `--animate -o demo.jpg`. Save `a2-errors.png`. Pass when both exit with code 2 and the message names the supported extensions.
- [ ] Lane 10. Interrupt a long render with Ctrl+C. Save `a2-abort.png`. Pass when the CLI exits within one second and leaves no partial output file.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Trunk has no animation. Measure the static PNG CLI wall time at trunk and head. On head, measure the cold CLI wall time for a 3 second animation at 60 fps and 1920 by 1080 with about 200 tokens per step, as WebP and as GIF.
- [ ] Probe. Ten interleaved cold runs of the static command on trunk and head. Then ten cold runs of each animated command on head.
- [ ] Baseline. Record the trunk static median first.
- [ ] Rule. The head static median is at most 1.05 times trunk. The WebP median is at most 4 s and the GIF median is at most 10 s. The prototype measured 0.72 s for WebP and 2.76 s for GIF on a 2.1 s clip without the CLI cold start, so a value over the budget points at a regression.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 5, and 7 screenshots into `/tmp/codeimage-verification/a2-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of the CLI rendering a three-step animation and of the result playing in Chrome. Save it as `/tmp/codeimage-verification/a2-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends A2 to the stack and the operator lands it bottom-up.

## Preview and edit the animation in the editor (A3)

**Depends on.** A1.

**Status.** On 2026-11-15 A3 moved to the unified editor. It ships as #736, `feat(app): animate panel in the unified editor`, with its own plan in `docs/plans/2026-animate-new-ui.md` on `feat/animate-new-ui`. The classic-editor PR, #727, was closed and its commits moved into #736. The boxes below record the classic-editor A3. The Animate panel in #736 has no fps control. `fps` stays in the saved settings with a default of 30, and the A4 export dialog is the only place that sets it.

**Files.**

- [ ] Edit `apps/codeimage/src/state/editor/model.ts` to add `animation?: AnimationSettings` to `ProjectEditorPersistedState`.
- [ ] Create `apps/codeimage/src/state/editor/animation.ts`.
- [ ] Create `apps/codeimage/src/components/Animation/AnimationPanel.tsx` and `apps/codeimage/src/components/Animation/Timeline.tsx`.
- [ ] Edit `apps/codeimage/src/components/Frame/PreviewFrame.tsx`.
- [ ] Edit `apps/api/prisma/schema.prisma` and add a migration with `animation Json?` on `Project`. Edit the API schemas in `apps/api/src/schemas`.
- [ ] Edit `packages/locale` for the new strings in every language.
- [ ] Create `scripts/parity/animation-preview.ts`.

**Build.**

- [ ] Hold the settings in a store in `animation.ts`. Default the steps to every tab in tab order, with 800 ms holds, a 900 ms transition, `smooth`, and 30 fps. A tab that is deleted leaves the steps. A new tab is appended.
- [ ] Model playback as a state machine with the states `editing`, `playing`, `paused`, and `scrubbing`. Typing in the editor returns to `editing`, so the editor never shows a half-moved token.
- [ ] Add an **Animate** island below the preview, with play and pause, a scrubber, the step list, and the timing controls. Reuse `@codeui/kit` `SegmentedControl` for easing and fps, `NumberField` for durations, and `PanelRow` for rows. Drag a step to reorder it. Follow the island layout, the 36 to 40 px rows, and the overlay pickers the operator asked for in earlier UI work.
- [ ] Play the preview with the same `html` and `css` that `compileScene` returns, inside `PreviewFrame`. The browser runs the keyframes. Scrubbing sets `currentTime` on every animation from `element.getAnimations()`.
- [ ] Bind Space to play and pause while the preview has focus, and list it in the shortcuts dialog.
- [ ] Persist `animation` with the project and in shared presets that hold tabs. Snapshots without the field stay valid.
- [ ] Write `scripts/parity/animation-preview.ts`. For each case, it pauses the preview in Chrome at five times, takes a screenshot, renders the same times with Takumi `timeMs`, and compares them with pixelmatch. Use the Chrome setup in `scripts/parity/lib.ts`, with `viewport: null` and a forced device scale factor.

**You see.**

- [ ] With two tabs, pressing play morphs the first tab into the second in the preview, and the scrubber moves with it.
- [ ] `pnpm exec tsx scripts/parity/animation-preview.ts` prints five rows per case, each at most 0.5%.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `animation.test.ts` asserts the default steps, the effect of deleting and adding a tab, and that typing in the editor moves playback to `editing`. Run `pnpm --filter=@codeimage/app test`.
- [ ] The API test for projects saves and loads `animation`, and loads a project without it. Run the API tests per `apps/api` with the test database.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Open the editor with one tab on trunk and head, and export a PNG. Save `a3-single-tab.png`. Pass when the PNGs differ by at most 0.5% and head shows no animation controls with a single tab.
- [ ] Lane 2. Make three tabs, open **Animate**, and press play. Save `a3-play.png` at the middle of the first transition. Pass when the preview shows tokens between two places.
- [ ] Lane 3. Drag the third step to the top and play. Save `a3-reorder.png`. Pass when the animation starts from the third tab.
- [ ] Lane 4. Scrub to 25%, 50%, and 75% of a transition. Save `a3-scrub.png`. Pass when each frame matches the Takumi frame at the same time within 0.5%.
- [ ] Lane 5. Type in the editor while the preview plays. Save `a3-edit-stops.png`. Pass when playback stops and the editor shows the tab's code.
- [ ] Lane 6. Save the project, reload, and reopen it. Save `a3-persist.png`. Pass when the step order, holds, transition, easing, and fps come back.
- [ ] Lane 7. Delete a tab that is a step. Save `a3-delete-tab.png`. Pass when the step disappears and playback still works.
- [ ] Lane 8. Play in Chrome, Firefox, and Safari through Playwright WebKit. Save `a3-browsers.png`. Pass when all three play and scrub.
- [ ] Lane 9. Press Space with the preview focused, then with the editor focused. Save `a3-space.png`. Pass when Space toggles playback only when the preview has focus.
- [ ] Lane 10. Open the panel at 1440 by 900 and at 390 by 844. Save `a3-layout.png`. Pass when the island layout holds and nothing overflows.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Trunk has no animation. Measure editor typing latency with three tabs at trunk and head, and on head the dropped frames while the preview plays a 35-line transition.
- [ ] Probe. Ten interleaved runs of a scripted 200-character typing burst with `performance.measure` on trunk and head. Then ten playbacks on head with a `requestAnimationFrame` frame counter.
- [ ] Baseline. Record the trunk typing median first.
- [ ] Rule. The head typing median is at most 1.05 times trunk. Playback drops at most 5% of frames at 60 Hz. Either one over fails.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 3, and 10 screenshots into `/tmp/codeimage-verification/a3-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of making three tabs, reordering them, changing the timing, playing, and scrubbing. Save it as `/tmp/codeimage-verification/a3-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends A3 to the stack and the operator lands it bottom-up.

## Export MP4 from the web app (A4)

**Depends on.** A3, which ships as #736, and P2.

**Decision.** MP4 is the main animated format, because X, LinkedIn, Bluesky, Instagram, and slide tools take video. GIF follows in A5 for READMEs, docs, and Markdown, where video does not autoplay. The operator chose this order on 2026-11-15, after the prototype in Appendix A showed that every engine tested encodes H.264 with WebCodecs. The export runs only in the browser. Appendix B explains why there is no server-side export and no ffmpeg.wasm.

**Files.**

- [ ] Create `apps/codeimage/src/workers/animation.worker.ts`.
- [ ] Create `apps/codeimage/src/core/video/encode.ts` for the encoder config, the support check, and the MP4 muxing.
- [ ] Create `apps/codeimage/src/hooks/use-export-animation.ts`.
- [ ] Edit `apps/codeimage/src/core/rasterize/takumi.ts` to share font and stylesheet collection with the worker.
- [ ] Edit `apps/codeimage/package.json` to add `mediabunny`.
- [ ] Edit `apps/codeimage/src/pages/UnifiedEditor/shell/ExportControl.tsx` and `apps/codeimage/src/pages/UnifiedEditor/shell/export.tsx` to add the animation export. The classic `apps/codeimage/src/components/Toolbar/ExportButton.tsx` gets no animation export.
- [ ] Edit `apps/codeimage/src/i18n/animation.ts` for the new strings in en, it, de, and es.

**Build.**

- [ ] Move the `targetLayout` math from `apps/codeimage/src/render/entry-server.tsx` into `apps/codeimage/src/core/animation/` as a pure function, so the worker can plan a frame with a social target size. The operator chose A4 for this move on 2026-11-14.
- [ ] Add an **Export animation** entry to the Export menu in `ExportControl.tsx`. Show it when the animation has two steps or more. Its dialog holds the format and the fps, which is 24, 30, 50, or 60. The dialog is the only place that sets fps, because #736 removed the fps control from the Animate panel. Save the chosen fps in the animation settings, so the CLI renders the same rate from a project JSON.
- [ ] Plan the export the way the preview plans it. Read `animation.settings()` as saved, measure with `measurePreview`, and plan with `planTimeline` at the chosen fps.
- [ ] Run Takumi WASM in a module worker, so the editor stays responsive. Send the scenes, the stylesheet, and the font bytes that P2 already collects. Render each frame with `render({timeMs, format: 'raw'})` and wrap the RGBA pixels in a `VideoFrame`.
- [ ] Encode while the worker renders. Pass each `VideoFrame` to a WebCodecs `VideoEncoder` and render the next frame while the encoder works. Wait before the next render when `encodeQueueSize` passes a small limit, so memory stays flat on long clips.
- [ ] Write the MP4 with Mediabunny, which is MPL-2.0 and used unmodified. Use `Mp4OutputFormat` with `fastStart: 'in-memory'`, so the `moov` box comes before the media data.
- [ ] Request H.264 High profile in the codec string. Use `avc1.640028`, High at level 4.0, up to 1080p at 30 fps. Use `avc1.64002a`, level 4.2, for 1080p at 50 or 60 fps. WebKit encodes Baseline when the string does not ask for High.
- [ ] Set the colour space of every `VideoFrame` to BT.709 limited range, `{primaries: 'bt709', transfer: 'bt709', matrix: 'bt709', fullRange: false}`. Chrome encodes full range by default, which `ffprobe` reports as `yuvj420p`. A platform that re-encodes the upload may read it as limited range and shift the colours.
- [ ] Request a keyframe every 2 s with `encode(frame, {keyFrame: true})`. Set `bitrate` to a cap that scales with the pixel rate. Chrome wrote 8.8 Mb/s at 1080p60 in the prototype. Firefox ignores the requested bitrate and adds a keyframe every 0.5 s on its own, as Appendix C records.
- [ ] Round the video width and height up to even numbers, because H.264 rejects odd sizes. Fill the added pixel with the frame background.
- [ ] Warm up the encoder when the export dialog opens. Configure a `VideoEncoder` with the export config, encode one frame, and close it. Branded Chrome spends about 3 s on the first encode in a page, and the warm-up moves that cost into the time the user spends in the dialog.
- [ ] Check support before the dialog offers MP4. Call `VideoEncoder.isConfigSupported` with the exact config, including the codec string, the size, the bitrate, and the frame rate. When `VideoEncoder` is missing or the config is not supported, disable **MP4** and show one line with the reason. The line suggests a current Chrome, Firefox, or Safari. Offer no WebM fallback and show no Safari-only warning. From A5 on, the dialog selects **GIF** in that case.
- [ ] Show the duration, the size that the bitrate predicts, and a progress bar fed by the worker. **Cancel** closes the encoder and terminates the worker.
- [ ] When the WASM module fails to load, show an error that names the cause. There is no dom-export fallback for animation.
- [ ] Download the file through the same code as image export, as `video/mp4` with an `.mp4` name. Share it on mobile when `navigator.canShare` accepts the file.

**You see.**

- [ ] Exporting a three-step project as MP4 in Chrome shows progress and downloads a file that plays in QuickTime.
- [ ] `ffprobe` on that file reports `h264 (High)`, `yuv420p(tv, bt709)`, the chosen frame rate, and keyframes 2 s apart.
- [ ] In a browser that fails the support check, **MP4** is disabled and one line says why.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `encode.test.ts` asserts the even-size rounding, the codec string for 1080p30 and 1080p60, a keyframe every 2 s at each fps, and BT.709 limited range on every frame. Run `pnpm --filter=@codeimage/app test`.
- [ ] `use-export-animation.test.ts` asserts that cancel terminates the worker, that a worker error reaches the UI as a message, and that an unsupported config disables MP4 with its reason.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Export the same project as PNG on trunk and head. Save `a4-png.png`. Pass when the PNGs differ by at most 0.5%.
- [ ] Lane 2. Export three steps as MP4 at 1920 by 1080 and 60 fps in Chrome. Save `a4-chrome.png` with one frame per step. Pass when `ffprobe` reports H.264 High, `yuv420p` with BT.709 limited range, the expected duration and frame rate, keyframes 2 s apart, and the `moov` box first. The file must also play to the end in a `<video>` element.
- [ ] Lane 3. Export a project that uses a local system font from Local Font Access. Render the same times with Takumi WASM on the main thread as PNG. Save `a4-mp4-vs-takumi.png`. Pass when the MP4 frames use that font and differ from the PNGs by at most 2%, which leaves room for H.264 compression.
- [ ] Lane 4. Export the same project at 24 fps and at 60 fps, then reopen the dialog. Save `a4-fps.png`. Pass when `ffprobe` reports each rate, the dialog shows the last choice, and the Animate panel shows no fps control.
- [ ] Lane 5. Export a project with an odd frame width. Save `a4-odd-size.png`. Pass when the MP4 has an even width and no visible edge.
- [ ] Lane 6. Start a long export and click **Cancel**. Save `a4-cancel.png`. Pass when the progress stops, no file downloads, and the editor works.
- [ ] Lane 7. Type in the editor during an export. Save `a4-responsive.png`. Pass when the typed characters appear without a visible stall.
- [ ] Lane 8. Run three error cases. Block the WASM URL in Playwright. Make `VideoEncoder.isConfigSupported` resolve `{supported: false}`. Delete `VideoEncoder` before the app loads. Save `a4-errors.png`. Pass when the dialog names each cause in one line, suggests a current browser where MP4 is off, offers no WebM, and the app keeps working.
- [ ] Lane 9. Export MP4 in Firefox and WebKit through Playwright. Save `a4-browsers.png`. Pass when both files pass the `ffprobe` checks of lane 2 and the WebKit file is High profile. Record the Firefox bitrate. This lane needs the cross-browser setup in Appendix C. Until that setup exists, record the lane as not run.
- [ ] Lane 10. Export on a 390 by 844 viewport with share available. Save `a4-share.png`. Pass when the share sheet receives the MP4.
- [ ] Safari by hand, before the operator merges. Export a three-step project as MP4 once in real Safari 27 and run `ffprobe` on the file. Pass when it reports H.264 High, `yuv420p` with BT.709 limited range, the expected frame count, and the `moov` box first. No lane automates this check, because `safaridriver` could not start Safari in the prototype.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure PNG export wall time at trunk and head. On head, take a 3 second animation at 60 fps and 1920 by 1080 with about 200 tokens per step in Chrome. Measure its render-only time, its MP4 export time, and the longest main-thread task during the export. A render-only run renders every frame in the worker with `format: 'raw'` and drops it.
- [ ] Probe. Ten interleaved PNG exports on trunk and head in Chrome. Then ten interleaved pairs of a render-only run and an MP4 export on head, with the encoder warm and a `PerformanceObserver` for `longtask`. Record the first export in a fresh page apart from the ten.
- [ ] Baseline. Record the trunk PNG median first, then the head render-only median.
- [ ] Rule. The head PNG median is at most 1.05 times trunk. The MP4 median is at most 1.25 times the render-only median and at most 12 s. No main-thread task is longer than 100 ms. Takumi rendering sets the export time. In the prototype, encoding during rendering added 6% to 7% in Chrome, Chromium, and WebKit, and 17% in Firefox, so 1.25 times leaves room for noise. A median over it means that the encoder holds back rendering. The 12 s ceiling allows Takumi WASM in Chrome to be twice as slow as the 5.87 s that 180 frames at 32.6 ms take in Node.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 6, and 9 screenshots into `/tmp/codeimage-verification/a4-review-<slug>.png`. Add the `ffprobe` output of the Safari file.
- [ ] Record a 30 to 60 second video of exporting MP4, cancelling one export, and playing the result. Save it as `/tmp/codeimage-verification/a4-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends A4 to the stack and the operator lands it bottom-up.

## Export GIF from the web app (A5)

**Depends on.** A4.

**Decision.** GIF is the second web format, for READMEs, docs, and Markdown, where video does not autoplay. APNG stays in the CLI, and the web app does not offer it.

**Files.**

- [ ] Edit `apps/codeimage/src/workers/animation.worker.ts` and `apps/codeimage/src/hooks/use-export-animation.ts`.
- [ ] If the operator picks `gifenc`, create `apps/codeimage/src/core/gif/encode.ts` and add `gifenc` to `apps/codeimage/package.json`.
- [ ] Edit `apps/codeimage/src/pages/UnifiedEditor/shell/export.tsx` and `apps/codeimage/src/i18n/animation.ts`.
- [ ] Create `scripts/parity/animation-gif.ts`.

**Build.**

- [ ] Settle the GIF encoder with the operator before the build. The decision is open. Takumi 2.19 GIF output has palette and colour defects and holes, as Appendix C records. `gifenc`, under MIT, is the proposed alternative, and it takes the raw RGBA frames that A4 already renders. Write `animation-gif.ts` to encode the same frames both ways for the A1 edge cases and a 3 s clip. For each encoder it prints the diff against the raw frames, the file size, and the wall time. Post the table and stop for the operator's choice.
- [ ] With `gifenc`, build one palette for the whole clip from a sample of frames, so colours do not flicker between frames. Use one palette per frame only when the shared palette fails the diff.
- [ ] Cap fps at 50 for GIF. GIF stores frame delays in hundredths of a second, so it cannot hold 60 fps, and Takumi rejects it. When the dialog fps is 60, the GIF plays at 50 and the dialog says so.
- [ ] Add **GIF** after **MP4** in the format choice of the export dialog. **MP4** stays the default. When the support check disables MP4, the dialog selects GIF.
- [ ] Show the output size before the download, and suggest MP4 for long clips. The A5 owner proposes the length threshold with the encoder table.
- [ ] Ask the operator about animated WebP in the web app. The decision is open. The recommendation is to leave WebP out of the web UI and keep it in the CLI, which A2 already ships. MP4 covers social posts and slides, and GIF covers Markdown, so WebP adds a third choice without a use that the other two miss. If the operator keeps it, add it here as an advanced format and check the `quality` risk in Appendix C.

**You see.**

- [ ] Exporting a three-step project as GIF downloads a file that plays in Chrome and in macOS Preview, with no holes and the theme colours of the static export.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `use-export-animation.test.ts` asserts the 50 fps cap for GIF and that the dialog selects GIF when MP4 is unsupported. Run `pnpm --filter=@codeimage/app test`.
- [ ] With `gifenc`, `gif/encode.test.ts` asserts that the frame delays add up to the clip duration within one frame and that one palette covers the clip.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Export the same project as MP4 on trunk and head. Save `a5-mp4.png`. Pass when `ffprobe` reports the same codec, profile, colour tags, and frame count, and frames at the same times differ by at most 2%.
- [ ] Lane 2. Export three steps as GIF in Chrome. Save `a5-gif.png` with one frame per step. Pass when the file plays the three steps in order.
- [ ] Lane 3. Export the `edge-empty-to` case from A1 as GIF. Save `a5-edge.png`. Pass when no frame shows the raised tabs, the wrong traffic-light colours, or the dark stripes that the A1 verifier found.
- [ ] Lane 4. Export a project with a gradient background and a light theme. Save `a5-colours.png`. Pass when no pixel inside the frame is transparent and each endpoint frame differs from the static PNG export by at most 2%.
- [ ] Lane 5. Pick 60 fps and export GIF. Save `a5-fps.png`. Pass when the dialog says that GIF plays at 50 fps and the file plays at 50 fps.
- [ ] Lane 6. Export a 10 second clip at 1920 by 1080. Save `a5-size.png`. Pass when the dialog shows the size before the download and suggests MP4.
- [ ] Lane 7. Start a long GIF export and click **Cancel**. Save `a5-cancel.png`. Pass when no file downloads and the editor works.
- [ ] Lane 8. Make `VideoEncoder.isConfigSupported` resolve `{supported: false}` and open the dialog. Save `a5-no-mp4.png`. Pass when GIF is selected, MP4 is disabled with its reason, and the GIF export works.
- [ ] Lane 9. Export GIF in Firefox and WebKit through Playwright. Save `a5-browsers.png`. Pass when both files play. This lane needs the cross-browser setup in Appendix C. Until that setup exists, record the lane as not run.
- [ ] Lane 10. Compare the web GIF with the CLI APNG of the same project JSON. Save `a5-web-vs-cli.png`. Pass when frames at the same times differ by at most 2%.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure MP4 export wall time at trunk and head. On head, measure the GIF export wall time for a 3 second animation at 50 fps and 1920 by 1080 with about 200 tokens per step, and the longest main-thread task during that export.
- [ ] Probe. Ten interleaved MP4 exports on trunk and head in Chrome. Then ten GIF exports on head with a `PerformanceObserver` for `longtask`.
- [ ] Baseline. Record the trunk MP4 median first.
- [ ] Rule. The head MP4 median is at most 1.05 times trunk. The GIF median is at most 20 s. No main-thread task is longer than 100 ms. The prototype took 6.7 s for one second of Takumi WASM GIF in Node, so three seconds take about 20 s with that encoder. The operator may lower the budget when picking the encoder.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 3, and 8 screenshots into `/tmp/codeimage-verification/a5-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of exporting GIF, cancelling one export, and playing the result. Save it as `/tmp/codeimage-verification/a5-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends A5 to the stack and the operator lands it bottom-up.

## Export MP4 from the CLI (A6)

**Depends on.** A2 and A4.

**Files.**

- [ ] Create `packages/cli/src/video/ffmpeg.ts`.
- [ ] Create `packages/cli/src/video/download.ts` and `packages/cli/src/video/checksums.ts`.
- [ ] Edit `packages/cli/src/args.ts` and `packages/cli/src/bin.ts` to accept `.mp4` with `--animate` and to add the `install-ffmpeg` command.

**Build.**

- [ ] Pipe raw RGBA frames from Takumi into `ffmpeg -f rawvideo -pix_fmt rgba` with `libx264`, `yuv420p`, and `+faststart`.
- [ ] Encode the same stream as the web export. Pass `-profile:v high`, and set `-g` to twice the fps for a keyframe every 2 s. Convert and tag BT.709 limited range with `-vf scale=out_color_matrix=bt709:out_range=tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv`. Round the width and height up to even numbers, as A4 does.
- [ ] Resolve the ffmpeg binary in this order, and stop at the first hit. First the `--ffmpeg <path>` flag, then the `CODEIMAGE_FFMPEG` variable, then `ffmpeg` on `PATH`, then the CodeImage cache. When none exists, download it.
- [ ] Download the binary only on the first MP4 export, never at install time. Use the `ffmpeg-static` release assets on GitHub, release `b6.1.1`, file `ffmpeg-<platform>-<arch>.gz`. Do not add the `ffmpeg-static` npm package as a dependency. Its `install` script downloads about 20 to 30 MB for every user, and pnpm 10 and Bun skip dependency install scripts unless the user allows them, so the binary would be missing for them.
- [ ] Pin the release tag and the SHA-256 of each platform file in `checksums.ts`. Reject a download whose hash differs, and delete it.
- [ ] Store the binary in the user cache folder under `codeimage/ffmpeg/<release>/<platform>-<arch>/`. That is `~/Library/Caches` on macOS, `$XDG_CACHE_HOME` or `~/.cache` on Linux, and `%LOCALAPPDATA%` on Windows. The folder is outside `node_modules` and the `npx` cache, so CLI upgrades and `npx` runs reuse it. Download the `LICENSE` and `README` files of the same release next to the binary.
- [ ] Write the download to a temporary file in the same folder, then rename it into place. Two CLI runs at once then end with one complete binary.
- [ ] Print one line before the download with the size and the target folder. Show progress on a TTY only. When the download fails, exit with code 2 and name the four ways to provide ffmpeg.
- [ ] Add `codeimage install-ffmpeg`, which runs the same download and prints the binary path. CI jobs run it once and cache the folder.

**You see.**

- [ ] `codeimage a.ts b.ts --animate -o demo.mp4` writes an MP4. On a machine without ffmpeg, the first run prints `Downloading ffmpeg b6.1.1 (19 MB) to ~/Library/Caches/codeimage/ffmpeg/...` once, and the second run prints nothing about ffmpeg.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `video/ffmpeg.test.ts` asserts the ffmpeg arguments, including the profile, the keyframe interval, and the colour flags, and the resolution order. Run `pnpm --filter=@codeimage/cli test`.
- [ ] `video/download.test.ts` serves a fake release from a local HTTP server. It asserts that a good file lands in the cache, that a file with a wrong hash is deleted and fails, that a second call does not download again, and that two calls at once leave one complete binary.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run `codeimage a.ts b.ts --animate -o demo.webp` on trunk and head. Save `a6-webp.png`. Pass when frames at the same times differ by at most 0.5%.
- [ ] Lane 2. Run the CLI MP4 export with ffmpeg on `PATH`. Save `a6-cli.png`. Pass when the file plays and `ffprobe` reports H.264 High, `yuv420p` with BT.709 limited range, keyframes 2 s apart, and the `moov` box first.
- [ ] Lane 3. Run the CLI MP4 export three times with `PATH` lacking ffmpeg and an empty `XDG_CACHE_HOME`. The first run is online, the second is online, and the third is offline with a fresh cache folder. Save `a6-cli-download.png`. Pass when the first run downloads once and writes the MP4, the second run reuses the cache, and the third exits with code 2 and names the four ways to provide ffmpeg.
- [ ] Lane 4. Write three wrapper scripts that print their own name and then run ffmpeg. Put one on `PATH`, name one in `CODEIMAGE_FFMPEG`, and pass one with `--ffmpeg`. Remove them one at a time and export after each change. Save `a6-resolve.png`. Pass when every run uses the first hit of the resolution order.
- [ ] Lane 5. Run `codeimage install-ffmpeg` twice on an empty cache. Save `a6-install.png`. Pass when the first run downloads and prints the binary path, and the second prints the same path without a download.
- [ ] Lane 6. Start two MP4 exports at once on an empty cache. Save `a6-concurrent.png`. Pass when both write a playable MP4 and the cache holds one complete binary and no temporary file.
- [ ] Lane 7. Export a project with an odd frame width. Save `a6-odd-size.png`. Pass when the MP4 has an even width and no visible edge.
- [ ] Lane 8. Press Ctrl+C during an MP4 export. Save `a6-abort.png`. Pass when the CLI exits within one second, no ffmpeg process is left, and no partial MP4 is left.
- [ ] Lane 9. Press Ctrl+C during the ffmpeg download. Save `a6-abort-download.png`. Pass when the cache holds no partial binary and the next run downloads again.
- [ ] Lane 10. Compare the web MP4 and the CLI MP4 of the same project JSON. Save `a6-web-vs-cli.png`. Pass when frames at the same times differ by at most 2%.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure the CLI WebP export wall time at trunk and head. On head, measure the CLI MP4 export wall time for a 3 second animation at 60 fps and 1920 by 1080, with ffmpeg already in the cache.
- [ ] Probe. Ten interleaved cold WebP runs on trunk and head. Then ten cold MP4 runs on head.
- [ ] Baseline. Record the trunk WebP median first.
- [ ] Rule. The head WebP median is at most 1.05 times trunk. The CLI MP4 median is at most 6 s. The first download is not part of the budget. The prototype measured 8.6 ms per raw frame in native Takumi, before encoding.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 3, and 10 screenshots into `/tmp/codeimage-verification/a6-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of the first CLI MP4 export with its download, a second export, and both files playing. Save it as `/tmp/codeimage-verification/a6-review.mp4`.
- [ ] The operator confirms the GPL-3.0 handling of the ffmpeg binaries in Appendix C.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends A6 to the stack and the operator lands it bottom-up.

## Close the program

- [ ] Every box above is checked with its evidence.
- [ ] Reply to the operator with the report the execution playbook names.

## Appendix A. Prototype evidence

The prototypes ran on 2026-11-14 on a checkout of the P4 stack at `9c7301f5`, with the machine at a load average between 3.5 and 4.6. They use Takumi 2.19.0 and `@shikijs/magic-move` 4.6.0. The scripts and frames are in `docs/plans/prototypes/animation/`.

To run a script again, set `CODEIMAGE_ROOT` to a checkout that has `packages/render` with its dependencies installed, which means P3 or later. Without it, a script uses the repository that holds it. Set `OUT_DIR` to choose where the output goes. The default is the system temporary folder. `proto-c.mjs` also loads packages from `docs/plans/prototypes/anim-deps/node_modules`. Run `npm install --prefix docs/plans/prototypes/anim-deps @takumi-rs/wasm@2.19.0 @shikijs/magic-move@4.6.0` first, and do not commit that folder.

Takumi animates per-token keyframes. `proto-a.mjs` builds one scene with absolutely positioned token spans and one `@keyframes` rule per token. `frame-0.png` shows the first step, and `frame-14.png` shows tokens between their two places with removed tokens fading. `out-1x.webp` is the result.

Takumi native is faster than real time at 1080p. `proto-b.mjs` renders a 35-line pair with 191 and 212 tokens at 1920 by 1080. These are measured numbers.

| Output                   | Frames | Wall time        | Size    |
| ------------------------ | ------ | ---------------- | ------- |
| WebP, quality 85, 60 fps | 126    | 717 ms           | 4.8 MB  |
| GIF, 50 fps              | 126    | 2,755 ms         | 7.1 MB  |
| APNG, 60 fps             | 126    | 740 ms           | 17.6 MB |
| Raw RGBA per frame       | 55     | 8.6 ms per frame | none    |

Takumi WASM is about four times slower and still usable for export. `proto-c.mjs` runs the WASM build in Node, as a stand-in for the browser. One second at 60 fps took 2,648 ms as WebP and 6,719 ms as GIF. A raw frame took 32.6 ms. `wasm-mid.png` is a middle frame. Chrome speed is not measured yet.

`@shikijs/magic-move/core` works with tokens that do not come from Shiki. `proto-c.mjs` feeds it plain `{content, offset}` tokens. It kept 188 of the 212 visible tokens of the second step. The prototype tokens came from a regular expression, not from Lezer, so A1 confirms the match quality with real Lezer tokens.

Takumi animates layout size. `proto-d.mjs` animates a box from 300 by 120 to 700 by 400. `measure()` at 500 ms reports 500 by 260, so the window can grow between steps. `size-500.png` shows it.

The MP4 prototype ran on 2026-11-15 to answer whether every browser can encode MP4 and whether ffmpeg.wasm is usable. The machine was at a load average between 10 and 90 on 8 cores, so the timings are noisy, and the tables give medians. The scripts, the files, and the `ffprobe` logs stay in a scratch folder outside the repository. Per-run media never goes into the checkout, which ignores `docs/plans/media/`.

Every engine tested encodes H.264. Each cell comes from `VideoEncoder.isConfigSupported` and a real encode. `ffprobe` read every H.264 file as valid, with the `moov` box first.

| Browser                        | H.264                                               | HEVC         | VP9 and AV1                                                |
| ------------------------------ | --------------------------------------------------- | ------------ | ---------------------------------------------------------- |
| Chrome 157, branded            | Yes, with hardware encoding                         | Yes          | Software encoding                                          |
| Chromium 156, Playwright       | Yes                                                 | No           | Not checked                                                |
| Firefox 158, branded, macOS    | Yes                                                 | Not checked  | Not checked                                                |
| Firefox 144, Playwright, Linux | Yes                                                 | Not checked  | Not checked                                                |
| WebKit 27.2, Playwright        | Yes, Baseline unless the codec string asks for High | Yes          | VP9 dropped frames, with counts of 178 of 180 and 89 of 90 |
| Safari 27                      | Not measured                                        | Not measured | Not measured                                               |

Real Safari is missing because `safaridriver` could not start it.

Encoding alone is fast. These times encode 180 frames, 3 s at 1920 by 1080 and 60 fps.

| Browser                            | Encode time |
| ---------------------------------- | ----------- |
| Chrome 157, warm, n = 5            | 1,048 ms    |
| Chrome 157, first encode in a page | 4,054 ms    |
| Chromium 156                       | 829 ms      |
| WebKit 27.2                        | 905 ms      |
| Firefox                            | 1,841 ms    |

Rendering limits the export, not encoding. The end-to-end runs replaced Takumi with a 32.6 ms wait per frame, the raw frame time of Takumi WASM in Node, and encoded each frame while the next one rendered.

| Run          | Wall time | Added by encoding |
| ------------ | --------- | ----------------- |
| Render alone | 5.87 s    | none              |
| Chrome       | 6.29 s    | 7%                |
| Chromium     | 6.22 s    | 6%                |
| WebKit       | 6.29 s    | 7%                |
| Firefox      | 6.88 s    | 17%               |

The engines write different files from the same request. WebKit encodes Baseline unless the codec string asks for High. Chrome writes full range by default, which `ffprobe` reports as `yuvj420p`. Firefox ignores the requested bitrate and wrote 17.7 Mb/s where Chrome wrote 8.8 Mb/s, with a keyframe every 0.5 s.

ffmpeg.wasm writes valid MP4 and costs more than WebCodecs on each measure. Its core is GPL-2.0-or-later. It downloads 7.2 MB with brotli, 32 MB raw, and its x264 is built without SIMD. In Chrome it encoded the same 180 frames in 9.55 s on one thread and in 3.18 s on four threads, encode only. It cannot encode during rendering, because it needs every frame in memory first. As YUV 4:2:0 frames that is 560 MB for 3 s at 1080p60 and 1.87 GB for 10 s. The multi-thread core crashed at its default thread count in every engine and hung in Firefox in 2 of 3 runs. Threads need COOP and COEP cross-origin isolation. With `require-corp`, the production umami script is blocked. The Auth0 silent-auth iframe may break too, which is a guess that nobody checked. WebKit lacks `credentialless`, the gentler COEP mode. The output carries no colour tags.

The MIT `h264-mp4-encoder`, built on minih264, avoids the GPL and fails the output checks. It encodes Baseline only, makes every frame a keyframe, writes no faststart, and writes untagged full range, which shifted the colours.

X asks for H.264. The X API media best practices at https://docs.x.com/x-api/media/quickstart/best-practices ask for H.264 High, at most 60 fps, YUV 4:2:0, and at most 1280 by 1024 for API uploads. They do not mention WebM. The 1280 by 1024 limit is for API uploads. Whether the X web upload takes 1080p was not checked. LinkedIn lists WebM as supported at https://www.linkedin.com/help/linkedin/answer/a548372. Instagram and Bluesky were not checked.

These questions stay unproven.

- Whether the browser and Takumi agree on every frame of the same keyframes. A3 gates it with `animation-preview.ts`.
- How fast Takumi WASM is in Chrome, Firefox, and Safari. The MP4 prototype simulated the frame time. A4 measures it.
- Whether real Safari 27 encodes like Playwright WebKit 27.2. A4 checks it by hand before it ships.
- Whether `gifenc` gives better GIFs than Takumi. A5 measures it.
- Whether Instagram and Bluesky accept the MP4 without re-encoding problems.
- Whether fallback fonts wider than one cell break the column math. Lane 7 of A1 records it.

## Appendix B. Alternatives rejected

Remotion renders through headless Chrome and React. Its license charges companies and products that render for users, and CodeImage is Solid, so it would add a second UI stack.

Motion Canvas and Revideo own their scene runtime and draw on a browser canvas. Revideo renders in Node only through a headless browser. Both would replace the static view instead of reusing it.

Code Hike is React-only and animates the DOM with the Web Animations API, so it gives no frames for export.

The `shiki-magic-move` renderer is DOM-only. It reads positions with `getBoundingClientRect` and animates with CSS transitions. The plan keeps its core for keys and drops its renderer, because export needs positions as data.

The plan does not add Shiki and keeps CodeMirror. `@shikijs/magic-move` comes from the Shiki team, but its `core` entry imports only `diff-match-patch-es` and `ohash`, and `shiki` is an optional peer dependency. Installing the package in the prototype added no `shiki` package. CodeMirror stays the editor, and Lezer stays the highlighter. `tokenizeCode` produces the same tokens and classes for the static export and for the animation, which is why the endpoint parity rule can hold. Copying the matching code instead of depending on the package was weighed and rejected. The core is 8 KB under MIT, but a copy would leave CodeImage to track upstream fixes by hand.

A JavaScript tween that writes a style per frame was the runner-up for the timeline. One `@keyframes` stylesheet wins, because the browser plays it for the preview and Takumi samples it for export. One source drives both.

Recording the DOM preview with `MediaRecorder` or screenshots gives frames at the speed of the screen, drops frames under load, and cannot run in the CLI.

The `ffmpeg-static` npm package was rejected as a dependency of the CLI, and its binaries were kept. The package downloads the binary in an `install` script. Every user would download 20 to 30 MB even without making a video, and pnpm 10 and Bun skip that script by default, so those users would have no binary. An optional peer dependency fails for `npx` and global installs, because the CLI cannot import a package the user installed elsewhere. Downloading the same release files on the first MP4 export follows the Playwright and Puppeteer browser downloads. It costs nothing for users who never export MP4, and the cache survives CLI upgrades.

The operator ruled out server-side export on 2026-11-15. The browser renders and encodes a 3 s 1080p60 clip in about 6.3 s in the prototype, so a server adds an upload, a queue, and CPU cost per export without a speed gain, and the code leaves the user's device.

ffmpeg.wasm was rejected for the web export. Appendix A has the numbers. Its GPL-2.0-or-later core, the 7.2 MB download, and the encode that waits for every frame in memory each cost more than WebCodecs. Its threads need cross-origin isolation, which blocks the umami script and may break the Auth0 iframe, and its multi-thread core crashed at the default thread count. WebCodecs with Mediabunny, under MPL-2.0, encodes during rendering in every engine tested.

The MIT `h264-mp4-encoder` was rejected because it writes Baseline only, a keyframe on every frame, no faststart, and untagged full range.

A WebM fallback for browsers without H.264 was rejected. X's media docs ask for H.264 and do not mention WebM, and WebKit's VP9 encoder dropped frames. Every engine tested encodes H.264, so a browser that fails the support check gets a one-line reason and GIF instead.

Takumi writes WebP and APNG, so `sharp` is not needed. `gifenc` was rejected for the same reason, and A5 reopens it because Takumi's GIF output has defects.

## Appendix C. Risks

- Browser and Takumi may disagree on easing or on transforms at fractional pixels. A3 owns `animation-preview.ts`. If a time fails, round translations to device pixels in `compileScene`.
- Fallback fonts for CJK and emoji are wider than one cell, so column math puts later tokens in the wrong place. A1 lane 7 records it. If the endpoint diff fails, measure the runs of the affected lines with `measure()` instead of using columns.
- Lezer splits tokens differently from Shiki, for example around punctuation. Matching may move fewer tokens than the magic-move demos. A1 `pair.test.ts` holds real cases.
- Takumi WASM may be too slow in Safari. A4 measures it by hand. If the 12 s budget fails, render at 30 fps by default in that browser.
- Real Safari 27 is unverified. The prototype measured Playwright WebKit 27.2, and `safaridriver` could not start Safari. A4 exports once in Safari by hand and checks the file with `ffprobe` before it ships.
- Chrome encodes full range by default. Without the BT.709 limited-range colour space on each `VideoFrame`, the file is `yuvj420p`, and a platform that re-encodes it can shift the colours. A4 sets the colour space, and A4 lane 2 checks the tags.
- Firefox ignores the requested bitrate. It wrote 17.7 Mb/s where Chrome wrote 8.8 Mb/s, with a keyframe every 0.5 s, so Firefox files are about twice as large and the size shown in the dialog is low there. A4 lane 9 records the bitrate.
- With WebCodecs, the browser or the OS encodes H.264, so the patent licence is theirs and not CodeImage's. This is a guess, and nobody has checked it.
- The Firefox and WebKit lanes of A4 and A5 need the cross-browser setup that the operator wants built later. Playwright installs of both browsers stall on the operator's Mac. Until the setup exists, those lanes are recorded as not run, and the Safari check by hand is the only evidence outside Chrome.
- Takumi 2.19 GIF output leaves ghost pixels when the frame shrinks. The A1 verifier found two raised tabs, wrong traffic-light colors, and dark stripes in the last frame of `edge-empty-to.gif`, and macOS ImageIO decodes the same bytes, so the defect is in the encoder. The operator also reports palette and colour defects and holes in Takumi's GIF output. A2 reproduces it for the CLI, checks a newer Takumi, and otherwise renders GIF at a fixed frame size or reports it upstream before it offers GIF. A5 measures `gifenc` against it, and the operator picks the web encoder.
- GIF files are large at 1080p. A5 shows the output size before the download, and the dialog suggests MP4 for long clips.
- A dimmed row that also has a line mark draws its glyphs 1 to 3 levels of 255 lighter than the static export, because the mark and the tokens fade as separate boxes. The operator chose to fix it in a small follow-up PR after A1 merges, with one box per row. The A1 row-paint check allows these rows 0.5 levels until then.
- A rescaling window in a target frame is exact only at its 200 keyframe stops. Between stops it strays from the eased path by 0.02 to 0.06 px when the code doubles, and by up to 1.8 px when it grows ten times. The A1 verdict at `c01b70e1` rated it non-blocking. The same follow-up PR places the stops on the export frame times, which A2 knows from `fps`. It also samples the window check between stops and cuts the vertical layout tolerance from 0.5 px to 0.05 px, which every A1 case already meets.
- Animated WebP is lossless by default in Takumi WASM. This matters only if the operator keeps WebP in the web app. A5 then checks whether `quality` is honored, and otherwise shows the larger size.
- The ffmpeg download depends on the `eugeneware/ffmpeg-static` GitHub releases. A6 pins the tag and the SHA-256 of each file, so a changed file fails instead of running. If the release disappears, the four other ways to provide ffmpeg still work. Moving the files to a CodeImage release is the fallback.
- The ffmpeg binaries are GPL-3.0. The CLI does not ship them in its npm package and downloads their `LICENSE` and `README` next to the binary. The operator confirms this before A6 merges.
- The `@keyframes` count grows with tokens. A 300-line step makes a large stylesheet. A1 perf measures compile time, and A4 measures the stylesheet's effect on render time.

## Appendix D. Links and reading list

Read these before editing.

- `docs/plans/2026-cli-and-renderer/plan.md` for P1, P2, P3, P4, P5, and P8.
- `apps/codeimage/src/core/snapshot/tokenize.ts`, `apps/codeimage/src/components/CustomEditor/StaticCodeView.tsx`, and `apps/codeimage/src/components/CustomEditor/staticTheme.ts` for tokens and layout.
- `packages/render/src/render.ts` for font registration and the Takumi options.
- The Takumi animation docs at https://github.com/kane50613/takumi/blob/master/docs/content/docs/animation.mdx and the ffmpeg example at https://github.com/kane50613/takumi/tree/master/example/ffmpeg-keyframe-animation.
- The magic-move core in `@shikijs/magic-move/dist/core.mjs`, for `toKeyedTokens` and `syncTokenKeys`.
- Mediabunny formats and codecs at https://mediabunny.dev/guide/supported-formats-and-codecs.
- `docs/plans/2026-animate-new-ui.md` on `feat/animate-new-ui`, the plan of #736, for the Animate panel and the section on where A4 plugs in.
- The X API media best practices at https://docs.x.com/x-api/media/quickstart/best-practices and the LinkedIn video specs at https://www.linkedin.com/help/linkedin/answer/a548372.
- `gifenc` at https://github.com/mattdesl/gifenc.
- The memory note on Takumi parity quirks, for the Chrome reference setup.

A1 and A3 get `~/.claude/skills/how/SKILL.md` before the build. A1 gets `~/.claude/skills/interrogate/SKILL.md` on the token-pairing design. Keep the decision trail per `~/.claude/skills/show-me-your-work/SKILL.md`.
