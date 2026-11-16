---
name: verify-codeimage
description: Verify CodeImage's web editor, settings, signatures, line marks, presets, secrets, exports and saved projects through real browser actions and downloaded artifacts. Use after changing user-facing behavior or investigating regressions.
---

# Verify CodeImage

Primary surface: SolidJS browser app in `apps/codeimage`. Secondary surfaces: Fastify API (`apps/api`) and marketing site (`apps/website`); this skill does not certify those deployments.

## Launch

Choose the backend first using [backend modes](references/backend-modes.md). The automated commands below use MSW. For API and PostgreSQL integration, follow the real-backend prerequisites and doctor in that reference. Record which mode was actually exercised.

From the repository root, use Node >=24 and pnpm >=12 (packageManager pins pnpm 12.18.0):

```sh
pnpm install --frozen-lockfile
pnpm libs:build
pnpm exec playwright install chromium
node .agents/skills/verify-codeimage/scripts/verify.mjs
```

The executable helper starts the same Vite app as `pnpm dev`, bound to `127.0.0.1:4437` with strict port ownership, and runs launch → doctor → editor/export → cleanup. Each run owns a fresh `/tmp/codeimage-chrome-<port>-*` profile and a debugging port. `VERIFY_DEBUG_PORT` defaults to `VERIFY_PORT + 10000`; both ports are probed before launch. Doctor records the profile and debugging port, and cleanup removes only the owned profile. Override the server with `VERIFY_PORT=4438`; use `VERIFY_BROWSER_CHANNEL=chrome` for installed Google Chrome (default: Playwright Chromium); select a persistent evidence directory with `ARTIFACT_DIR=/tmp/codeimage-proof`. Use a new directory for each run.

It sets `VITE_ENABLE_MSW=true`, `VITE_MOCK_AUTH=true`, `VITE_API_BASE_URL=''`, and preset limits in the child environment. It creates an empty browser context (English, 1440×1000), with no user storage or project seed. An owned blank page keeps MSW’s controlled-client registration alive across app reloads; it runs no app code or document writes and closes with the context. No DB migration or Docker is needed for this supported mock boundary. Auth0 and project HTTP traffic use the app's existing development adapters; real authentication, PostgreSQL persistence and production API behavior remain unverified. No private credentials are needed.

Ready means MSW has enabled AND the actual editable CodeMirror surface is visible, fonts loaded, and the welcome dialog dismissed. An HTTP 200 alone is insufficient. The checked-in worker is older than installed MSW; the helper serves the installed `msw/mockServiceWorker.js` from a temporary public directory containing copies of the app assets. This scaffolding never edits `public/`. The helper uses Vite’s createServer API with the repository configuration to override only publicDir, host and port.

Two runs can coexist on distinct ports and browser contexts. Each helper run uses its own temporary Vite dependency cache, so another checkout cannot invalidate its optimized dependencies mid-journey. Never drive the user's existing browser profile or occupied port. Workspace dependencies and library builds are shared: finish setup before concurrent runs; do not run competing builds.

## Doctor

Run the helper first when anything looks off. Its read-only doctor checks its own Vite PID is alive, HTTP responds, the fresh context reaches the editor, MSW announces readiness, and records the source HEAD and browser version banner in `doctor.json` / `run.log`. It never attaches to an existing server. A failed check produces `result.json` and cleans up. Inspect those files before changing selectors or increasing timeouts. HEAD alone does not identify uncommitted edits; retain the relevant diff with review evidence.

## Drive

The helper's Playwright sequence is the executable baseline. It uses `.cm-content[contenteditable="true"]`, the direct export button `[data-export-image]` on `/` (fresh contexts default to PNG). It edits through the contenteditable surface and captures a real download, never calls editor stores or exporter internals.

