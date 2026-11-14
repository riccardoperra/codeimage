# CodeImage CLI, shared renderer, and line marks plan

CodeImage gets a command-line tool that renders the same image the web app exports. Both read one serializable snapshot (`ProjectEditorPersistedState`) and draw it with one static view. The CLI rasterizes that view with Takumi, a Rust renderer, so it needs no browser.
The rule the program enforces is parity. For any snapshot, the CLI output and the web export differ by at most 0.5% of pixels at pixelmatch threshold 0.1.
The static view also replaces the hidden second CodeMirror editor, which is the core problem in discussion #619.
The web app can rasterize with Takumi WASM too, behind a renderer flag that defaults to the current `dom-export` path.
On top of that base the program adds line marks (diff, highlight, focus), secret redaction, social sizes with a signature, one image per tab, and alt text.
PR ids in order are P1, P2, P3, P4, P5, P6, P7, P8, P9, P10. P10 brings the new editor's window styles and signature to the CLI.

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how-to. The appendices explain and record.

The program runs `~/.claude/skills/poteto-mode/playbooks/autopilot-stack.md`. The operator, Riccardo, lands every PR. Every PR id stops at merge-ready and waits for the operator.

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] State the protocol and this plan to the operator, then stop. Start execution only on the operator's explicit go.
- [ ] Read these at program start. Re-read them at every tick.
  - [ ] `~/.claude/skills/poteto-mode/playbooks/autopilot-stack.md`
  - [ ] `~/.claude/skills/swarm/SKILL.md`
  - [ ] `~/.claude/skills/poteto-mode/playbooks/opening-a-pr.md`
  - [ ] `~/.claude/skills/poteto-mode/playbooks/visual-parity.md` for P1, P2, and P3.
  - [ ] `git show origin/main:docs/plans/2026-cli-and-renderer/plan.md` once this plan is on trunk.
  - [ ] `git show origin/main:apps/codeimage/src/state/editor/model.ts`
  - [ ] `git show origin/main:apps/api/prisma/schema.prisma`
- [ ] On the operator's go, arm the audit tick as `/loop 1h` with the tick prompt below. Never leave the cadence to memory.
- [ ] Use this tick prompt, verbatim. "Re-read the execution playbook from trunk. Audit the operation against it and fix drift in this tick. Probe every active lane and judge progress by side effects only. Stand down a stuck lane and dispatch its replacement now. Then post a short status message to the operator in chat only when the audit found a tracked change that no earlier status message reported, such as a PR opened, a code-ready head, a round launched or closed, a verdict, a merge, a stuck agent and the action taken, a blocker added or cleared, or a decision only the operator can make. Name every such change and nothing else. Do not repeat a table, the merged list, or an unchanged blocker. If the audit found none, end the turn with no reply text. Either way, log this tick's row in your decision trail. The row names the items reported, or none."
- [ ] On the operator's hold or stand-down, send every owner a zero-writes order at once.

### Spawn owners

- [ ] Spawn one owner per PR with the full lifecycle the execution playbook names.
- [ ] Follow this dependency graph. Start dependent work only after its parent merges, or base it on the parent branch when the execution playbook stacks.
  - [ ] P1 is first. It branches from `main`.
  - [ ] P2 after P1.
  - [ ] P3 after P1. P2 and P3 are independent of each other.
  - [ ] P4 after P3.
  - [ ] P5, P6, and P7 after P4. They are independent of each other.
  - [ ] P8 after P2 and P4, because both P2 and P8 edit `use-export-image.ts`.
  - [ ] P9 after P4.
- [ ] Hold the file boundaries.
  - [ ] P1 touches only `apps/codeimage/src/components/CustomEditor/**`, `apps/codeimage/src/components/Frame/PreviewFrame.tsx`, `apps/codeimage/src/core/snapshot/**`, and `scripts/parity/**`.
  - [ ] P2 touches only `apps/codeimage/src/core/rasterize/**`, `apps/codeimage/src/hooks/use-export-image.ts`, `apps/codeimage/src/state/editor/config.store.ts`, `apps/codeimage/src/components/Toolbar/SettingsDialog.tsx`, the tab title and watermark components under `apps/codeimage/src/components/Terminal/**` and `apps/codeimage/src/components/Icons/**`, and `scripts/parity/**`.
  - [ ] P3 touches only `apps/codeimage/src/render/**`, `apps/codeimage/vite.config.ts`, `packages/render/**`, and `scripts/parity/**`.
  - [ ] P4 touches only `packages/cli/**` and the preset menu in `apps/codeimage/src/components/Presets/**`.
  - [ ] P5 to P9 touch their own feature folders plus `packages/cli/src/flags/**`. Each PR adds one flag file there, so the flag files never conflict. P6 also creates `packages/secrets/**`.
- [ ] Hold the review gate. P2, P4, P5, P6, P7, P8, and P9 change an interaction. They wait for the operator's review in chat with screenshots and a video before merge.

### PR mechanics, for every PR

- [ ] Resolve the forge once. Default to `gh`; if `command -v origin` succeeds and Origin can resolve the repository, use `origin pr` for every PR operation. Record any fallback to `gh`. Never require `gt`.
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

Each live lane runs in its own git worktree at the PR head. There is no `control-ui` or `control-cli` skill in this harness, so web lanes drive Chrome through Playwright and CLI lanes run in a tmux pane.

- [ ] `git fetch origin <head-branch> && git checkout <head SHA>`.
- [ ] Run `pnpm install`, `pnpm libs:build`, and `pnpm prepare:env`. Then start the web app with `pnpm dev` and wait until `http://localhost:4200` answers. The `prepare:env` script sets `VITE_ENABLE_MSW=true`, so the app runs against the mock API in `apps/codeimage/src/mocks` and needs no database.
- [ ] For CLI lanes, run `pnpm --filter=@codeimage/cli build` and call `node packages/cli/dist/bin.js` inside tmux. Capture the pane with `tmux capture-pane -p`.
- [ ] Deliver input only through Playwright page actions or tmux `send-keys`. Read-only diagnostics are the browser console, `tmux capture-pane`, and the output files.
- [ ] Save every screenshot to `/tmp/swarm-<pr-id>/worker-<n>/<slug>.png` and return the paths with the report.

## Render the export node from a static snapshot view (P1)

**Depends on.** None.

**Files.**

- [ ] Create `apps/codeimage/src/core/snapshot/tokenize.ts`. It is a pure function from code, `languageId`, and theme to lines of `{text, classes}` spans.
- [ ] Create `apps/codeimage/src/components/CustomEditor/StaticCodeView.tsx`.
- [ ] Edit `apps/codeimage/src/components/Frame/PreviewFrame.tsx`.
- [ ] Delete `apps/codeimage/src/components/CustomEditor/PreviewExportEditor.tsx`.
- [ ] Create `scripts/parity/export-matrix.ts`.

**Build.**

- [ ] Write `tokenize` with `highlightCode` from `@lezer/highlight`. Pass every `HighlightStyle` found in the theme's `editorTheme`, not only the first. The prototype found two in Dracula. Await the lazy language support from `@codeimage/config` before it parses.
- [ ] Make `StaticCodeView` emit CodeMirror class names (`cm-editor`, `cm-scroller`, `cm-gutters`, `cm-gutterElement`, `cm-content`, `cm-line`). The existing theme CSS then applies with no change.
- [ ] Mount the theme's `StyleModule` rules once with `StyleModule.mount`, so the view needs no `EditorView` instance.
- [ ] Replace `PreviewExportEditor` with `StaticCodeView` in `PreviewFrame.tsx`. Delete the transaction sync, including the `setInterval` that `PreviewExportEditor` starts on every transaction and never clears.
- [ ] Make `scripts/parity/export-matrix.ts` drive the app in Playwright. It exports PNG for every theme, every terminal type, and line numbers on and off, then pixel-diffs two runs against each other.

