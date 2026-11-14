# CodeImage code animation plan

CodeImage gets animated exports. A user puts code steps in tabs, and CodeImage animates from one tab to the next. Tokens that stay slide to their new place, removed tokens fade out, and new tokens fade in. The output is an animated WebP, GIF, APNG, or MP4, from the web app and from the CLI.
The program builds on what P1 to P4 already ship. The tabs are the steps. The Lezer tokens from `tokenizeCode` are the tokens. `@shikijs/magic-move/core` pairs tokens between steps. One CSS stylesheet with a `@keyframes` rule per token is the timeline. Takumi renders it, natively in Node and as WASM in the browser, and the browser plays the same CSS for the live preview.
The rule the program enforces is endpoint parity. The first frame of a transition matches the static export of the step it leaves, and the last frame matches the static export of the step it reaches, within 0.5% of pixels at pixelmatch threshold 0.1.
PR ids in order are A1, A2, A3, A4, A5.

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how-to. The appendices explain and record.

The program runs `~/.claude/skills/poteto-mode/playbooks/autopilot-stack.md`. The operator, Riccardo, lands every PR. Every PR id stops at merge-ready and waits for the operator.

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] State the protocol and this plan to the operator, then stop. Start execution only on the operator's explicit go.
- [ ] Confirm that P1, P3, and P4 of `docs/plans/2026-cli-and-renderer.md` are merged, or base A1 on the stack tip that holds them. A4 also needs P2.
- [ ] Read these at program start. Re-read them at every tick.
  - [ ] `~/.claude/skills/poteto-mode/playbooks/autopilot-stack.md`
  - [ ] `~/.claude/skills/swarm/SKILL.md`
  - [ ] `~/.claude/skills/poteto-mode/playbooks/opening-a-pr.md`
  - [ ] `~/.claude/skills/poteto-mode/playbooks/visual-parity.md` for A1, A2, and A4.
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
  - [ ] A4 after A3 and P2.
  - [ ] A5 after A2 and A4.
- [ ] Hold the file boundaries.
  - [ ] A1 touches only `apps/codeimage/src/core/animation/**`, `apps/codeimage/src/components/CustomEditor/AnimatedCodeView.tsx`, `apps/codeimage/src/render/entry-server.tsx`, `apps/codeimage/package.json`, and `scripts/parity/animation-*.ts`.
  - [ ] A2 touches only `packages/render/**`, `packages/cli/src/args.ts`, `packages/cli/src/bin.ts`, and `packages/cli/src/flags/animate.ts`.
  - [ ] A3 touches only `apps/codeimage/src/state/editor/**`, `apps/codeimage/src/components/Animation/**`, `apps/codeimage/src/components/Frame/PreviewFrame.tsx`, the editor page layout under `apps/codeimage/src/pages/Editor/**`, `apps/api/prisma/**`, `apps/api/src/**` for the new field, `packages/locale/**`, and `scripts/parity/animation-*.ts`.
  - [ ] A4 touches only `apps/codeimage/src/core/rasterize/**`, `apps/codeimage/src/hooks/use-export-animation.ts`, `apps/codeimage/src/workers/animation.worker.ts`, and `apps/codeimage/src/components/Toolbar/Export*.tsx`.
  - [ ] A5 touches only `apps/codeimage/src/core/video/**`, `apps/codeimage/src/hooks/use-export-animation.ts`, `apps/codeimage/src/components/Toolbar/Export*.tsx`, and `packages/cli/src/video/**`.