Add browser journeys as named cases in `scripts/audit.mjs` or its case helpers, selected through `VERIFY_CASES`. Keep the helper's launch, doctor, trace and finally cleanup. Use the instructions in [features/README.md](features/README.md). Existing reusable recipes live in `scripts/parity/lib.ts` and `scripts/parity/export-cases.ts`; some older scripts dispatch internal editor state and are not sufficient user-path proof on their own. The unified editor downloads directly. The default helper proves only editor-to-PNG. Run the serial maintenance pass with `VERIFY_AUDIT=1 node .agents/skills/verify-codeimage/scripts/verify.mjs`; its `audit.json` records each mapped journey, screenshots capture each state and the shared trace records actions. See the index for the exact coverage and remaining sub-features. One owned Vite instance serves the entire pass; each scenario navigates to a known state and rechecks process/HTTP/editor health, including after failures. The shared context's authentication journey runs last because it changes its root route into Dashboard. Snippet journeys sign in inside disposable contexts.

## Evidence

By default evidence survives under `/tmp/codeimage-verification-<timestamp>`; copy it somewhere durable before OS temp cleanup. The helper prints the exact absolute path. Audit adds `audit.json`, feature screenshots, failed-state accessibility snapshots, SVG/ZIP downloads and a project ID/URL record. Artifacts: `before.png`, `export-settings.png`, `after.png`, actual downloaded `snippet.png`, `trace.zip`, `doctor.json`, `result.json` and `run.log`. Inspect the downloaded PNG for the entered text and layout, alongside the decoded dimension/content checks; successful download alone does not establish visual fidelity. Open a trace with `pnpm exec playwright show-trace /tmp/codeimage-proof/trace.zip`.

Capture action and resulting state, not only a final screen. Assert observable side effects too: decode downloaded files; reopen saved projects after reload; capture mutation responses. Use mocks only at the existing MSW/Auth0 development boundaries. This is a real local app run with mocked services, not a proof of live backend integration. It is not a dry-run: it starts a local server, serves assets and writes real downloads/evidence. Do not assume absence of external network traffic; inspect trace/network when that matters.

## Cleanup

The helper's `finally` closes its browser/context and terminates only its own Vite child (TERM, then KILL after five seconds). No process-name kills. The disposable context removes browser storage, mock data and temporary public-directory scaffolding. No app environment file is created. Evidence is excluded from cleanup and the helper reads `result.json` again afterward to confirm survival. On interruption, terminate the exact PID in `doctor.json` after checking it still belongs to this run; never kill unrelated listeners. Failed iterations also run cleanup.

## Helpers

Select `VERIFY_CASES=keyboard-scroll` for keyboard opening of scrollable-panel menus and selects across Inspector, Dock, and Studio at desktop and phone sizes. The Node watchdog interrupts a frozen renderer after five seconds. Read [keyboard coverage](features/keyboard.md) for discovery rules and evidence. Run `fnm exec --using=v24.14.0 node --test .agents/skills/verify-codeimage/scripts/keyboard-scroll.test.mjs` for the dependency traversal regression.

`node .agents/skills/verify-codeimage/scripts/verify.mjs` runs the full baseline. It is executable and accepts `VERIFY_PORT` and `ARTIFACT_DIR` environment overrides. To re-run selected journeys, set `VERIFY_CASES=export-options,settings-persistence` together with `VERIFY_AUDIT=1`. Omit `VERIFY_CASES` for the complete pass. Unknown names fail the run. `audit.json` lists only the journeys actually selected and is flushed before recovery after a failure. `animation-cells.json` is flushed after each animation matrix cell, including failures, so interrupted batches retain exact coverage. On a shared machine, use short `VERIFY_CASES` batches, unique server/debugging ports, and retry a killed case at most twice. Never terminate another session’s processes.

The editor has two layouts, Sidebar and Dock. The Sidebar navigates its sections as an Accordion or a Rail, a preference in Settings → Appearance. The scripts still name three scenarios: `inspector` is the Sidebar's Accordion and `studio` its Rail on the left. They save `layout: 'inspector'` or `layout: 'studio'` in `codeimage:editor-settings`, and the app reads such a record as that Sidebar navigation. The page root carries `data-layout="sidebar|dock"`, `data-panel-nav` and `data-panel-side`.

Select `VERIFY_CASES=frame-cold-start,export-screen-parity` for frame startup and downloaded-PNG/screen regressions. Browser regressions belong to this audit; the app-folder verification scripts are retained legacy checks. The cold-start case starts with the helper’s empty, isolated dependency cache, then uses two fresh contexts per layout and viewport (normal and delayed modules). `VERIFY_COLD_START_STRESS=1` expands that case to 120 starts: twenty per layout/viewport pair, with two seconds of sampling after readiness instead of the default half-second. Both modes use the same owned server and MSW boundary, with evidence under `ARTIFACT_DIR`.