**You see.**

- [ ] The export button produces the same image as on trunk for a 300-line snippet, with no lines cut at the CodeMirror viewport edge.
- [ ] After 50 edits, `performance.now()` sampling in the console shows no growth in timer callbacks, where trunk grows by one interval per edit.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `apps/codeimage/src/core/snapshot/tokenize.test.ts` gains cases for TypeScript, Python, and an unknown `languageId`, which falls back to plain text. Run `pnpm --filter=@codeimage/app test`.
- [ ] Run `tsx scripts/parity/export-matrix.ts --base main --head HEAD` and attach its table. Every cell is at most 0.5% at threshold 0.1.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Export the default snippet as PNG on trunk and on head with the Dracula theme. Save `p1-default-diff.png`. Pass when the pixel diff is at most 0.5%.
- [ ] Lane 2. Paste a 300-line file and export it. Save `p1-long.png`. Pass when the PNG shows line 300.
- [ ] Lane 3. Switch through five themes and export each. Save `p1-themes.png`. Pass when each export matches the on-screen preview colors.
- [ ] Lane 4. Turn line numbers on and set the first line number to 42. Save `p1-gutter.png`. Pass when the gutter starts at 42.
- [ ] Lane 5. Export as SVG. Save `p1-svg.png`. Pass when Chrome opens the SVG and it matches the PNG.
- [ ] Lane 6. Add three tabs with different languages and export. Save `p1-tabs.png`. Pass when every tab title shows and the active tab's code is highlighted.
- [ ] Lane 7. Type 50 characters, then wait 10 seconds with the Performance panel recording. Save `p1-idle.png`. Pass when no recurring timer appears after typing stops.
- [ ] Lane 8. Turn ligatures off, then export. Save `p1-ligatures.png`. Pass when `!==` renders as three glyphs.
- [ ] Lane 9. Use the Windows terminal type with glass reflection on. Save `p1-windows.png`. Pass when the export matches the preview.
- [ ] Lane 10. Copy to clipboard instead of download. Save `p1-clipboard.png`. Pass when the pasted image equals the downloaded PNG.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Wall time from export click to blob ready for a 300-line TypeScript snippet.
- [ ] Probe. Ten interleaved runs on trunk and head in the same Chrome profile, timed with `performance.mark` around `exportImage`.
- [ ] Baseline. Record the trunk median and spread first.
- [ ] Rule. The head median is at most 1.1 times the trunk median. A slower head fails.

**Review gate.** None. P1 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends P1 to the stack and the operator lands it bottom-up.

## Rasterize the web export with Takumi WASM behind a flag (P2)

**Depends on.** P1. The live export node must hold every line, and before P1 it holds only the lines in the CodeMirror viewport (Appendix A).

**Files.**

- [ ] Create `apps/codeimage/src/core/rasterize/index.ts`, `apps/codeimage/src/core/rasterize/domExport.ts`, and `apps/codeimage/src/core/rasterize/takumi.ts`.
- [ ] Edit `apps/codeimage/src/hooks/use-export-image.ts`.
- [ ] Edit `apps/codeimage/src/state/editor/config.store.ts`.
- [ ] Edit `apps/codeimage/src/components/Toolbar/SettingsDialog.tsx`.
- [ ] Edit the tab title styles under `apps/codeimage/src/components/Terminal/**` and `apps/codeimage/src/components/Icons/CodeImageLogoV2.tsx` only as far as the spike below requires.
- [ ] Create `scripts/parity/rasterizers.ts`.

**Build.**

- [ ] Spike first, with the prototype in Appendix A as the starting point. Find why Takumi draws the tab title in monospace when `Inter var` is registered, and why it draws the watermark logo with a cut box. Record the cause of each. If a fix needs a visible change in the `dom-export` output, stop and ask the operator.
- [ ] Define `type Rasterizer = (node: HTMLElement, options: {format: 'png' | 'jpeg' | 'svg'; pixelRatio: number; quality: number}) => Promise<Blob | string>` in `core/rasterize/index.ts`. Move the current `toPng`, `toJpeg`, `toSvg`, and `toBlob` calls into `domExport.ts` unchanged.
- [ ] Make `exportImage` pick the rasterizer once from the config store. The download, share, new tab, and clipboard branches keep consuming the blob as they do today.
- [ ] Write `takumi.ts`. It clones the node, removes `[data-export-exclude="true"]`, takes `outerHTML`, collects CSS from `document.styleSheets`, and registers the fonts named in `core/configuration/font.ts` plus the UI font. It loads `@takumi-rs/wasm` with a dynamic `import()`, so the flag-off bundle does not grow. It keeps one `Renderer` per session.
- [ ] For a local font picked through the Local Font Access API, pass its bytes from `FontData.blob()`. That API exists only in Chromium browsers, which are the only ones that offer local fonts.
- [ ] Add `renderer: 'dom-export' | 'takumi'` to `ConfigState`, default `'dom-export'`, persisted with the store in IndexedDB. Read `?renderer=takumi` from the URL on load and expose `window.setRenderer`, next to the existing `window.toggleDevMode`.
- [ ] Add a **Rendering engine** switch to Settings with the existing `ExperimentalChip`.
- [ ] When the Takumi path throws, export that image with `dom-export`, log the error to the console, and track it with the existing Umami call.
- [ ] Make `scripts/parity/rasterizers.ts` export every theme and terminal type with both rasterizers in Playwright and print the pixel diff of each against a Chrome element screenshot.

**You see.**

- [ ] With the switch on, the export button downloads a PNG within 0.5% of a native-DPR Chrome screenshot of the export node, and the console shows no error. dom-export itself is about 0.9% from Chrome because it shrinks font sizes by 0.1px, so the switch-off PNG is not the reference.
- [ ] With the switch off, the network panel shows no request for the Takumi WASM file.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `core/rasterize/takumi.test.ts` asserts that excluded nodes are absent from the HTML handed to Takumi, and that a missing font falls back without throwing. Run `pnpm --filter=@codeimage/app test`.
- [ ] Run `tsx scripts/parity/rasterizers.ts` and attach its table. Every Takumi cell is at most 0.5% from Chrome.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. With the switch off, export the default snippet on trunk and on head. Save `p2-off.png`. Pass when the diff is at most 0.5%.
- [ ] Lane 2. Turn the switch on and export the default snippet. Save `p2-on.png`. Pass when it is at most 0.5% from a native-DPR Chrome screenshot of the export node.
- [ ] Lane 3. Export a 300-line snippet with the switch on. Save `p2-long.png`. Pass when the PNG shows line 300 and its pixel size equals the export node's client box times the scale. dom-export shrinks outputs taller than the browser's 16384 px canvas limit, so it is not the size reference.
- [ ] Lane 4. Export five themes with the switch on. Save `p2-themes.png`. Pass when each is at most 0.5% from a native-DPR Chrome screenshot of the export node.
- [ ] Lane 5. Export SVG with the switch on. Save `p2-svg.png`. Pass when the file has no `foreignObject` and Chrome shows it within 0.5% of the PNG.
- [ ] Lane 6. Check the tab title and the watermark with the switch on. Save `p2-text.png`. Pass when both match the switch-off PNG at 400% zoom.
- [ ] Lane 7. Block the WASM URL in Playwright and export. Save `p2-fallback.png`. Pass when the PNG downloads and the console logs the fallback.
- [ ] Lane 8. Open `/?renderer=takumi`, reload, then open Settings. Save `p2-flag.png`. Pass when the switch shows on and stays on after the reload.
- [ ] Lane 9. Copy to clipboard with the switch on. Save `p2-clipboard.png`. Pass when the pasted image equals the downloaded PNG.
- [ ] Lane 10. Use a background image asset with the switch on. Save `p2-bg.png`. Pass when it matches the switch-off PNG within 0.5%.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Wall time from export click to blob ready for a 300-line TypeScript snippet, warm, and the first export of a session including the WASM download.
- [ ] Probe. Ten interleaved warm runs per rasterizer in one Chrome profile with `performance.mark`, plus five cold first exports with the cache disabled.
- [ ] Baseline. Record the switch-off median and spread first.
- [ ] Rule. The warm Takumi median is at most the switch-off median. The cold first export of the default snippet is at most 2 s on an unthrottled local connection; for very large outputs, report cold minus warm as the first-session overhead instead. A slower head fails.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 3, and 6 screenshots into `docs/plans/media/p2-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of turning the switch on in Settings and exporting a long snippet. Save it as `docs/plans/media/p2-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends P2 to the stack and the operator lands it bottom-up.