- [ ] Hold the review gate. A2, A3, A4, and A5 change an interaction. They wait for the operator's review in chat with screenshots and a video before merge.

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
- [ ] Treat line numbers as tokens with a `gutter:` key prefix, so a number slides when lines are inserted above it.
- [ ] Treat each P5 line mark as an element keyed by `mark:<kind>:<text of the line>`. A mark that both steps keep moves with its line. Other marks fade.
- [ ] In `compile.ts`, write `compileScene(transitions, metrics, timing): {html: string; css: string}`. `metrics` is `{charWidth: number; lineHeight: number; origin: {x: number; y: number}}`. Each token is a `position: absolute` span at its `to` cell, or at its `from` cell for a `leave`. Each `move` gets a `@keyframes` rule from `translate(dx, dy)` to `translate(0, 0)`. `leave` fades out in the first 30% of the transition, and `enter` fades in during the last 30%. These are the magic-move defaults of 0.3 and 0.7.
- [ ] Measure `charWidth` once per font and size with Takumi `measure()` on a 40-character run, as `docs/plans/prototypes/animation/proto-a.mjs` does. In the browser, measure the same run with a DOM range. Never measure each token.
- [ ] Animate the code box `width` and `height` between the two steps' sizes in the same stylesheet. The video size is the largest frame over all steps, and the frame stays centered.
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
- [ ] Lane 4. Run the endpoint script with line numbers on and a pair that inserts lines at the top. Save `a1-gutter.png`. Pass when the middle frame shows line numbers between their two places and no number is drawn twice.
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

- [ ] Copy lane 2, 5, and 7 screenshots into `docs/plans/media/a2-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of the CLI rendering a three-step animation and of the result playing in Chrome. Save it as `docs/plans/media/a2-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends A2 to the stack and the operator lands it bottom-up.

## Preview and edit the animation in the editor (A3)

**Depends on.** A1.

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

- [ ] Copy lane 2, 3, and 10 screenshots into `docs/plans/media/a3-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of making three tabs, reordering them, changing the timing, playing, and scrubbing. Save it as `docs/plans/media/a3-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends A3 to the stack and the operator lands it bottom-up.

## Export animated WebP and GIF from the web app (A4)

**Depends on.** A3 and P2.

**Files.**

- [ ] Create `apps/codeimage/src/workers/animation.worker.ts`.
- [ ] Create `apps/codeimage/src/hooks/use-export-animation.ts`.
- [ ] Edit `apps/codeimage/src/core/rasterize/takumi.ts` to share font and stylesheet collection with the worker.
- [ ] Edit `apps/codeimage/src/components/Toolbar/ExportContent.tsx` and `ExportButton.tsx`.

**Build.**

- [ ] Run Takumi WASM `prepareAnimation` and `renderAnimation` in a module worker, so the editor stays responsive. Send the scenes, the stylesheet, and the font bytes that P2 already collects.
- [ ] Add **WebP**, **GIF**, and **APNG** to the export dialog when the project has more than one step. Show the output size, the duration, and a progress bar fed by the worker. **Cancel** terminates the worker.
- [ ] When the WASM module fails to load, show an error that names the cause. There is no dom-export fallback for animation.
- [ ] Download the file through the same code as image export, and share it on mobile when the browser can share files.

**You see.**