The audit helper `scripts/audit.mjs` is invoked by the main helper when `VERIFY_AUDIT=1`; it is not a standalone server command. It resolves fflate from the app workspace for ZIP checks. All dependencies come from this workspace. Chromium clipboard permissions are granted for real paste and image-copy journeys. The snippet Share check supplies a Web Share input fixture because headless Chromium has no OS share sheet. Native sharing remains a separate integration check. Keep feature files aligned using `/maintain-verification-skill`.

`node .agents/skills/verify-codeimage/scripts/capture-design.mjs <base URL>` refreshes the six reference screenshots in `docs/design/screenshots/` that `DESIGN.md` shows. Start the app yourself first, on a port you own, and pass its URL. It opens a fresh context per view, saves the layout preference before load, and moves the pointer off the theme list, because a hovered theme card previews on the canvas. These six files are the only screenshots kept in the checkout. Run it in the pull request that changes the look, and look at each image before committing.

## Scope and maintenance

The feature map follows this checkout, not proposals or unmerged branches. Source readers must check recent commits for new user-facing paths before claiming completeness. The Animate panel of the guest editor is mapped in [features/animate.md](features/animate.md); the Node renderer and CLI are mapped in the specialist feature pages below. Live runs use the real local web app with its existing MSW/Auth0 boundary; production OAuth, PostgreSQL and platform-native sharing remain separate integration checks. Audit assertions prove selected journeys, not every format, control, language or viewport.

## Legacy check migration

Read [the retirement plan](references/legacy-checks.md) before deleting another verification script. Functional journeys do not replace renderer parity, geometry matrices, locale matrices or performance measurements. The extended `projects` journey includes the unique MSW persistence checks required to retire its old smoke script. The six `snippet-*` cases in `scripts/snippets.mjs` replace the app-level snippet script. See [saved projects](features/projects.md) for the case names, matrix and selected-run command.

## Specialist checks and stored artifacts

Read [specialist checks](references/specialist-checks.md) for retained renderer, line-mark and locale commands. The skill stores reproducible procedures, not the screenshots and logs from earlier runs. Keep reviewed test inputs beside their consuming scripts. Store per-run evidence outside the checkout; Git history retains retired reports.

## Node renderer and CLI checks

Run these from the repository root after the library build, with Node 24. Each Node command is a fresh CLI session; check its exit status and written receipts before the next drive. A failure requires inspecting its log and resetting only its own output/cache before retrying. The browser case uses the existing owned launch, doctor, trace and cleanup.

- [CLI feature flags](features/cli-feature-flags.md): `node .agents/skills/verify-codeimage/scripts/cli/feature-flags/index.mjs /tmp/codeimage-flags`.
- [CLI font delivery](features/cli-font-cache.md): `node .agents/skills/verify-codeimage/scripts/cli/font-cache.mjs [other-installed-cli/dist/bin.js]`.
- [CLI MP4 encoding](features/cli-mp4.md): `node .agents/skills/verify-codeimage/scripts/cli/mp4/index.mjs /tmp/codeimage-mp4 [before/dist/bin.js]`.
- [Cached font pixel parity](features/render-font-parity.md): `node_modules/.bin/tsx .agents/skills/verify-codeimage/scripts/cli/font-parity.mjs /absolute/baseline/dist/index.mjs`.
- [Immutable font sources](features/render-font-urls.md): `node .agents/skills/verify-codeimage/scripts/cli/font-urls.mjs [manifest.json]`.
- [Web and CLI MP4 parity](features/web-cli-mp4.md): `VERIFY_AUDIT=1 VERIFY_CASES=web-mp4 VERIFY_BROWSER_CHANNEL=chrome node .agents/skills/verify-codeimage/scripts/verify.mjs`.

Give each run an evidence directory outside the checkout. Redirect each command to its own log; preserve its results and artifacts before cleanup. The font-cache helper prints its evidence directory. Optional baseline/installed-CLI arguments must resolve their own dependencies.