## Render a snapshot to PNG and SVG in Node with Takumi (P3)

**Depends on.** P1.

**Files.**

- [ ] Create `apps/codeimage/src/render/entry-server.tsx`.
- [ ] Edit `apps/codeimage/vite.config.ts` to add an SSR build of that entry.
- [ ] Create `packages/render/src/document.ts`, `packages/render/src/render.ts`, and `packages/render/package.json`.
- [ ] Create `scripts/parity/takumi-vs-chrome.ts`.

**Build.**

- [ ] Spike first. Server-render `PreviewFrame` with `StaticCodeView` through `renderToString` from `solid-js/web`. If a component touches `window` at module load or needs a directive at render, record it and stop. The fallback is option B in Appendix B, a Playwright render page.
- [ ] Parse the input with zod in `document.ts` into `SnapshotDocument`, which is `ProjectEditorPersistedState` plus `{format, scale, width}`. Reject an unknown `$version` with a message that names it.
- [ ] Collect CSS from the vanilla-extract output file of the SSR build and from the theme's `StyleModule.getRules()`.
- [ ] Rasterize with `Renderer` from `@takumi-rs/core`. Register the web fonts listed in `apps/codeimage/src/core/configuration/font.ts` from bundled files.
- [ ] Export `renderSnapshot(doc): Promise<Uint8Array | string>` from `@codeimage/render`. PNG, JPEG, and WebP return bytes. SVG returns a string.
- [ ] Make `scripts/parity/takumi-vs-chrome.ts` render each matrix cell's HTML in Chrome and in Takumi and report the pixel diff per cell. Add it to `.github/workflows/main.yml`.

**You see.**

- [ ] `node -e` calling `renderSnapshot` on a saved project JSON writes a PNG that matches the web export of the same project.
- [ ] The parity script prints one row per theme and terminal type, and every row is at most 0.5%.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `packages/render/src/document.test.ts` covers a valid snapshot, a missing editor, and an unknown `$version`. Run `pnpm --filter=@codeimage/render test`.
- [ ] Run `tsx scripts/parity/takumi-vs-chrome.ts` and attach the table.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Trunk has no Node renderer, so record that. Gate the web export at head against the `renderSnapshot` output for the default project. Save `p3-default.png`. Pass when the diff is at most 0.5%.
- [ ] Lane 2. Render every theme with the macOS terminal. Save `p3-themes.png`. Pass when every cell is at most 0.5%.
- [ ] Lane 3. Render with a custom background image asset. Save `p3-bg-image.png`. Pass when the image fills the frame as in the web export.
- [ ] Lane 4. Render a snippet with emoji and CJK characters. Save `p3-fallback.png`. Pass when no glyph renders as a box.
- [ ] Lane 5. Render as SVG and open it in Chrome and Safari. Save `p3-svg.png`. Pass when the SVG has no `foreignObject` and both browsers match the PNG.
- [ ] Lane 6. Render with opacity 50% and a radius of 0. Save `p3-opacity.png`. Pass when it matches the web export.
- [ ] Lane 7. Render each bundled web font. Save `p3-fonts.png`. Pass when each output uses the named font and not a fallback.
- [ ] Lane 8. Render at scale 1, 2, and 3. Save `p3-scale.png`. Pass when the pixel sizes are 1, 2, and 3 times the frame size.
- [ ] Lane 9. Pass a snapshot with `$version` set to 999. Save `p3-bad-version.png`. Pass when the error names the version.
- [ ] Lane 10. Render a 1,000-line snippet. Save `p3-huge.png`. Pass when the PNG contains line 1,000.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. `renderSnapshot` wall time for a 300-line snippet at scale 1 and at scale 2, in a warm process with fonts registered.
- [ ] Probe. Thirty runs after five warm-up runs, timed with `performance.now()`.
- [ ] Baseline. Trunk has no Node renderer. Record the web export median from P1 as the reference for the same snippet.
- [ ] Rule. At scale 1 the median is at most 300 ms, measured on a host with a load average under 8. A higher median fails. Record the scale 2 median with its spread and limiter, without a gate, because Takumi's raster cost grows with the pixel count (coordinator decision, 2026-11-14).

**Review gate.** None. P3 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends P3 to the stack and the operator lands it bottom-up.

## Ship the codeimage command-line tool (P4)

**Depends on.** P3.

**Files.**

- [ ] Create `packages/cli/src/bin.ts`, `packages/cli/src/args.ts`, and `packages/cli/package.json` with `"bin": {"codeimage": "dist/bin.js"}`.
- [ ] Edit the preset menu in `apps/codeimage/src/components/Presets/` to add a **Copy as CLI config** action.

**Build.**

- [ ] Read code from a file path or from stdin. Infer the language from the file extension through `@codeimage/config`. `--lang` overrides it.
- [ ] Support `--lines 10-30`, `--theme <id>`, `--preset <file.json>`, `--format png|jpeg|webp|svg`, `--scale <n>`, and `-o <path>`. With `-o -`, write the image to stdout.
- [ ] Give several input files as several tabs in one window.
- [ ] Exit with 0 on success, 1 on a render error, and 2 on a usage error. Print usage errors to stderr with the flag name.
- [ ] Make **Copy as CLI config** copy the preset as the JSON that `--preset` reads.

**You see.**