- [ ] Exporting a three-step project as WebP shows progress and downloads a file that plays in the browser.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `use-export-animation.test.ts` asserts that cancel terminates the worker and that a worker error reaches the UI as a message. Run `pnpm --filter=@codeimage/app test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Export the same project as PNG on trunk and head. Save `a4-png.png`. Pass when the PNGs differ by at most 0.5%.
- [ ] Lane 2. Export three steps as WebP in Chrome. Save `a4-webp.png` with one frame per step. Pass when the file plays the three steps in order.
- [ ] Lane 3. Compare the web WebP with the CLI WebP of the same project JSON. Save `a4-web-vs-cli.png`. Pass when frames at the same times differ by at most 0.5%.
- [ ] Lane 4. Export as GIF and as APNG. Save `a4-gif-apng.png`. Pass when both files play.
- [ ] Lane 5. Start a long export and click **Cancel**. Save `a4-cancel.png`. Pass when the progress stops, no file downloads, and the editor works.
- [ ] Lane 6. Type in the editor during an export. Save `a4-responsive.png`. Pass when the typed characters appear without a visible stall.
- [ ] Lane 7. Block the WASM URL in Playwright and export. Save `a4-wasm-error.png`. Pass when the dialog names the error and the app keeps working.
- [ ] Lane 8. Export in Chrome, Firefox, and WebKit. Save `a4-browsers.png`. Pass when all three produce a file that plays.
- [ ] Lane 9. Export with a local system font from Local Font Access. Save `a4-local-font.png`. Pass when the frames use that font.
- [ ] Lane 10. Export on a 390 by 844 viewport with share available. Save `a4-share.png`. Pass when the share sheet receives the file.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure PNG export wall time at trunk and head. On head, measure the WebP export wall time for a 3 second animation at 60 fps and 1920 by 1080 with about 200 tokens per step, and the longest main-thread task during that export.
- [ ] Probe. Ten interleaved PNG exports on trunk and head in Chrome. Then ten WebP exports on head with a `PerformanceObserver` for `longtask`.
- [ ] Baseline. Record the trunk PNG median first.
- [ ] Rule. The head PNG median is at most 1.05 times trunk. The WebP median is at most 12 s. No main-thread task is longer than 100 ms. The prototype measured 2.6 s for 1 s of WebP with Takumi WASM in Node, so 3 s should take about 8 s.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 5, and 8 screenshots into `docs/plans/media/a4-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of exporting WebP and GIF, cancelling one export, and playing the result. Save it as `docs/plans/media/a4-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends A4 to the stack and the operator lands it bottom-up.

## Export MP4 from the web app and the CLI (A5)

**Depends on.** A2 and A4.

**Files.**

- [ ] Create `apps/codeimage/src/core/video/encode.ts`.
- [ ] Edit `apps/codeimage/package.json` to add `mediabunny`.
- [ ] Edit `apps/codeimage/src/workers/animation.worker.ts` and `apps/codeimage/src/hooks/use-export-animation.ts`.
- [ ] Edit `apps/codeimage/src/components/Toolbar/ExportContent.tsx`.
- [ ] Create `packages/cli/src/video/ffmpeg.ts`.

**Build.**

- [ ] In the worker, render each frame with Takumi `render({timeMs, format: 'raw'})` and pass the RGBA pixels to a WebCodecs `VideoFrame`. Encode with Mediabunny to MP4 with H.264. When `canEncode` rejects H.264, fall back to WebM with VP9 and say so in the dialog.
- [ ] Round the video width and height up to even numbers, because H.264 rejects odd sizes. Fill the added pixel with the frame background.
- [ ] Hide **MP4** in browsers without `VideoEncoder` and say why in a tooltip.
- [ ] In the CLI, find `ffmpeg` on `PATH`. Pipe raw RGBA frames from Takumi into `ffmpeg -f rawvideo -pix_fmt rgba` with `libx264`, `yuv420p`, and `+faststart`. Without `ffmpeg`, exit with code 2 and print how to install it. Do not bundle ffmpeg, because `ffmpeg-static` is GPL-3.0.

**You see.**

- [ ] Exporting a three-step project as MP4 in Chrome downloads a file that plays in QuickTime.
- [ ] `codeimage a.ts b.ts --animate -o demo.mp4` writes an MP4 when ffmpeg is installed.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `encode.test.ts` asserts the even-size rounding and the codec fallback order. Run `pnpm --filter=@codeimage/app test`.
- [ ] `video/ffmpeg.test.ts` asserts the ffmpeg arguments and the error when ffmpeg is missing. Run `pnpm --filter=@codeimage/cli test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Export the same project as WebP on trunk and head. Save `a5-webp.png`. Pass when frames at the same times differ by at most 0.5%.
- [ ] Lane 2. Export MP4 in Chrome. Save `a5-chrome.png`. Pass when `ffprobe` reports H.264, the expected duration, and the expected frame rate.
- [ ] Lane 3. Export MP4 in Firefox and WebKit. Save `a5-browsers.png`. Pass when each browser writes MP4 or, where H.264 is missing, WebM with the dialog note.
- [ ] Lane 4. Compare MP4 frames with the WebP frames of the same project. Save `a5-mp4-vs-webp.png`. Pass when the frames differ by at most 2%, which leaves room for H.264 compression.
- [ ] Lane 5. Export a project with an odd frame width. Save `a5-odd-size.png`. Pass when the MP4 has an even width and no visible edge.
- [ ] Lane 6. Upload the MP4 to a local `<video>` element and play it to the end. Save `a5-video-tag.png`. Pass when it plays without stalling.
- [ ] Lane 7. Run the CLI MP4 export with ffmpeg installed. Save `a5-cli.png`. Pass when the file plays and `ffprobe` shows `yuv420p`.
- [ ] Lane 8. Run the CLI MP4 export with `PATH` lacking ffmpeg. Save `a5-cli-missing.png`. Pass when the CLI exits with code 2 and prints the install hint.
- [ ] Lane 9. Cancel an MP4 export in the browser. Save `a5-cancel.png`. Pass when no file downloads and the editor works.
- [ ] Lane 10. Compare the web MP4 and the CLI MP4 of the same project JSON. Save `a5-web-vs-cli.png`. Pass when frames at the same times differ by at most 2%.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Measure WebP export wall time at trunk and head. On head, measure MP4 export wall time for a 3 second animation at 60 fps and 1920 by 1080 in Chrome and in the CLI.
- [ ] Probe. Ten interleaved WebP exports on trunk and head. Then ten MP4 exports on head in each place.
- [ ] Baseline. Record the trunk WebP median first.
- [ ] Rule. The head WebP median is at most 1.05 times trunk. The browser MP4 median is at most 15 s and the CLI MP4 median is at most 6 s. The prototype measured 32.6 ms per raw frame in Takumi WASM and 8.6 ms in native Takumi, before encoding.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 3, and 7 screenshots into `docs/plans/media/a5-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of exporting MP4 in the browser and from the CLI, and of playing both files. Save it as `docs/plans/media/a5-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends A5 to the stack and the operator lands it bottom-up.

