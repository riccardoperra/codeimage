# Cross-PR review, 2026-11-14 about 10:50 (Opus, read-only)

"Confirmed" means traced in code. "Plausible" means inferred, not run. Paths are relative to each PR's worktree.

## Operator decisions applied by the coordinator

- P3 must not ship a Chromium render path. Fix `createUniqueId()` at module load (`state/plugins/unique-id.ts:4`, called by `state/editor/editor.ts:17`) and rerun the SSR spike. Option B only with the operator's explicit OK.
- P7's new `SnippetFrame` columns (migration `094000_frame_social_exports`) are accepted, with the aspect-ratio target in its own field, not overloaded into `aspectRatio`.
- `$version`: accept any version whose shape parses; reject only a newer major or an unparseable shape. Never pin to one app version.

## Fix before anything else

1. P3 renders through Chromium (`packages/render/src/render.ts:70`) to work around Solid's `createUniqueId()` at module load. One-line root fix in `state/plugins/unique-id.ts:4`. With a browser, P3's 300 ms and P4's 1.5 s perf limits cannot pass.
2. P3 accepts only `$version === '1.10.0'` (`document.ts:4,67`). The app stamps `$version` with its own version (`createEditorSync.ts:113`), as does P4 (`snapshot.ts:88`). After the next release every saved project is rejected.
3. The snapshot shape is defined three times: P3 zod 3 (`document.ts:6-51`, strips unknown keys so P5 `marks` is lost), P4 zod 4 (`snapshot.ts:7-38`), API typebox. P3 owns the one schema; P4 imports it; one zod major.
4. `apps/codeimage/package.json` gets five different `test` scripts (P1, P2, P5, P8, P9); P2 and P5 each add a `vitest.config.ts`. P1 owns one vitest setup (P2's `@core` alias, `src/**/*.test.ts`); others switch to it.
5. P8 polls `previewEditorView` (`export-snippet.ts:76`), which P1 deletes.

## Cross-PR conflicts and owners

- `PreviewExportEditor.tsx`: P1 deletes it and also removes `canvasEditorEvents` (`state/editor/editor.ts:307`) and the `exportSnippet = exportImage` alias. P5 renders marks in `StaticCodeView` as `data-mark` from the store. P6 drops its sync fix there.
- `export-snippet.ts`: P1 owns. P7 moves `fitFrameWindow` into `PreviewFrame`. P8 replaces its polling with a P1 `PreviewFrame` prop that renders a given tab without changing the active tab.
- `use-export-image.ts`: P2 owns. P8's SVG-as-Blob fix moves into P2's `domExport` (blob branch ignores format at `domExport.ts:32`, a trunk bug). P7's `pixelRatio` override moves into P2's rasterize options, reading the frame store, not a `data-export-target` DOM attribute.
- `PreviewFrame.tsx`: P1 owns; P7 wraps the terminal in `FittedWindow` after rebase.
- `CustomEditor.tsx`: P1 moves `baseTheme` and removes the event emit; P5 keeps writing marks in `onTransactionDispatched`.
- API: P5 and P7 both change `schema.prisma` and ten project files; real conflicts in `update()` and `clone()` in `project.service.ts`. Whichever merges second renames its migration folder to a later timestamp.
- Export UI: P9 moves `CopyAltTextButton` to its own file (today `FrameToolbar.tsx:8` imports it from `ExportContent`).
- i18n: one module per feature like P6's `i18n/secrets.ts`. P8 and P9 move out of the `export:` block. P2, P4, P5 move hard-coded English strings into modules.
- Root `package.json`: three Playwright versions (P1 `playwright` 1.57.0, P2 `playwright-core` 1.65.1, P3 runtime `playwright` 1.56.1) and two pixelmatch majors. P1 owns parity dev dependencies and `scripts/parity/lib.ts`. Regenerate `pnpm-lock.yaml` with `pnpm install` on every rebase.
- `public/mockServiceWorker.js` was regenerated from MSW 0.47 to 2.12.14 by the dev server in P1, P2, P5, P6. Revert it in all four.

## Per PR

**P1.** High, plausible: `StaticCodeView.tsx:63` tokenizes in a `createResource` that always awaits (`tokenize.ts:19`) under the `<Suspense>` at `PreviewFrame.tsx:36`, so every keystroke and tab switch can flash `FrameSkeleton`, and sync SSR cannot wait. Load the language in a resource keyed on `languageId`, tokenize synchronously in a memo. Medium: `StyleModule.mount(document, …)` inside a memo (`:91`) crashes on the server and leaks a module per font change; mount client-only and expose modules for `getRules()`. Medium: `themeClasses` (`:22`) misses `EditorView.baseTheme` rules. Low: remove `canvasEditorEvents` and the alias; add a changeset.

**P2.** High: swapping every inline SVG for `<img>` at export (`takumi.ts:161-186`) instead of fixing the components; P3 has no such step. Fix the components and record the cause. High: P2 passes `width × pixelRatio` plus `devicePixelRatio` (`takumi.ts:287-310`), P3 passes CSS width plus `devicePixelRatio` (`render.ts:105-117`); one is wrong, verify against Takumi docs and output size. P2 uses deprecated `stylesheets`, P3 uses `css`. Medium: renderer read through a module-level variable (`config.store.ts:44-53`) returns `dom-export` before the store exists; pass the renderer in the export payload. Medium: fix the SVG blob bug in `domExport.ts:32`. Low: Settings strings English only (`SettingsDialog.tsx:146,155,195`); `?renderer=dom-export` cannot switch back (`config.store.ts:59`); CSS re-parsed every export.

**P3.** Blocker: Chromium render page (above). High: version pin and key stripping (above). Medium: `document.ts:2` imports an app type by relative path into a published package. Low: leftover `entry-server.tsx` spike; `libs:build` now runs a full app Vite build; about 13k lines of TTF committed; font lookup guesses names by replacing dashes with spaces (`render.ts:42`).

**P4.** High: `@codeimage/render` is not a dependency (`package.json:19-21`) and `render.ts:5-8` hides the import behind a string; the packed tarball fails at runtime. High: duplicate preset schema in zod 4. Medium: `THEME_REGISTRY` imported from app source (`args.ts:3`); language-from-filename (`args.ts:31`) duplicated in P5, make it `inferLanguageFromPath` in `@codeimage/config`. Low: preset copy and toasts English only; `presetSchema` strips P7's `signature` and target.

**P5.** High (rebase): marks reach the export through the hidden editor (`PreviewExportEditor.tsx:28,37`); after P1 render them in `StaticCodeView`. Medium: `lineMarksStyle` is a `baseTheme` (`style.ts:4`) and will not match in `StaticCodeView`; use `EditorView.theme` or global CSS, and put `data-line-focus` on the static root. Medium: `<Show keyed>` (`CanvasEditor.tsx:251`) remounts CodeMirror on each tab switch; dispatch `replaceMarks` instead. Medium: all new UI text English only (`CanvasEditor.tsx:145`, `controls.ts:18-21,71`). Low: `parseUnifiedDiff.ts:50-62` rejects a diff whose context line lost its leading space. Low: bare `1 + 6` tab limit (`:97`); `parseTabMarks` validates at four layers.

**P6.** Medium (rebase): drop the `PreviewExportEditor` edit. Low: module-level `activeView` (`plugins/secrets/index.ts:37-49`) is hidden state. Good: its i18n module pattern is the one to copy; redaction keeps lengths and newlines.

**P7.** High: `projectMockHandlers.ts` not updated; the mock builds `frame` from five fixed fields, so signature and target vanish on save in mock mode. Medium: `aspectRatio` holds either a ratio or a target id and the API stores it as text; give the target its own field. `getExportTarget(...aspectRatio)` appears 6 times; one computed on the frame store. Medium: pixel ratio forced to 1 in two places; keep only `exportImage`. Plausible: create and update responses never map stored signature columns back.

**P8.** High (rebase): polling the hidden editor. Medium: `activate(tab.id)` switches the user's active tab N times, and with P5's remount each switch rebuilds the editor.

**P9.** Low: header says "Typescript" (`languages.ts:110`), plan expects "TypeScript". Low: button added to `FrameToolbar`, outside the boundary; tests in `tests/` under another test command. Low: `Array.from` counts code points; use `Intl.Segmenter` so joined emoji are not split.