- [ ] `npx codeimage src/foo.ts -o foo.png` writes `foo.png` and prints its path.
- [ ] `cat foo.ts | npx codeimage --lang typescript -o - > foo.png` writes a valid PNG.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `packages/cli/src/args.test.ts` covers line ranges, an unknown theme, and a missing input. Run `pnpm --filter=@codeimage/cli test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Trunk has no CLI, so record that. Gate `codeimage` output against the web export of the same preset and code. Save `p4-parity.png`. Pass when the diff is at most 0.5%.
- [ ] Lane 2. Run `codeimage README.md -o out.png` from the repo root. Save `p4-file.png`. Pass when the language is Markdown and the PNG opens.
- [ ] Lane 3. Pipe code through stdin with `--lang python`. Save `p4-stdin.png`. Pass when the PNG shows Python highlighting.
- [ ] Lane 4. Use `--lines 5-12`. Save `p4-lines.png`. Pass when the PNG shows exactly eight lines and the gutter starts at 5.
- [ ] Lane 5. Copy a preset with **Copy as CLI config** and pass it with `--preset`. Save `p4-preset.png`. Pass when the output matches the web export with that preset.
- [ ] Lane 6. Pass three files. Save `p4-multi.png`. Pass when the window shows three tabs.
- [ ] Lane 7. Use `--theme nope`. Save `p4-bad-theme.png`. Pass when the exit code is 2 and stderr lists valid theme ids.
- [ ] Lane 8. Use `--format svg -o -`. Save `p4-svg.png`. Pass when stdout is a valid SVG.
- [ ] Lane 9. Run with no arguments and no stdin. Save `p4-usage.png`. Pass when it prints usage and exits with 2.
- [ ] Lane 10. Run in a clean directory with `npx` from a packed tarball. Save `p4-npx.png`. Pass when it renders without a browser installed on the `PATH`.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Cold wall time of `codeimage foo.ts -o foo.png` for a 50-line file, measured with `hyperfine`.
- [ ] Probe. `hyperfine --warmup 2 --runs 20` on head. Trunk has no CLI, so the run measures head only.
- [ ] Baseline. Record the P3 warm `renderSnapshot` median, so the difference is process start and font loading.
- [ ] Rule. The cold median is at most 1.5 s. A higher median fails.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 5, and 7 screenshots into `docs/plans/media/p4-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of a terminal session that runs lanes 2, 3, and 5. Save it as `docs/plans/media/p4-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends P4 to the stack and the operator lands it bottom-up.

## Mark lines as added, removed, or highlighted (P5)

**Depends on.** P4.

**Files.**

- [ ] Edit `apps/codeimage/src/state/editor/model.ts` to add `marks` to `EditorState` and `PersistedEditorState`.
- [ ] Create `apps/codeimage/src/components/CustomEditor/plugins/lineMarks/`.
- [ ] Create `apps/codeimage/src/core/diff/parseUnifiedDiff.ts` and `apps/codeimage/src/core/diff/parseAnnotations.ts`.
- [ ] Edit `apps/api/prisma/schema.prisma` and add a migration with `marks Json?` on `SnippetEditorTab`. Edit the API schemas in `apps/api/src/schemas`.
- [ ] Create `packages/cli/src/flags/marks.ts`.

**Build.**

- [ ] Define the data shape as `type LineMark = {line: number; kind: 'added' | 'removed' | 'highlight'}` and `type TabMarks = {lines: LineMark[]; focus: boolean}`. When `focus` is true, the view dims every line without a `highlight` mark.
- [ ] Hold marks in the editor as a `StateField` of line decorations that maps through document changes. The closed PR #617 stored raw line numbers, and those drifted when lines were inserted above them.
- [ ] Register mark changes with `invertedEffects` from `@codemirror/commands`, so Cmd+Z and Ctrl+Z undo a mark like any edit.
- [ ] Show a selection bar. When a selection spans one or more lines, a CodeMirror tooltip above it offers **Highlight**, **Added**, **Removed**, and **Clear**, with each shortcut in its title. This is the main way to mark a range.
- [ ] Make the gutter a mark control. Hovering a line number shows a marker. A click toggles `highlight` on that line, and a drag along the gutter applies it to the range. Reuse the toggle from branch `616-diff-style` (`plugins/diff/DiffCheckbox.tsx`) as the starting point.
- [ ] Bind `Mod-Alt-1` to highlight, `Mod-Alt-2` to added, `Mod-Alt-3` to removed, and `Mod-Alt-0` to clear, for the lines the selection touches. CodeMirror ignores Alt-only bindings on macOS, so every binding carries `Mod`. List them in the shortcuts dialog.
- [ ] On paste, detect a unified diff and offer **Import as diff**. The parser strips `+`, `-`, and ` ` prefixes, keeps the code, and writes `added` and `removed` marks. The file's language stays the highlighter, so syntax colors survive.
- [ ] On paste and on CLI input, convert Shiki notation comments into marks and remove them from the code. Support `[!code ++]`, `[!code --]`, `[!code highlight]`, `[!code highlight:N]`, `[!code focus]`, and `[!code focus:N]`, with the comment syntax that each language declares in CodeMirror `commentTokens`. Show a toast that names the count, with an **Undo** that restores the comments.
- [ ] Keep continuous line numbers. When a tab has at least one `added` or `removed` mark, show a sign column with `+` or `-` next to the numbers.
- [ ] Render marks in `StaticCodeView` as `data-mark` attributes. Added and removed lines get a green or red background, highlighted lines a light band with a 2 px accent bar, and focus dims the other lines. Read the colors from the theme when it defines them, and otherwise use semi-transparent defaults that work on any background.
- [ ] Add `--diff`, `--highlight 3-5,9`, and `--focus` to the CLI. `git diff | codeimage --diff` makes one tab per file in the diff.

**You see.**

- [ ] Pasting the output of `git diff` shows green and red lines with real syntax colors.
- [ ] Selecting three lines and clicking **Highlight** in the selection bar marks them, and Cmd+Z removes the marks.
- [ ] `git diff HEAD~1 | codeimage --diff -o diff.png` writes one tab per changed file.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `parseUnifiedDiff.test.ts` covers one file, two files, a renamed file, a file with no newline at the end, and a binary file. Run `pnpm --filter=@codeimage/app test`.
- [ ] `lineMarks.test.ts` asserts that a mark on line 5 moves to line 7 after two lines are inserted above it, and that undo removes a mark that was just added.
- [ ] `parseAnnotations.test.ts` covers each notation, the `:N` range form, a Python `#` comment, an HTML comment, and a line that holds code and an annotation.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Export the default snippet with no marks on trunk and on head. Save `p5-no-marks.png`. Pass when the diff is at most 0.5%.
- [ ] Lane 2. Paste a two-file `git diff` and accept **Import as diff**, then paste plain code with lines that start with `-`. Save `p5-import.png`. Pass when the diff makes two tabs with green and red lines and the plain code gets no offer.
- [ ] Lane 3. Mark line 5 as highlight, then insert two lines above it. Save `p5-mapping.png`. Pass when the mark sits on line 7.
- [ ] Lane 4. Turn focus on with two highlighted lines. Save `p5-focus.png`. Pass when the other lines are dimmed in the export.
- [ ] Lane 5. Save the project, reload the page, and reopen it. Save `p5-persist.png`. Pass when every mark is restored.
- [ ] Lane 6. Select lines 3 to 5 and click **Added** in the selection bar. Save `p5-selection-bar.png`. Pass when the three lines are green and the sign column shows `+`.
- [ ] Lane 7. Press `Mod-Alt-1` on line 2, then the undo shortcut, in Chrome and in Firefox. Save `p5-shortcuts.png`. Pass when the highlight appears, then goes away, and the browser runs no action of its own.
- [ ] Lane 8. Paste TypeScript with `// [!code ++]` on one line and `// [!code highlight:2]` on another, then click **Undo** in the toast. Save `p5-annotations.png`. Pass when the comments disappear and the marks apply, and **Undo** restores the comments.
- [ ] Lane 9. Run `git diff HEAD~1 | codeimage --diff` and `codeimage foo.ts --highlight 2-3 --focus` in this repo. Save `p5-cli.png`. Pass when the diff output matches the web import of the same diff and only lines 2 and 3 are bright in the focus output.
- [ ] Lane 10. Switch through five themes with all three kinds set. Save `p5-themes.png`. Pass when every marked line stays readable in each theme.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Export wall time for a 300-line snippet with 100 marks, and with none.
- [ ] Probe. Ten interleaved runs of each on trunk and head.
- [ ] Baseline. Record the trunk median for the no-marks snippet first.
- [ ] Rule. Head with 100 marks is at most 1.1 times the trunk median. A slower head fails.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 6, and 9 screenshots into `docs/plans/media/p5-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of pasting a diff, marking lines with the selection bar and the gutter, toggling focus, and exporting. Save it as `docs/plans/media/p5-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends P5 to the stack and the operator lands it bottom-up.