## Close the program

- [ ] Every box above is checked with its evidence.
- [ ] Reply to the operator with the report the execution playbook names.

## Appendix A. Prototype evidence

The prototypes ran on 2026-11-14 on branch `plan/code-animation`, based on `9c7301f5`, with the machine at a load average between 3.5 and 4.6. They use Takumi 2.19.0 and `@shikijs/magic-move` 4.6.0. The scripts and frames are in `docs/plans/prototypes/animation/`. `proto-c.mjs` loads its packages from a scratch `anim-deps/node_modules` folder next to it. Run `npm install --prefix <folder>/anim-deps @takumi-rs/wasm@2.19.0 @shikijs/magic-move@4.6.0` first.

Takumi animates per-token keyframes. `proto-a.mjs` builds one scene with absolutely positioned token spans and one `@keyframes` rule per token. `frame-0.png` shows the first step, and `frame-14.png` shows tokens between their two places with removed tokens fading. `out-1x.webp` is the result.

Takumi native is faster than real time at 1080p. `proto-b.mjs` renders a 35-line pair with 191 and 212 tokens at 1920 by 1080. These are measured numbers.

| Output | Frames | Wall time | Size |
|---|---|---|---|
| WebP, quality 85, 60 fps | 126 | 717 ms | 4.8 MB |
| GIF, 50 fps | 126 | 2,755 ms | 7.1 MB |
| APNG, 60 fps | 126 | 740 ms | 17.6 MB |
| Raw RGBA per frame | 55 | 8.6 ms per frame | none |

Takumi WASM is about four times slower and still usable for export. `proto-c.mjs` runs the WASM build in Node, as a stand-in for the browser. One second at 60 fps took 2,648 ms as WebP and 6,719 ms as GIF. A raw frame took 32.6 ms. `wasm-mid.png` is a middle frame. Chrome speed is not measured yet.

`@shikijs/magic-move/core` works with tokens that do not come from Shiki. `proto-c.mjs` feeds it plain `{content, offset}` tokens. It kept 188 of the 212 visible tokens of the second step. The prototype tokens came from a regular expression, not from Lezer, so A1 confirms the match quality with real Lezer tokens.

Takumi animates layout size. `proto-d.mjs` animates a box from 300 by 120 to 700 by 400. `measure()` at 500 ms reports 500 by 260, so the window can grow between steps. `size-500.png` shows it.

These questions stay unproven.

- Whether the browser and Takumi agree on every frame of the same keyframes. A3 gates it with `animation-preview.ts`.
- How fast Takumi WASM is in Chrome, Firefox, and Safari. A4 measures it.
- How fast Mediabunny encodes 1080p H.264 in each browser. A5 measures it.
- Whether fallback fonts wider than one cell break the column math. Lane 7 of A1 records it.

## Appendix B. Alternatives rejected

Remotion renders through headless Chrome and React. Its license charges companies and products that render for users, and CodeImage is Solid, so it would add a second UI stack.

