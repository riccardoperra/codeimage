# Solid 2 migration

The CodeImage editor and Node renderer run on Solid 2. The editor used a temporary Solid 1 bridge until a Solid 2 CodeUI preview became available. P7 records the native CodeUI cutover. P6 covers the marketing site.

The initial migration baseline is `main` at `b7c2efe1`. The [tab drag-and-drop replacement](https://github.com/riccardoperra/codeimage/pull/798) has landed. `@dnd-kit/dom` has no Solid peer. Keep the `tabs` and `tabs-classic` audit cases in the cutover checks. The prior WebKit run passed the tab journey and reported startup ResizeObserver warnings. Physical iOS Safari remains unverified.

## Landing order

The IDs below name the workstreams. P2 and P3 move into the app cutover branch with P5. Keep the existing app available while the branch reaches browser and renderer parity.

| ID  | Change                                                                        | Depends on                                                                                                                                                     |
| --- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0  | Replace `solid-dnd` with `@dnd-kit/dom`                                       | Merged in #798                                                                                                                                                 |
| P1  | Prove the current CodeUI bridge with ExportControl and the dashboard Dropdown | Browser proofs passed. The Vite package and dashboard probe are in [#800](https://github.com/riccardoperra/codeimage/pull/800). The editor cutover stays in P5 |
| P2  | Integrate `solid-codemirror` 3.0 in CodeImage                                 | 3.0 published and exercised in the preset comparison pilot. Use it in the Solid 2 app                                                                          |
| P3  | Adopt the statebuilder 0.9 API and prove the Solid 2 persistence contract     | The Solid 2 alpha passes strict install and Node import. Verify CodeImage persistence in P5                                                                    |
| P4  | Resolve the UI that renders directly inside Solid 2 trees                     | P1                                                                                                                                                             |
| P5  | Switch the browser app to Solid 2, then verify the renderer                   | P1 through P4. Port and verify the app in subsystem commits                                                                                                    |
| P6  | Upgrade the marketing site                                                    | P2 and a verified TanStack Solid 2 package set                                                                                                                 |
| P7  | Adopt the new CodeUI design system                                            | P5 and suitable CodeUI builds                                                                                                                                  |

## P1. Bridge the current CodeUI

### ExportControl

Capture a Solid 1 baseline with the current UI. Keep the baseline assets for P5. Start with the existing `@codeui/kit@0.1.5` and the real `ExportControl` from `apps/codeimage/src/pages/UnifiedEditor/shell/ExportControl.tsx`.

- Compile the Solid 2 host separately from the Solid 1 app. Mount a separate Solid 1 root for the whole control. Keep the existing app's Solid 1 locale and state owner on the legacy side of the proof.
- Pass a plain snapshot across the boundary for ready, busy, tab count, secrets, and review state. Route image, confirm, and cancel calls through callbacks. An image request carries its complete `ExportChoice` with format, scale, and quality.
- Keep the real exporter and frame alive in the Solid 1 app for this proof. The host owns the browser mount and teardown. This isolates the compatibility question from the renderer and state ports.
- In Chrome, open the export menu, pick PNG at two different scales, and decode both downloads. Assert the requested scale crossed the bridge. Verify Escape, focus return, the export hotkey, and cleanup when navigating away with the menu open.
- Extend the boundary to the Solid 2 editor only after identifying its remaining state and view dependencies. Review image, animation, share, clipboard, per-tab export, preferences, and secrets separately before relying on the bridge in production. Keep the bridge out of the CLI and server build.

The browser prototype passed on `b7c2efe1` with Solid 1.9.12, Solid 2.0.1, and CodeUI 0.1.5. In Menu mode, the app's renderer downloaded a 544 × 244 PNG at 1× and a 1088 × 488 PNG at 2×. Both dimensions matched the unbridged editor. The exported text pixels differed in that comparison, so pixel parity remains a cutover check. Dialog mode showed its image preview and downloaded the same 2× dimensions. The shortcut, secrets review, Escape and focus return, and portal teardown passed. This run verified the browser boundary with a Solid 2 host and the current Solid 1 frame, stores, and exporter. The runtime cutover still needs a Solid 2 canvas and exporter.

[Editor architecture and export flow](../../apps/codeimage/src/pages/UnifiedEditor/README.md) · [ExportControl](../../apps/codeimage/src/pages/UnifiedEditor/shell/ExportControl.tsx) · [Production exporter](../../apps/codeimage/src/pages/UnifiedEditor/shell/export.tsx)

### Dropdown and Vite

The first standalone build proved a manual adapter with plain snapshots and callbacks. The current prototype adds a Vite transform before Solid 2 compilation. It compiles the Dashboard's shared `ProjectActionsMenu.tsx`, including `as={IconButton}` and the project icon. It also transforms a direct `@kobalte/core/dropdown-menu` import. Each Dropdown gets one Solid 1 root, and both share the same legacy browser bundle. The standalone host supplies the translations and records actions instead of performing project mutations.

Chrome verified mouse selection, reactive translated labels, keyboard focus, Escape, portal removal on unmount, and remount. Enter activates the direct Kobalte menu's `onSelect`. The original project items use `onClick`. Enter closes that menu without invoking the item handler in both the bridged case and the Solid 1 baseline.

Inventory used CodeUI and direct Kobalte exports together. Add transform rules by component family so parts that share context move together. Check polymorphic triggers, dynamic children, refs, and slots in each real call site before enabling the transform. Route UI that needs arbitrary Solid 2 composition to native components. Keep the SSR frame and CLI renderer on a native Solid 2 dependency graph.

The same `createLegacyMount` and `createSolid1Bridge` factories mount the generated Dropdown subtrees and a standalone CodeUI Button. The plugin replaces the Button import and preserves its JSX call site. The generated Solid 2 code imports the factory from the plugin's `virtual:solid1-bridge` module. Chrome verified that changing the label and callback keeps the same DOM node, that disabled blocks selection, and that Enter calls the current handler when enabled. The default bridge accepts flat props and text children. Each compound family defines which dynamic values its generated component reads.

The reusable workspace package accepts explicit source entries and standalone or compound export rules. The client build registers the editor islands and the dashboard project menu in `apps/codeimage/solid2/islands`. The dashboard still owns mutations and dialogs. The menu dispatches the selected action after the legacy overlay releases the document pointer lock. The Chrome audit on the MSW backend covers Escape and focus return, rename, clone navigation, and delete. The renderer and CLI use their own build graph.

The bridge plugin and prototype are available in the history of the cutover branch. [Bridge implementation](https://github.com/riccardoperra/codeimage/commit/84e9cd31)

## P2. Integrate solid-codemirror 3.0

The Solid 2 port is published as `3.0.0` and tagged at `97c1d41`. The tagged build and its 10 tests passed on Solid `2.0.1`. A strict-peer install of the published tarball in an isolated consumer resolved one copy of Solid and each CodeMirror peer. The default tarball URL returned 404 in this environment. A cache-busting request returned the tarball and its checksum matched the registry metadata. Confirm that a standard frozen install succeeds when landing the catalog change.

Pin 3.x with Solid 2 and keep 2.x in Solid 1 consumers. CodeImage's current CodeMirror `state` and `view` catalog ranges already match the new peer minimums. Run `pnpm --filter @codeimage/app why @codemirror/state` and the equivalent check for `@codemirror/view` after updating the catalog.

| Consumer                                                      | Code change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Pass condition                                                                                                                                                                                                                      |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/codeimage/src/components/CustomEditor/CustomEditor.tsx` | Pass the synchronous fields and plugins required before first dispatch through `createCodeMirror({extensions})`. Establish the line-marks field before exposing the view. Keep localized labels, theme, font, and other changing settings reactive. Use split effects for view observation and return the gutter-entry cleanup from the effect. Remove the extra read-only facet and tab stop once the 3.x helper covers both.                                                                                                                      | Fresh start displays marks and language correctly. Read-only commands remain read-only, and focus returns from animation preview.                                                                                                   |
| `CustomEditor.tsx` document updates                           | Separate tab navigation, store-driven text replacement, and Format. Tag external text changes with `ExternalChange.of(true)` and retain the marks effects in the same dispatch. Keep the explicit `addToHistory` policy. `onTransactionDispatched` still runs for external changes, so guard the marks write-back separately. Keep Format undoable as one step. Baseline the current tab history behavior first. `setEditorState` with a state per tab enables per-tab history and selection, so treat that behavior change as a separate decision. | Switching tabs never saves outgoing text to the incoming tab. A programmatic restore produces no redundant save. Format and undo restore both text and marks. Check callback counts when a dispatch contains multiple transactions. |
| `CustomEditorPreview.tsx` and language loading                | Keep `value` for initial text and use `createEditorControlledValue` for changes. Bind the library host ref directly and replace the manual extension effect with `createExtension(accessor)`. Use async memos for language and filename-dependent extensions. Use an initial empty extension so CodeMirror can accept input while loading. Return an explicit previous value when a compartment must retain it.                                                                                                                                     | A late language result cannot replace the language of the active tab after a rapid switch. The preview updates text, theme, and language without becoming editable.                                                                 |
| `CanvasEditor.tsx` and `core/watermark/codemirror.ts`         | Rewrite nested effects around focus and editor view registration. Review the new blur behavior of `createEditorFocus`. Keep secret scanning, line marks, watermark measurement, and animation extensions on CodeMirror's plugin and compartment APIs.                                                                                                                                                                                                                                                                                               | Repeated mount and unmount leaves one active view and one listener per extension. Secrets, watermark placement, and animation interactions still follow the active tab.                                                             |
| `apps/website` and `packages/highlight/dev`                   | Give these consumers their own catalog choice while Solid 1 and Solid 2 builds coexist. In the website demo, replace the private `dist/types/core/createLazyCompartmentExtension` import before picking up 3.0's public export map. Use the lazy helper for one-shot loads.                                                                                                                                                                                                                                                                         | The app build can resolve 3.x while a retained Solid 1 demo resolves 2.x. Each demo loads and reconfigures language and theme.                                                                                                      |

[3.0 release](https://github.com/riccardoperra/solid-codemirror/releases/tag/solid-codemirror%403.0.0) · [3.0 migration guide](https://github.com/riccardoperra/solid-codemirror/blob/solid-codemirror%403.0.0/MIGRATION.md) · [CustomEditor](../../apps/codeimage/src/components/CustomEditor/CustomEditor.tsx) · [CanvasEditor](../../apps/codeimage/src/components/CustomEditor/CanvasEditor.tsx)

## P3. Adopt statebuilder 0.9 and preserve persistence timing

The published `statebuilder@0.9.0-alpha.1` declares `solid-js: ^2.0.0`. A strict-peer install and ESM import succeeded in an isolated Node 24 consumer with a single `solid-js@2.0.0`. CodeImage still needs to migrate the 0.9 consumer API and prove persistence and provider ownership in the app and renderer.

| Step                                | Work                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Pass condition                                                                                                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P3a. Consumer API on Solid 2        | Pin the Solid 2 alpha in the app cutover branch. Migrate `StateProvider` and `provideState` to `StoreProvider` and `useStore` in the app, editor, and renderer. Verify the standalone `Container.create` in `state/index.ts` and scope each provider explicitly where it needs a private store. Convert `makePlugin` and the canvas init hook to `createPlugin` and the new lifecycle API. Audit command observers in editor, frame, and terminal stores and the async actions used by presets and signatures. | The migrated editor and CLI renderer pass with the 0.9 API. Two provider instances and successive renders preserve the intended store ownership. Persisted 0.8 project data still loads. |
| P3b. Statebuilder build for Solid 2 | Use the published Solid 2 artifact. Run provider mount and disposal, store updates, and command observation in a browser build alongside the completed strict-peer install and Node import.                                                                                                                                                                                                                                                                                                                    | The published build imports on Solid 2 without overrides and resolves one Solid 2 runtime. The editor and renderer can use it in P5.                                                     |
| P3c. Committed snapshots            | Port the Solid 1 store and observable APIs in the live `@codeimage/atomic-state` consumers. In the UI storage plugin, serialize committed values. In `createEditorSync.ts`, verify IndexedDB restore, local and remote writes, and cleanup when the active project changes.                                                                                                                                                                                                                                    | An edit followed by an immediate save persists the new state. A late response or pending write cannot overwrite the next project. Presets, signatures, and tab ordering survive reload.  |

[Published statebuilder alpha.1 manifest](https://registry.npmjs.org/statebuilder/0.9.0-alpha.1) · [Editor sync](../../apps/codeimage/src/state/editor/createEditorSync.ts) · [Atomic-state adapter](../../packages/atomic-state/src/createStore.ts)

## P4. Resolve the UI that renders inside Solid 2

- [ ] Identify complete client widgets that can keep the P1 boundary. Generate browser entries per widget in a shared legacy build with a single Solid 1 runtime. Each widget owns its portal, focus, and disposal. Verify the combined bundle, browser chunk loading, and CSS under the app's CSP before relying on the plugin in the editor. Track HMR separately.
- [ ] Provide a native Solid 2 build for the reusable controls that render directly inside Solid 2 trees. Start with the current API and appearance. Evaluate the current kit entry points used for buttons, fields, listboxes, and dialogs. Run a real application build to check dependency resolution.
- [ ] Use a compatible Kobalte release or an explicitly pinned, tested build. The published Kobalte `2.0.0-alpha.4` pins both Solid packages to RC.16. Check direct Kobalte imports and the nested scrolling patch. Port the Solid 1 virtualizer adapter or prove a regular list is usable with the large font fixture.
- [ ] Exercise Settings, the tab-name combobox, and the system-font picker. Verify portal focus, keyboard selection, and scroll position. Check the static frame renderer separately. Its UI dependencies must resolve in the Solid 2 build that produces the export.

[Kobalte migration tracker](https://github.com/kobaltedev/kobalte/issues/653) · [Published Kobalte alpha](https://registry.npmjs.org/@kobalte/core/2.0.0-alpha.4) · [CodeUI virtualized listbox](https://github.com/riccardoperra/codeui/blob/main/packages/kit/src/components/Listbox/VirtualizedListbox.tsx)

## P5. Switch the CodeImage app to Solid 2

The cutover runs the app, router, locale, statebuilder, CodeMirror, and workspace UI on Solid 2. It temporarily loaded CodeUI controls through a separate Solid 1 build. The Dashboard used the app menu with a bridged trigger after Chrome froze with the fully bridged menu. P7 removes the legacy build and the Vite transform.

The renderer builds separately and creates editor state for each request.

The cutover passed the Node 24 production builds, app typecheck, lint, and the app, bridge, renderer and CLI suites. Chrome verified saved projects, read-only cloning, Settings and preset persistence, tab reordering, keyboard navigation in all three layouts, and real PNG, ZIP, GIF and MP4 downloads. CodeUI redesign adoption and the marketing site upgrade remain in P7 and P6.

1. Switch the browser compiler, root, router, locale provider and store providers. Get a guest editor and one saved project to load and save.
2. Port the editor, stores, CodeMirror, tabs and canvas in subsystem commits. Check persistence and export as soon as the relevant paths work.
3. Bridge the remaining Solid 1 UI by widget or family. Exercise Settings, Export and compound overlays before expanding coverage.
4. Port the Node renderer and verify the browser and CLI output before releasing the cutover.

ReadOnlyNotice, Settings search and the preset comparison already exercised the temporary Solid 1-to-2 boundary. Reuse their Solid 2 implementations and browser cases where they fit. Remove the reverse mounts from the app as their consumers move to the Solid 2 root. Keep the Solid 2-to-1 bridge until the remaining legacy widgets have native replacements.

### P5a. Compiler, imports, and types

- Give the app Solid 2, `@solidjs/web`, and the Solid 2 Vite plugin. Keep explicit versions and compiler inputs for the bridged Solid 1 widgets. Use the verified CodeMirror and statebuilder builds in the Solid 2 graph. Keep the website on its Solid 1 catalog until P6.
- For each migrated module, move renderer imports and DOM JSX types to `@solidjs/web`, move store imports to `solid-js`, and migrate provider types in the owning runtime. Check the emitted JS of shared workspace packages and keep an explicit list of legacy widget entries.
- Gate this pass with frozen install, workspace builds, TypeScript, and client and Node build graphs. Verify that CodeImage browser code resolves Solid 2 and only the explicit legacy widget graph still resolves Solid 1.

### P5b. App entry, routing, and providers

- At the start of the app cutover, port `src/index.tsx` to the Solid 2 renderer and `createRouter`. Move route definitions, redirects, links, and navigation hooks together. Port the locale provider in `packages/locale` and apply P3 ownership to the app and editor providers.
- In `pages/Dashboard/dashboard.state.ts`, migrate fetching, refresh and mutations while preserving initial loading, empty and error states, and the current list during refetch. Verify auth callbacks and project URLs, including guest, authenticated, missing, and read-only projects.
- Gate this pass with routing, locale switching, and the dashboard `projects` journey, including refresh and navigation back from a saved snippet.

### P5c. Editor state and persistence

- Port `state/editor/`, `state/ui.ts`, `state/canvas.ts`, and the active `packages/atomic-state` adapters. Migrate path setters to draft setters and change observers and effects to read committed snapshots. Use the compute phase to track dependencies and return cleanup from the effect phase. Review top-level reactive reads, nested scopes, and setters that currently rely on a same-turn read.
- In `state/editor/createEditorSync.ts`, separate fetching a project, applying it to the active stores, and saving it. Give clone its own action. Bind local and remote writes to the project and snapshot they were created for. Apply the P3 checks for IndexedDB restore and existing data.
- Gate this pass with immediate save after an edit, project switch with a delayed response or pending write, persistence reload, and read-only mode. Add `flush()` at an imperative boundary only when it must observe a committed write in the same turn.

### P5d. CodeMirror, tabs, and native interactions

- Integrate P2 in `components/CustomEditor/CustomEditor.tsx`, `CanvasEditor.tsx`, and `CustomEditorPreview.tsx`. Migrate view setup and disposal, tab selection and history, document write-back, and language or theme reconfiguration.
- Port `components/Terminal/Tabs/`, the Solid adapter around the imperative drag controller, and the listeners in `hooks/use-hotkey.ts`. Convert JSX events, `classList`, and directives to their Solid 2 forms. Preserve listener options and cleanup where native events are required. For example, move `use:highlight` in `ProjectItem.tsx` and `TabName.tsx` to refs.
- Gate this pass with tab reorder, focus and keyboard navigation, shortcuts, formatting and undo, and rapid language or tab switches. Verify listener teardown when leaving and reopening the editor.

### P5e. Canvas, theme and asset loading

- Port `pages/UnifiedEditor/stage.tsx`, `components/Frame/PreviewFrame.tsx`, `frameMedia.ts`, `state/theme/theme.store.ts`, and `state/assets/assets.ts`. Replace `createResource` and its status reads one flow at a time. Set clear loading and error boundaries, and preserve the last usable frame, theme, or asset where the current UI does. Track font loading and release media when the owner goes away.
- Gate this pass with cold start, a rapid theme or image change, font loading without a fallback flash, the active tab at first render, and matching canvas dimensions before and after preview state settles.

### P5f. Editor shell, settings, and controls

- Port `pages/UnifiedEditor/shell/`, `controls/`, `localized/`, `command-menu/`, and both layout variants. Convert provider use, JSX event and ref forms, and list and async boundaries. Apply the P4 choice for each remaining Solid 1 widget. Check first-party features outside those directories that use the same APIs, including What's New and editor tools.
- Gate this pass with Sidebar and Dock, phone sheet focus and dismissal, Settings persistence, command preview and cancel, selector keyboard scroll, presets, saved signatures, and secret review. Open a bridged overlay alongside the app overlays it can trigger and verify focus, pointer state, and cleanup.

### P5g. Animation and browser export

- Port `components/Animation/` and browser exporters in `pages/UnifiedEditor/shell/`. Check timeline seek and playback when signals commit, imperative export reads immediately after edits, worker completion, cancellation, and preview disposal. Migrate the `exportExclude` directives in the frame, tabs, and fit wrapper without changing what gets captured.
- Gate this pass with editing and reopening animation, seeking and playback, cancelled and completed exports, and real PNG, SVG, ordered ZIP, GIF, and MP4 downloads. Compare export dimensions and content with the Solid 1 baseline.

### P5h. Node renderer and final cutover

- In `src/render/entry-server.tsx`, `frameState.tsx`, and `animationScenes.tsx`, move server renderer imports and replace `renderToStringAsync` with settled stream rendering. Keep the existing timeout with an abort signal, script-free HTML, CSS collection, and per-render provider ownership. The CLI uses these outputs with no legacy UI bundle in the Node graph.
- Gate this pass with a production render build, CLI fixtures for fonts, line marks, redaction, window styles and animation frames, and browser-to-CLI output comparisons.

Before merging P5, review the remaining imports and Solid 1 syntax across the app graph, including tests and build modes. Run the editor in development to surface Solid 2 reactivity diagnostics. Run frozen install, `pnpm libs:build`, typecheck, lint, app and renderer tests, the applicable audits above, and both production builds under Node 24. Compare startup and export timing with the P1 baseline.

- For state and editing, run `projects`, `snippet-save`, `snippet-clone`, `snippet-navigation`, `snippet-read-only`, `tabs`, and `tabs-classic`.
- For the UI and render path, run `keyboard-scroll`, `settings-persistence`, `preset-persistence`, `signature-management`, `frame-cold-start`, `export-options`, `export-screen-parity`, `animation-gif`, and `animation-mp4`.

[Solid 2 migration guide](https://docs.solidjs.com/migration/from-solid-1/) · [Solid Router migration](https://docs.solidjs.com/migration/from-solid-router/) · [Editor architecture](../../apps/codeimage/src/pages/UnifiedEditor/README.md) · [CLI renderer](../../packages/render/README.md) · [Browser and CLI verification](../../.agents/skills/verify-codeimage/SKILL.md)

### Comparing the two runtimes

Land portable assertions on a branch from `main` first. Run the same named journeys on that branch and on P5, with separate dependency installs, Vite servers and browser contexts. Record the commit, failed assertion and trace for each run. Keep browser cases on `verify-codeimage` so they exercise the real compiler, router, editor and downloads. Keep deterministic store and resource races in Vitest. Use Vitest Browser Mode when an isolated DOM component needs a real focus, layout or event-propagation check.

```sh
pnpm --filter='./packages/**' --recursive typecheck:ci
pnpm --filter @codeimage/api typecheck:ci
pnpm --filter @codeimage/app typecheck
VERIFY_AUDIT=1 VERIFY_CASES=tabs,tabs-classic,preset-persistence,settings-persistence,snippet-navigation,projects \
  node .agents/skills/verify-codeimage/scripts/verify.mjs
```

The tab journeys use fresh browser contexts and verify tab identity, the active document after closing a tab, and the order and distinct decoded pixels of the ZIP images. Solid 2 additionally exercises selection of filename completions with keyboard and pointer. Local browser runs exercise the MSW boundary. Keep the production asset build, the hosted preview and backend integration as separate gates.

The navigation matrix also covers switching from a local document to a remote snippet and back. Cache the two document types separately, using the identity captured with the edit. The screen export audit reports a 0.765% difference in the Inspector with the header hidden on both `a086f73f` and the native CodeUI cutover. The audit keeps its 0.5% threshold.

## P6. Upgrade the marketing site

- [ ] In `apps/website`, select a matching Solid 2 TanStack Router and Start set. Use the ported CodeMirror adapter and replace the Solid 1 motion adapter where the landing page uses it.
- [ ] Verify prerendered routes, hydrated navigation, and the landing-page editor demo. Check its SSR output and startup against the Solid 1 baseline.

[TanStack Solid 2 support](https://tanstack.com/blog/tanstack-start-solid-v2) · [Website manifest](../../apps/website/package.json)

## P7. Adopt the new CodeUI design system

The editor uses the preview of `@codeui/kit` from CodeUI commit `a95b1466f88403701ef2e96f51b8fae95a73ac95`. The kit pulls the same revision of `@codeui/styles` and `@codeui/inkstone`. The app pins Solid and its renderer to 2.0.3, the Vite plugin to 3.0.1, and Kobalte to 2.0.0-alpha.5. [CodeUI pull request and preview artifacts](https://github.com/riccardoperra/codeui/pull/141)

### Install and update the preview

Use `pnpm install --frozen-lockfile` with Node 24. To change the preview pin, inspect the new kit tarball and its style and Inkstone URLs. Regenerate the lockfile with the following command, then verify a frozen install.

```sh
fnm exec --using=v24.14.0 pnpm --config.block-exotic-subdeps=false install
fnm exec --using=v24.14.0 pnpm install --frozen-lockfile
```

The first command lets pnpm resolve the inspected transitive tarball URLs for this run. The workspace keeps its default policy. The two exact Kobalte release-age exceptions cover alpha.5 core and alpha.2 utils while they are fresh. Remove the exceptions when updating those pins. The npm release will let the editor resolve CodeUI from the registry. [pnpm dependency resolution settings](https://pnpm.io/docs/settings#blockexoticsubdeps)

### Editor and renderer integration

- The app imports the native controls from CodeUI. It uses the public variant, field part, segmented control, and styling APIs. The obsolete kit export and Kobalte scroll patches were removed.
- The HTML entry declares the reset layer before the kit CSS. The workspace UI and the kit read the same `data-cui-theme` attribute on the document. The frame uses `data-codeimage-frame-mode` for the terminal, watermark, and plain-text tab icon.
- The app uses CodeUI toasts for feedback at the top and bottom of the viewport. Toast actions keep their numeric IDs in the controller that showed them. The exporter calls the controller outside Solid's reactive owner so Kobalte can update its store.
- The app checks focus outside its overlay after the current microtask. A native Select can focus its portaled listbox before Solid has committed the trigger's `aria-controls`. Waiting for that link preserves the parent overlay and its focus return.
- The SSR build compiles the app's vanilla-extract source and skips CodeUI's already compiled JavaScript styles. CodeUI supplies those styles as CSS.

### Remaining design system work

The workspace `@codeimage/ui` package runs on Solid 2 and still supplies legacy layout, typography, frame styles, and some controls. The app also owns its overlay stack, command menu, and mobile sheet. Port those against the migration guide while preserving menu positioning, preview cancellation, and sheet gestures. Delete the workspace package and the renderer's source alias once their consumers have moved. The marketing site has its own Solid upgrade in P6.

Run the CodeUI census again after moving the remaining consumers. Use the browser audit to check the panel, export, and saved-project behavior at desktop and phone widths. [CodeUI 0.1.x migration](https://feat-upgrade-solid2-kobalte.codeui-docs.pages.dev/docs/migration/from-0-1) · [Migration from @codeimage/ui](https://feat-upgrade-solid2-kobalte.codeui-docs.pages.dev/docs/migration/from-codeimage-ui) · [Census tool](https://github.com/riccardoperra/codeui/blob/feat/upgrade-solid2-kobalte/docs/kit-2026/phase-0/tools/census.mjs) · [Editor verification](../../.agents/skills/verify-codeimage/features/README.md)