## Hint and redact secrets before export (P6)

**Depends on.** P4.

**Files.**

- [ ] Create `packages/secrets/package.json`, `packages/secrets/src/rules.ts`, and `packages/secrets/src/detect.ts`. The app and the CLI both import it.
- [ ] Create `apps/codeimage/src/components/CustomEditor/plugins/secrets/`.
- [ ] Edit `apps/codeimage/src/components/Toolbar/ExportButton.tsx` for the export warning.
- [ ] Create `packages/cli/src/flags/redact.ts`.

**Build.**

- [ ] Keep the rules as one table of `{id, label, pattern, keepPrefix}`. Port these from the gitleaks default config, which is MIT licensed, and keep its rule ids and license notice. They are `github-pat`, `github-fine-grained-pat`, `github-oauth`, `github-app-token`, `aws-access-token`, `stripe-access-token`, `slack-bot-token`, `slack-user-token`, `openai-api-key`, `anthropic-api-key`, `gcp-api-key`, `jwt`, and `private-key`.
- [ ] Add a `connection-url-password` rule for `scheme://user:password@host`. It masks only the password.
- [ ] Add a `generic-assignment` rule. It matches a name that contains `secret`, `token`, `password`, `passwd`, `api_key`, `apikey`, `private_key`, or `client_secret`, in any case, assigned a string literal or a `.env` value. The value must be at least 12 characters with a Shannon entropy of at least 3.5 bits per character. Skip placeholders such as `xxx`, `your-`, `<...>`, `changeme`, and `example`, and references such as `process.env.` and `${`.
- [ ] Export `detectSecrets(text): {from: number; to: number; ruleId: string; keepPrefix: number}[]` as a pure function.
- [ ] In the editor, run `detectSecrets` through `linter()` from `@codemirror/lint`, which is already a dependency of the app and not yet imported. Each match is a warning with a label such as "Looks like a GitHub token" and two actions, **Redact** and **Ignore**.
- [ ] Make **Redact** replace the matched characters in the document with `•`, keeping the public prefix, such as `ghp_` or `sk_live_`, and the length. It is one undoable transaction. Nothing else stores the secret, so there is no `redactions` field and no migration.
- [ ] Make **Ignore** hide that match for the session only. It stores nothing.
- [ ] When any tab has an unredacted match, the export dialog shows "N possible secrets visible" with **Redact all** and **Export anyway**.
- [ ] In the CLI, redact every match in the input before rendering. Print one stderr line per match with its line, column, and rule id. `--no-redact` turns it off.

**You see.**

- [ ] Pasting `const key = "ghp_..."` underlines the token, and **Redact** turns it into `ghp_` followed by dots in the editor and in the export.
- [ ] Opening the export dialog with an unredacted token shows the warning.
- [ ] `codeimage .env.example` prints `redacted 2 secrets` and the PNG shows masks.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `detect.test.ts` has one true positive and one near-miss per rule, every placeholder in the skip list, and values just under and just over the entropy threshold. Run `pnpm --filter=@codeimage/secrets test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Export a snippet with no secrets on trunk and on head. Save `p6-clean.png`. Pass when the diff is at most 0.5% and no hint shows.
- [ ] Lane 2. Paste a GitHub token and open the export dialog, then click **Redact all**. Save `p6-redact.png`. Pass when the warning shows first and the export then shows `ghp_` followed by dots.
- [ ] Lane 3. Export the redacted snippet as SVG and search the file for the token. Save `p6-svg-grep.png`. Pass when the token is absent.
- [ ] Lane 4. Click **Ignore** on a hint, then reload. Save `p6-ignore.png`. Pass when the hint is gone before the reload and back after it.
- [ ] Lane 5. Click **Redact**, then press the undo shortcut. Save `p6-undo.png`. Pass when the original token is back in the editor.
- [ ] Lane 6. Paste a PEM private key block. Save `p6-pem.png`. Pass when the whole block is one hint.
- [ ] Lane 7. Run `codeimage` on a file with three secrets. Save `p6-cli.png`. Pass when stderr lists three matches and the PNG shows three masks.
- [ ] Lane 8. Run with `--no-redact`. Save `p6-cli-off.png`. Pass when the PNG shows the original text.
- [ ] Lane 9. Paste a UUID and a git SHA. Save `p6-false-positive.png`. Pass when neither gets a hint.
- [ ] Lane 10. Redact a token, save the project, and reload. Save `p6-persist.png`. Pass when the token is absent from IndexedDB and from the project payload the app sends to the mock API.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time for `detect` to scan a 2,000-line file.
- [ ] Probe. Thirty runs after five warm-up runs in Node, timed with `performance.now()`.
- [ ] Baseline. Trunk has no detector. Record the head median and spread.
- [ ] Rule. The median is at most 20 ms. A higher median fails.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 3, and 7 screenshots into `docs/plans/media/p6-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of pasting a token, redacting it, and exporting. Save it as `docs/plans/media/p6-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends P6 to the stack and the operator lands it bottom-up.

## Export at social sizes with a signature (P7)

**Depends on.** P4.

**Files.**

- [ ] Edit `packages/config/src/lib/base/aspectRatio.ts` to add named targets.
- [ ] Edit `apps/codeimage/src/components/PropertyEditor/controls/AspectRatioPicker/AspectRatioPicker.tsx`.
- [ ] Edit `apps/codeimage/src/state/frame/model.ts` to add `signature`.
- [ ] Edit `apps/codeimage/src/components/Frame/Frame.tsx`.
- [ ] Create `packages/cli/src/flags/size.ts`.

**Build.**

- [ ] Add named targets to `DEFAULT_ASPECT_RATIOS` with exact pixel sizes. Start with X landscape at 1600 by 900, square at 1080 by 1080, LinkedIn portrait at 1080 by 1350, and Open Graph at 1200 by 630.
- [ ] When a named target is active, export at exactly its pixel size and center the window inside the frame.
- [ ] Add `signature: {handle: string; position: 'bottom-left' | 'bottom-right'} | null` to the frame state and draw it as a frame overlay. Keep the existing `showWatermark` separate.
- [ ] Add `--size <target>` and `--signature @handle` to the CLI.

**You see.**

- [ ] Picking **X landscape** and exporting writes a 1600 by 900 PNG at scale 1.
- [ ] The handle shows in the chosen corner of the frame.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `aspectRatio.test.ts` asserts each target's pixel size. Run `pnpm --filter=@codeimage/config test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Export with the existing 16:9 ratio on trunk and on head. Save `p7-ratio.png`. Pass when the diff is at most 0.5%.
- [ ] Lane 2. Pick each named target and export. Save `p7-targets.png`. Pass when every PNG has the target's exact pixel size.
- [ ] Lane 3. Use a 60-line snippet with X landscape. Save `p7-overflow.png`. Pass when the window scales down to fit and nothing is cut.
- [ ] Lane 4. Add a signature in each corner. Save `p7-signature.png`. Pass when the handle shows in the chosen corner.
- [ ] Lane 5. Set a 40-character handle. Save `p7-long-handle.png`. Pass when the handle stays inside the frame.
- [ ] Lane 6. Save a preset with a target and a signature and apply it to a new project. Save `p7-preset.png`. Pass when both restore.
- [ ] Lane 7. Run `codeimage foo.ts --size x-landscape --signature @me`. Save `p7-cli.png`. Pass when it matches the web export.
- [ ] Lane 8. Upload an X-landscape export to a 1600 by 900 crop check script. Save `p7-crop.png`. Pass when no content falls outside the center crop that X shows in the timeline.
- [ ] Lane 9. Switch back to free size. Save `p7-free.png`. Pass when resizing works as on trunk.
- [ ] Lane 10. Export Open Graph as JPEG. Save `p7-og.png`. Pass when the file is 1200 by 630.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Export wall time at X landscape against the same snippet at free size.
- [ ] Probe. Ten interleaved runs of each on head, and ten free-size runs on trunk.
- [ ] Baseline. Record the trunk free-size median first.
- [ ] Rule. The X landscape median is at most 1.1 times the trunk median. A slower head fails.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 4, and 7 screenshots into `docs/plans/media/p7-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of picking a target, adding a signature, and exporting. Save it as `docs/plans/media/p7-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends P7 to the stack and the operator lands it bottom-up.