Motion Canvas and Revideo own their scene runtime and draw on a browser canvas. Revideo renders in Node only through a headless browser. Both would replace the static view instead of reusing it.

Code Hike is React-only and animates the DOM with the Web Animations API, so it gives no frames for export.

The `shiki-magic-move` renderer is DOM-only. It reads positions with `getBoundingClientRect` and animates with CSS transitions. The plan keeps its core for keys and drops its renderer, because export needs positions as data.

The plan does not add Shiki and keeps CodeMirror. `@shikijs/magic-move` comes from the Shiki team, but its `core` entry imports only `diff-match-patch-es` and `ohash`, and `shiki` is an optional peer dependency. Installing the package in the prototype added no `shiki` package. CodeMirror stays the editor, and Lezer stays the highlighter. `tokenizeCode` produces the same tokens and classes for the static export and for the animation, which is why the endpoint parity rule can hold. Copying the matching code instead of depending on the package was weighed and rejected. The core is 8 KB under MIT, but a copy would leave CodeImage to track upstream fixes by hand.

A JavaScript tween that writes a style per frame was the runner-up for the timeline. One `@keyframes` stylesheet wins, because the browser plays it for the preview and Takumi samples it for export. One source drives both.

Recording the DOM preview with `MediaRecorder` or screenshots gives frames at the speed of the screen, drops frames under load, and cannot run in the CLI.

ffmpeg.wasm weighs about 65 MB and its core is GPL-2.0. Mediabunny with WebCodecs is the maintained MP4 muxer, and its license is MPL-2.0.

Takumi already writes WebP, GIF, and APNG, so `gifenc` and `sharp` are not needed.

## Appendix C. Risks

- Browser and Takumi may disagree on easing or on transforms at fractional pixels. A3 owns `animation-preview.ts`. If a time fails, round translations to device pixels in `compileScene`.
- Fallback fonts for CJK and emoji are wider than one cell, so column math puts later tokens in the wrong place. A1 lane 7 records it. If the endpoint diff fails, measure the runs of the affected lines with `measure()` instead of using columns.
- Lezer splits tokens differently from Shiki, for example around punctuation. Matching may move fewer tokens than the magic-move demos. A1 `pair.test.ts` holds real cases.
- Takumi WASM may be too slow in Safari. A4 measures it. If the 12 s budget fails, render at 30 fps by default in that browser.
- WebCodecs H.264 support varies by browser and platform. A5 falls back to WebM with VP9 and hides MP4 when there is no `VideoEncoder`.
- GIF files are large at 1080p. A4 shows the output size before the download, and the dialog suggests WebP or MP4 for long clips.
- Animated WebP is lossless by default in Takumi WASM. A4 checks whether `quality` is honored, and otherwise shows the larger size.
- The `@keyframes` count grows with tokens. A 300-line step makes a large stylesheet. A1 perf measures compile time, and A4 measures the stylesheet's effect on render time.

## Appendix D. Links and reading list

Read these before editing.

- `docs/plans/2026-cli-and-renderer.md` for P1, P2, P3, P4, P5, and P8.
- `apps/codeimage/src/core/snapshot/tokenize.ts`, `apps/codeimage/src/components/CustomEditor/StaticCodeView.tsx`, and `apps/codeimage/src/components/CustomEditor/staticTheme.ts` for tokens and layout.
- `packages/render/src/render.ts` for font registration and the Takumi options.
- The Takumi animation docs at https://github.com/kane50613/takumi/blob/master/docs/content/docs/animation.mdx and the ffmpeg example at https://github.com/kane50613/takumi/tree/master/example/ffmpeg-keyframe-animation.
- The magic-move core in `@shikijs/magic-move/dist/core.mjs`, for `toKeyedTokens` and `syncTokenKeys`.
- Mediabunny formats and codecs at https://mediabunny.dev/guide/supported-formats-and-codecs.
- The memory note on Takumi parity quirks, for the Chrome reference setup.

A1 and A3 get `~/.claude/skills/how/SKILL.md` before the build. A1 gets `~/.claude/skills/interrogate/SKILL.md` on the token-pairing design. Keep the decision trail per `~/.claude/skills/show-me-your-work/SKILL.md`.