## Export each tab as its own image (P8)

**Depends on.** P2 and P4. P2 also edits `use-export-image.ts`.

**Files.**

- [ ] Edit `apps/codeimage/src/components/Toolbar/ExportContent.tsx`.
- [ ] Edit `apps/codeimage/src/hooks/use-export-image.ts`.
- [ ] Create `packages/cli/src/flags/split.ts`.

**Build.**

- [ ] Add a **One image per tab** switch to the export panel, next to the existing "(Export) Show only active tab" checkbox. Each image shows one tab, active, in the same frame.
- [ ] Download the images as one zip built with `fflate`. Name the files `01-<tabName>.png` and so on.
- [ ] In share mode, pass every image in one `navigator.share({files})` call when `navigator.canShare({files})` returns true, so a phone can post them to X together. MDN documents `files` as an array but does not confirm multi-file support per browser, so fall back to the zip when `canShare` returns false.
- [ ] Add `--split-tabs` to the CLI. It writes `<out>-01.png` and so on.

**You see.**

- [ ] With four tabs, export writes a zip of four PNGs, each with one tab active.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `use-export-image.test.ts` asserts the file names for four tabs, including tab names with slashes. Run `pnpm --filter=@codeimage/app test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Export four tabs as one image on trunk and on head. Save `p8-single.png`. Pass when the diff is at most 0.5%.
- [ ] Lane 2. Export four tabs with **One image per tab**. Save `p8-zip.png`. Pass when the zip holds four PNGs.
- [ ] Lane 3. Check each PNG in the zip. Save `p8-active.png`. Pass when each shows a different active tab.
- [ ] Lane 4. Export one tab with the switch on. Save `p8-one.png`. Pass when it downloads a PNG, not a zip.
- [ ] Lane 5. Use tab names with spaces and slashes. Save `p8-names.png`. Pass when the file names are safe.
- [ ] Lane 6. Combine with the X landscape target from P7 if it has merged. Save `p8-size.png`. Pass when every PNG is 1600 by 900, or record that P7 is absent.
- [ ] Lane 7. Run `codeimage a.ts b.ts c.ts --split-tabs -o out.png`. Save `p8-cli.png`. Pass when three numbered files exist.
- [ ] Lane 8. Export as SVG with the switch on. Save `p8-svg.png`. Pass when the zip holds SVG files.
- [ ] Lane 9. Use the mobile layout at 390 px width. Save `p8-mobile.png`. Pass when the switch is reachable and the share sheet opens.
- [ ] Lane 10. Turn the switch off and export. Save `p8-off.png`. Pass when behavior matches trunk.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Total export wall time for four tabs with the switch on.
- [ ] Probe. Ten interleaved runs on head with the switch on, and ten single-image runs on trunk.
- [ ] Baseline. Record the trunk single-image median first.
- [ ] Rule. The four-image median is at most 4.4 times the trunk single-image median. A slower head fails.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 3, and 7 screenshots into `docs/plans/media/p8-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of exporting four tabs and opening the zip. Save it as `docs/plans/media/p8-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends P8 to the stack and the operator lands it bottom-up.

## Generate alt text from the snippet (P9)

**Depends on.** P4.

**Files.**

- [ ] Create `apps/codeimage/src/core/altText.ts`.
- [ ] Edit `apps/codeimage/src/components/Toolbar/ExportContent.tsx`.
- [ ] Create `packages/cli/src/flags/alt.ts`.

**Build.**

- [ ] Write `altText(tab)` as a pure function. It returns the language name, the tab name, the line range, and then the code, cut to 1,000 characters with a trailing note when it cuts. It reads the code after redaction from P6 when P6 has merged.
- [ ] Add a **Copy alt text** button next to **Copy to clipboard** in the export panel.
- [ ] Add `--alt` to the CLI. It writes `<out>.alt.txt` next to the image.

**You see.**

- [ ] **Copy alt text** puts `TypeScript code, user.ts, lines 1 to 6` and the code on the clipboard.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `altText.test.ts` covers a short snippet, a snippet over 1,000 characters, and a redacted secret. Run `pnpm --filter=@codeimage/app test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Trunk has no alt text, so record that. Gate that the export panel still exports the same PNG as on trunk. Save `p9-export.png`. Pass when the diff is at most 0.5%.
- [ ] Lane 2. Click **Copy alt text** for a 6-line snippet. Save `p9-copy.png`. Pass when the clipboard holds the header and all six lines.
- [ ] Lane 3. Use a 200-line snippet. Save `p9-long.png`. Pass when the text is at most 1,000 characters and ends with the cut note.
- [ ] Lane 4. Use a snippet with a redacted token. Save `p9-redacted.png`. Pass when the token is absent from the alt text.
- [ ] Lane 5. Use an unnamed tab. Save `p9-unnamed.png`. Pass when the header omits the tab name cleanly.
- [ ] Lane 6. Run `codeimage foo.ts --alt -o foo.png`. Save `p9-cli.png`. Pass when `foo.png.alt.txt` exists and matches the web text.
- [ ] Lane 7. Use the mobile layout at 390 px width. Save `p9-mobile.png`. Pass when the button is reachable.
- [ ] Lane 8. Switch the UI to Italian. Save `p9-locale.png`. Pass when the button label is translated.
- [ ] Lane 9. Use a snippet with emoji and CJK characters. Save `p9-unicode.png`. Pass when the cut does not split a character.
- [ ] Lane 10. Use a line range from `--lines 5-12`. Save `p9-range.png`. Pass when the header says lines 5 to 12.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time for `altText` on a 2,000-line tab.
- [ ] Probe. Thirty runs after five warm-up runs in Node, timed with `performance.now()`.
- [ ] Baseline. Trunk has no alt text. Record the head median and spread.
- [ ] Rule. The median is at most 2 ms. A higher median fails.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 3, and 6 screenshots into `docs/plans/media/p9-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of copying alt text and pasting it into an X post draft. Save it as `docs/plans/media/p9-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends P9 to the stack and the operator lands it bottom-up.

## Render the new editor's window styles and signature in the CLI (P10)

**Depends on.** The new UI (#711, branch `feat/ui-prototypes`) with three PRs merged into it. They are the window styles (#732, `feat/window-styles`), the signature styles (#729, `feat/signature-styles`), and Takumi aligned with the new editor (#731 merged into #701). The CLI (#702) merges last, after all of them. The operator set this order on 2026-11-15.

- [ ] #729 merges into `feat/ui-prototypes` first. Record the merge SHA.
- [ ] #731 is merged into `feat/p2-takumi-rasterizer-flag`. Then #701 is retargeted to `feat/ui-prototypes` and merged. Record the PR base and the merge SHA.
- [ ] #732 merges into `feat/ui-prototypes`. Record the merge SHA.
- [ ] #702 stays rebased onto the branch it merges into and merges last. `packages/cli` stays `"private": true` until the operator picks an npm name.

**Files.**

- [ ] Edit `packages/render/src/document.ts` and `packages/render/src/render.ts`.
- [ ] Edit `packages/cli/src/flags/**` only if the operator asks for window flags.

**Build.**

- [ ] The snapshot schema reads the new terminal fields. They are the window `type` values `card`, `editor` and `terminal`, `surface` (`solid` or `wash`, where a missing value means `solid`), and `borderType` `hairline`.
- [ ] The schema reads the signature fields `handle`, `position`, `style`, `platform`, `name`, `avatar` and `profile`. An unknown value falls back to the default instead of failing.
- [ ] The Node renderer draws the same window and signature components the new UI exports, with no CLI-only copy.
- [ ] The renderer registers Inter for the signature. It fetches a GitHub, Bluesky or Mastodon avatar before rendering and falls back to initials offline.
- [ ] A preset copied with **Copy as CLI config** from the new UI carries the window style, surface, border and signature, and `--preset` applies them.
- [ ] Add `--window card|editor|terminal|macos|windows` and `--surface solid|wash` only if the operator asks. Presets stay the main path.

**You see.**

- [ ] `codeimage foo.ts --preset card-wash.json -o out.png` draws the Card window with the accent wash and the saved signature, like the web export.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `packages/render/src/document.test.ts` covers each new field, a missing `surface`, and an unknown window type. Run `pnpm --filter=@codeimage/render test`.
- [ ] A render test with the network disabled draws the Card signature with initials.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Gate the classic macOS and Windows styles on every theme against the web export. Save `p10-classic.png`. Pass when every cell is at most 0.5%.
- [ ] Lane 2. Card on GitHub Dark and Light. Save `p10-card.png`. Pass when both cells are at most 0.5%.
- [ ] Lane 3. Editor on GitHub Dark and Light. Save `p10-editor.png`. Pass when both cells are at most 0.5%.
- [ ] Lane 4. Terminal on GitHub Dark and Light. Save `p10-terminal.png`. Pass when both cells are at most 0.5%.
- [ ] Lane 5. Wash surface on macOS with a hairline border. Save `p10-wash.png`. Pass when the cell is at most 0.5%.
- [ ] Lane 6. Ambient background with two tabs. Save `p10-ambient.png`. Pass when the cell is at most 0.5%.
- [ ] Lane 7. No header and radius 0. Save `p10-bare.png`. Pass when the cell is at most 0.5%.
- [ ] Lane 8. Minimal, Pill and Card signatures with and without an icon at 1600×900 on a dark and a light background. Save `p10-signature.png`. Pass when every cell is at most 0.5%.
- [ ] Lane 9. A preset from **Copy as CLI config** in the new UI. Save `p10-preset.png`. Pass when the CLI output matches the web export of that preset.
- [ ] Lane 10. A snapshot saved before #732, with no `surface`. Save `p10-old.png`. Pass when it renders as `solid` and exits with 0.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Cold wall time of `codeimage foo.ts --preset card-wash.json -o out.png` for a 50-line file.
- [ ] Probe. `hyperfine --warmup 2 --runs 20` on head and on the P4 head.
- [ ] Baseline. The P4 cold median.
- [ ] Rule. The head median is at most 1.5 s, and at most 150 ms above the P4 median without an avatar fetch.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 5 and 8 screenshots into `docs/plans/media/p10-review-<slug>.png`.
- [ ] Record a 30 to 60 second terminal video of lanes 2, 8 and 9. Save it as `docs/plans/media/p10-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto the target branch after the verdict, patch-id unchanged.
- [ ] The operator lands it after #729, #701 and #732.

## Close the program

- [ ] Every box above is checked with its evidence.
- [ ] Reply to the operator with the report the execution playbook names.

## Appendix A. Prototype evidence

Both prototypes are throwaway and have no branch or SHA. The first lived in the session scratchpad under `render-proto/`, and a scratchpad cleanup deleted it, so its scripts and images are gone. Its results are recorded here. The second lives under `takumi-web/` in the same scratchpad, with its images in `takumi-web/out/`. Each result below names the script that produced it.

Takumi matches Chrome and Satori does not. `run.mjs` and `diff.mjs` rendered one hand-written frame that copies the CSS features of `Frame.css.ts` and `terminal.css.ts`. It has a grid container, an absolute gradient overlay with opacity, a multi-layer `box-shadow`, an `::after` glass highlight, a tab with `backdrop-filter`, diff line backgrounds, a dimmed and blurred line, ligatures, and `white-space: pre`. Against a headless Chrome screenshot at device pixel ratio 2, Takumi 2.19.0 differed in 0.11% of pixels at pixelmatch threshold 0.1. The diff image shows only glyph antialiasing at the edges. Satori 0.63.2, fed the same markup through `juice` and `satori-html`, differed in 10.4%. Satori dropped the spaces between token spans ("functiongetUser", "constres"), ignored `backdrop-filter`, and needed every class inlined into `style` attributes.

The first Chrome run was wrong and was discarded. The `@font-face` path did not resolve, so Chrome drew a fallback font. Copying the font next to the page fixed it, and `document.fonts` reported `Mono:loaded` on the rerun.

Takumi covers every CSS feature on the list. `features.mjs` rendered 20 isolated features in Chrome and in Takumi. These are CSS variables, `calc`, attribute selectors, `nth-child`, `::before`, grid, multi-layer shadows, `backdrop-filter`, `filter: blur`, rotate and scale transforms, `text-shadow`, `background-clip: text`, `mask-image`, radial gradients, `mix-blend-mode`, `outline-offset`, `tab-size` with `white-space: pre`, `text-overflow`, dashed borders, and nested opacity. Every feature differed by 0.6% or less. A contact sheet (`sheet.png`) confirmed that both renderers drew each feature. It rules out the case where both draw nothing and the diff reads 0%.

A real CodeImage theme renders in Node with no DOM. `ssr-highlight.mjs` imported `draculaTheme` from `packages/highlight/src`, collected its seven `StyleModule` rule sets (1,534 characters of CSS), and tokenized TypeScript with `highlightCode` from `@lezer/highlight`. The theme holds two `HighlightStyle` instances, and the first one alone left keywords uncolored. `real.mjs` rendered that output in Chrome and Takumi, and they differed in 0.07%. Takumi parsed the `ͼ`-prefixed class names that `StyleModule` generates.

Takumi SVG is plain SVG. `svgcheck.mjs` found no `foreignObject` in the 55 KB file. Chrome showed it through an `<img>` within 0.25% of the PNG. Text becomes paths, so the SVG text cannot be selected.

Timings are single runs and are not a benchmark. Chrome took about 1.0 s to launch and 1.1 s for the first screenshot, then 0.2 s warm. Takumi took 26 ms for one PNG in a warm process. No limiter was identified, and the P3 and P4 perf blocks measure these numbers properly.

Takumi WASM runs inside the real app. `probe.mjs` exported `git archive HEAD` of this repo, installed it in the scratchpad, and ran the app in Vite with the mock API. In Playwright it exported the same frame three ways at device pixel ratio 2. The first was the app's own `exportSnippet` with `dom-export`. The second was `@takumi-rs/wasm` 2.19.0 in the page, fed the export node's `outerHTML` with excluded nodes removed, every rule in `document.styleSheets`, and the fonts named by the `@font-face` rules the node uses. The third was a Chrome element screenshot of the node, used as the reference. For the default 10-line snippet, Takumi differed from Chrome in 0.40% and `dom-export` in 0.64% to 0.67%. Each method ran five times per session. The `dom-export` medians were 263 to 285 ms across four sessions, and the Takumi medians were 36 to 38 ms. No limiter was identified, so these timings are not a benchmark.

The first run of `probe.mjs` reported 1.76% and was discarded. The Chrome screenshot included a "Debug preview" badge that the export excludes, and the Inter font answered 404 in the dev server, because `_inter.scss` sets the relative path `inter-ui/Inter (web)`. The rerun hid excluded nodes in the screenshot and served Inter from `node_modules`.

Two differences remained, seen by eye in `out/fixed-takumi.png`. Takumi drew the tab title in monospace. Its stack is `"Inter var", system-ui, -apple-system, sans-serif`, Takumi in the browser has no system fonts, and registering `InterVariable.woff2` as `Inter var` did not change the result. Takumi also drew the CodeImage watermark logo with a cut box and misplaced stripes. Rerunning with the SVG's inner `<style>` removed and its fills inlined (`INLINE_SVG=1`) did not change it. The cause of neither is isolated, and the P2 spike owns both.

The export node holds only the lines in the CodeMirror viewport. With a 196-line snippet, the Chrome screenshot of the node and the Takumi render both showed an empty window below the first screen of code, and they differed from each other in 0.15%. `dom-export` drew every line because `export-snippet.ts` sets `viewState.printing` during export. Its PNG was 2280 px wide while the node in the page was 1722 px wide, so the forced full render changes the layout during export. The timings of this case are not comparable, because Takumi drew fewer lines. This is why P2 depends on P1.

WOFF2 works. Takumi registered and drew the JetBrains Mono WOFF2 subsets the app loads. The WASM binary is 4,213,356 bytes, 1,830,684 bytes with `gzip -9`, and 1,399,360 bytes with `brotli -q 11`. These sizes come from the file on disk, not from a network transfer. `init()` took about 50 ms with the file served from disk. Collecting CSS and fetching fonts took about 630 ms on the first export of a page. The SVG output for the default snippet was 35,494 bytes with no `foreignObject`.

These questions stay unproven.

- Whether `renderToString` can render the real `PreviewFrame` and `TerminalHost` components. The P3 spike settles it.
- Why the tab title and the watermark logo differ in Takumi. The P2 spike settles it.
- The time to download the WASM over a real network. P2's perf block measures the cold first export.
- Whether the `setInterval` in `PreviewExportEditor.tsx` causes measurable idle CPU. This comes from reading the code, which starts one interval per transaction and never clears it. P1 lane 7 checks it.

## Appendix B. Alternatives rejected

Satori lost on parity. It collapses whitespace between inline spans, supports only inline styles, and skips `backdrop-filter`. Matching CodeImage would need a second styling system written for Satori, which is the CSS complication the operator wants to avoid.

Option B is a Playwright render page, and it stays as the fallback. The CLI would ship a small static build of `StaticCodeView` and drive the user's Chrome, or a downloaded `chrome-headless-shell`. Parity is exact because the engine is the same. It costs a browser dependency and about one second of launch per cold run in the prototype. P3 switches to it only if the SSR spike fails.

A hand-written SVG generator with real `<text>` elements lost on cost. It would reimplement shadows, blur, and gradients by hand. It is the only path to selectable SVG text, so it stays a possible later feature for blog embeds.

The MCP server was dropped at the operator's request.

The LinkedIn PDF carousel was dropped at the operator's request. One image per tab (P8) covers multi-image posts on X.

Fetching presets from the CodeImage API with a login in the CLI is deferred. The **Copy as CLI config** action in P4 covers presets without auth.

Making Takumi the default web rasterizer is deferred. P2 ships it behind a flag that defaults to `dom-export`. Once the P2 parity script and real use show no regressions, flipping the default and deleting `@codeimage/dom-export` with its `experimental_*` options is a separate decision. The iOS share workaround in `use-export-image.ts` stays either way, because it concerns the share API.

Reading the export node before P1 was rejected. The node holds only the CodeMirror viewport, so long snippets would lose lines unless Takumi reused the `viewState.printing` hack that P1 deletes.

Masking a secret only in the image was rejected for P6. It needs ranges that follow edits, a database column, and a mask at every output. The secret would also stay in IndexedDB and, for a signed-in user, in `SnippetEditorTab.code` on the server. Replacing the characters in the document has none of these costs, and undo covers a mistake within the session.

Blurring a secret was rejected. A blur keeps the original pixels mixed rather than removed. Replacing the characters avoids that.

Alt-only shortcuts for marks were rejected. `@codemirror/view` 6.40.0 skips Alt-only bindings on macOS because they type characters, so P5 binds `Mod-Alt` instead.

A before-and-after compare mode for diffs is deferred. It would import a previous version from a dialog and turn the computed diff into one buffer with marks, so it needs no second editor. P5 covers pasted diffs and annotations first.

Rendering terminal output with ANSI colors was dropped at the operator's request. It serves command output rather than code.

Animated export was dropped at the operator's request for now. The Takumi WASM typings already include APNG and GIF output, so it would not need another engine later.

## Appendix C. Risks

Takumi is young. Version 2.19.0 is from 2026, and its API already deprecates `stylesheets` and `fromHtml` for v3. P3 pins the version, and the parity script in CI catches a regression on upgrade.

Takumi may silently differ on CSS the prototype did not cover. The P3 parity matrix runs every theme and terminal type in CI, and a cell over 0.5% fails the build.

Solid SSR may not accept the current components. Directives such as `use:exportExclude` and stores read at module load are the likely blockers. P3 starts with the spike and falls back to option B.

Takumi sees no system fonts. Any text in the frame that relies on `system-ui` or another installed font falls back to a registered font. P2 moves that text to fonts the app ships, which also makes the export identical across operating systems. Local fonts work only where the Local Font Access API exists, and MDN marks `FontData.blob()` experimental with limited availability.

The first Takumi export in a session downloads about 1.4 to 1.8 MB of WASM, depending on compression. Only users who turn the flag on pay it, and P2's perf block caps the cold export at 2 s.

The `Mod-Alt` shortcuts in P5 may collide with a browser or operating system binding. P5 lane 7 checks Chrome and Firefox, and the bindings live in one keymap, so changing them is one edit.

Language parsers load lazily. `tokenize` must await them, or the first export of a new language renders plain text. P1 unit tests cover it.

The live lanes have no `control-ui` or `control-cli` skill in this harness. Web lanes use Playwright and CLI lanes use tmux, as the boot recipe says.

The workspace currently has no root `node_modules`, and `package.json` has an uncommitted `@railway/cli` addition. Each owner runs `pnpm install` in its own worktree and leaves the operator's checkout alone.

## Appendix D. Links and reading list

- Discussion #619, "Iteration to refactor editor". P1 removes the two-editor sync it describes.
- Closed PR #617, `feat: add diff mode`, on branch `616-diff-style`. P5 reuses its gutter toggle and replaces its line-number storage.
- Closed PR #613, `feat: add git diff syntax highlight`.
- Takumi, https://github.com/kane50613/takumi.
- Shiki notation transformers, https://shiki.style/packages/transformers. P5 follows its `[!code ...]` syntax.
- gitleaks default rules, https://raw.githubusercontent.com/gitleaks/gitleaks/master/config/gitleaks.toml. P6 ports its rules under the MIT license.
- MDN `Navigator.share()`, https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share. P8 shares several files through it.
- `~/.claude/skills/how/SKILL.md` before P1, P2, and P3. `~/.claude/skills/interrogate/SKILL.md` before P2 and P3 merge, because they fix the renderer for every later PR.
- Keep the decision trail per `~/.claude/skills/show-me-your-work/SKILL.md`.
