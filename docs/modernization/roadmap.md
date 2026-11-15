# Modernization roadmap

This page proposes what to change in CodeImage and in what order. The [audit](./audit.md) holds the measurements behind each step, and the IDs below point to its tables.

## Status on 2026-11-15

The roadmap was written against `main` at `27b185f1`. This refresh checks the editor removal against `255df885`, 520 commits later. Other checks below retain their earlier 2026-11-15 results where stated.

**Done.** The editor interval is gone, because export now renders from a static view (step 1). The production backend deploy runs only when asked (step 3). The root `typecheck` passes with no API build (step 6). One private security fix is public on `main` (step 5).

**Partly done.** The lockfile no longer has the `fast-jwt` and Vite 8 advisories, but Vite 6.4.1 under `@codeui/kit` still does (step 2). The app has Vitest and 35 test files, but none pins the saved format and CI does not run them (step 12). The CI path filter works again (step 8). One dead patch is gone (step 10). The API deploy bundle installs on its own, and one runtime package is still a dev dependency (steps 25 and 26).

**What changed around the plan.** Account snippets now open in `apps/codeimage/src/pages/UnifiedEditor/` at `/:snippetId` (#764). #754 deleted `pages/Editor` and the `/classic` route. Signed-out visitors at `/` get the unified editor, and signed-in users get the dashboard (`apps/codeimage/src/index.tsx:55-83`). #758 fixed the frame jumping on a cold start and matched export typography to the live frame. #746 added macOS export shortcuts. The unified editor uses the same three stores, so the saving track still applies. It has 33 files importing `@codeui/kit` and 13 importing Kobalte directly. It reads theme colours back from CodeMirror, which changes the reason for step 24. Export can also run through Takumi behind a renderer flag.

**What is next.** Steps 4 and 11 are each a few lines and still open. Step 7 is the most useful next change, because the default test command is still red. Step 8 should add `format:check` and the app tests to CI, after the 67 files that fail `format:check` today are formatted.

## The short version

CodeImage does not need a new framework, a new styling system, or a new state library. It needs fewer of the ones it has.

The three auditors agree on the first three calls below. They differ on rxjs. One auditor recommends removal, and one would keep it until tests cover saving. Step 16 comes after those tests, which satisfies both.

- **Stay on Solid 1.9.** Solid 2.0 is a release candidate, and eight dependencies have no stable 2.0 release. Three of them are maintainer-owned: statebuilder, `@codeui/kit`, and `solid-codemirror`.
- **Keep vanilla-extract.** It is in 114 style files and upstream is active. Tailwind or Panda would be a rewrite with no gain for the user.
- **Make Kobalte the one headless layer.** It already sits under every `@codeui/kit` component and has active Solid 2.0 work, so choosing it adds no library. The new editor already uses it directly.
- **Remove rxjs and `@codeimage/atomic-state`.** They exist mostly to debounce one save. The two other uses are copy to clipboard and the font permission check.
- **Fix verification before anything else.** A red `test` command hides every later regression. `typecheck` is green on `main` today.

Most steps delete code, and most are one small pull request. Steps 10, 28, and 29 are several.

## Phase 0: fix what is broken now

These steps do not depend on each other. Do them first.

1. **Clear the editor interval (APP-01).** Delete the `setInterval` in `PreviewExportEditor.tsx`, call `requestMeasure()` once after `syncDispatch`, and return the listener's unsubscribe through `onCleanup`. Before and after, export a 300-line snippet, because the interval may hide a stale measure.

   **Status: done.** #699 (`d22b637b`) deleted `PreviewExportEditor.tsx`. Export renders from a static snapshot view, `components/CustomEditor/StaticCodeView.tsx`, so the stale measure no longer applies.

2. **Refresh the lockfile for the advisories (PLAT-002).** Update `@fastify/jwt` to 10.2.7 and `fastify-auth0-verify` to 4.1.4, so that `fast-jwt` reaches 6.3.4 or later. Update Vite to 8.3.8, and check the second copy, Vite 6.4.1, that `@codeui/kit` installs. Remove `--host` from the default `dev` script, so that the dev server listens on localhost unless a contributor asks for more. Run `pnpm audit` again and record the counts.

   **Status: partly done** in #717 (`6c770522`, `cdfc6f71`). `apps/api/package.json` has `@fastify/jwt` 10.2.7 and `fastify-auth0-verify` 4.1.4, the lockfile has `fast-jwt` 6.3.6, and the catalog has Vite `^8.3.8` (`pnpm-workspace.yaml:59`). Still open. Vite 6.4.1 still comes in through `@vanilla-extract/vite-plugin` 4.0.20 under `@codeui/kit` and has 2 high advisories, and `--host` is still in `apps/codeimage/package.json:8`. `pnpm audit` on 2026-11-15 reports 7 critical and 101 high, down from 12 and 135.

3. **Guard the production backend deploy (PLAT-003).** Put the `deploy-backend` condition on the whole `deploy-api` job, and let `deploy-app` run when that job is skipped. Check which database the `NEXT_DATABASE_URL` secret points at, and rename it.

   **Status: mostly done.** #697 (`89a8681c`) put the condition on the Railway deploy step (`prod-deploy.yml:210`), so the backend deploys only when asked. The condition sits on the two steps, not the job, so the job still runs and downloads the bundle, and `deploy-app` still needs it (`prod-deploy.yml:220`). The secret is still named `NEXT_DATABASE_URL` (`prod-deploy.yml:206`). Which database it points at was not checked.

4. **Replace `rmdirSync` with `rmSync` (DEV-01).** One line in `scripts/vercel-output-build.ts`.

   **Status: open.** `scripts/vercel-output-build.ts:48` still calls `rmdirSync(vercelDir, {recursive: true})`.

5. **Land the private security fixes.** The maintainer has them.

   **Status: partly done, as far as `main` shows.** #717 includes `b2a3630d`, which checks project ownership on update and rename. Whether other private fixes remain is for the maintainer to say.

## Phase 1: make the checks tell the truth

6. **Make API types available to the app typecheck (PLAT-004, APP-02).** Running `pnpm --filter=@codeimage/api build:ts` before the typecheck clears the 6 errors. A smaller change may be to point the `types` condition of the `./schemas` export at `src`, which is not tested yet. A better change moves the TypeBox schemas to a source-only package, so that the frontend never needs a backend build. Step 14 needs that package to parse with the schema values.

   **Status: done** in #717 (`056af870`). The app imports `@codeimage/api/api-types`, whose `types` condition points at `src/api-types.ts` (`apps/api/package.json:11-14`). `pnpm typecheck` passed with 0 errors on 2026-11-15 after `pnpm libs:build` and no API build. The source-only schema package does not exist. Step 14 still needs runtime schema values in the app.

7. **Repair the test command (PLAT-005).** Give the API unit tests fixed environment values, make the test helper fail on a startup error, move the cases that need a database to the integration run, fix the swapped dates in the mapper test, pass the fourth argument in the two exporter tests, and delete the placeholder `test` scripts.

   **Status: open.** On 2026-11-15 `pnpm -r --if-present --no-bail test` fails in 4 packages. `packages/prisma-models` still has a placeholder script, `packages/atomic-state` runs Vitest with no test files, `packages/dom-export/test/embedWebFonts.test.ts` fails 2 of 12 tests, and `packages/highlight/test/accents.test.cts` fails 2 new tests. Run alone, the API unit tests fail 5 of 71 in `test/plugins/auth0.test.ts` because `DATABASE_URL` and four other values are not set. The app tests pass. The mapper test was not checked again.

8. **Run the missing checks in CI (PLAT-009, PLAT-012).** Format the three source files, exclude the generated route tree, and add `format:check`, the exporter tests, and a lint and typecheck for `apps/website` to `main.yml`. Make the Next deploy require the typecheck job. Repair or delete the path filter in the same change.

   **Status: partly done.** #721 (`247b72ec`) repaired the path filter (`main.yml:215`, `main.yml:387`) and moved previews to Cloudflare Pages. Still open. `main.yml` runs neither `format:check`, the exporter tests, the app tests, nor a lint or typecheck for `apps/website`. The release candidate API deploy needs lint, build, and API tests, but not the typecheck job (`main.yml:485`). `format:check` now fails on 67 tracked files, 48 of them under `docs/plans`, so this step first formats or excludes those.

9. **Document the frontend-only path (PLAT-010).** The app runs on mocks with no Docker. Say so in `CONTRIBUTING.md`. Find the cause of the msw worker errors (DEV-02) in a separate change.

   **Status: open.** `CONTRIBUTING.md:60` still requires Docker. DEV-02 was not checked again.

## Phase 2: delete

10. **Delete dead code and dead dependencies (APP-13, UI-05, UI-06, PLAT-008).** Use three pull requests.
    - Patches and dependencies: the two patches that change nothing, `patches/csstype@3.1.1.patch`, `polished`, `@corvu/utils`, `@kobalte/utils`, `@types/prettier`, and `.oxlintrc.json.bak`.
    - Code: the unused files that knip lists and the ten `packages/ui` components with no caller. Check each knip entry by hand. `modern-normalize` and `inter-ui` are false positives, because SCSS imports them.
    - The service worker and workbox, after open question 2 has an answer.

    **Status: partly done.** #721 (`247b72ec`) deleted the `@thisbeyond/solid-dnd` patch. `patches/` still holds five files, including the `@codeui/kit` patch and `csstype@3.1.1.patch`. `.oxlintrc.json.bak`, `polished`, `@corvu/utils`, `@kobalte/utils`, and `@types/prettier` remain. `src/sw.ts`, the workbox packages, and `build-sw` remain. knip was not run again.

11. **Fix the small bugs (APP-11, PLAT-013, UI-10, UI-11).** One pull request each. PLAT-013 gets a test now, because `apps/api` has a test runner. UI-10 and UI-11 change exported images slightly: `Group` writes `[object Object]` into `data-orientation`, and two editor themes carry invalid font values.

    **Status: open.** An earlier version of this step also removed `user-scalable=no` from `index.html`. The maintainer keeps it on purpose, so it is no longer part of the step. The four APP-11 bugs are still there (`state/editor/editor.ts:212-214` and `:76-79`, `hooks/use-export-image.ts:58`, `i18n/ notFound.ts`). PLAT-013 moved to `apps/api/src/modules/project/project.repository.ts:75-81` and is unchanged. UI-10 is still at `packages/ui/src/lib/primitives/Group/Group.tsx:20`. UI-11 was not checked again. UI-10 and UI-11 have no row in the audit tables.

## Phase 3: one way to do each thing

The three tracks below are independent.

### Saving

The unified editor reads and writes the shared frame, terminal, and editor stores (`UnifiedEditor/model.tsx`). Every step in this track still applies to those stores.

12. **Add Vitest to the app and pin the saved format.** Test `toPersisted(state)` and `fromPersisted(unknown)` against real stored values from 1.x releases. No component tests yet.

    **Status: partly done.** #699 (`d22b637b`) added Vitest to the app (`apps/codeimage/vitest.config.ts`). The app has 35 test files and 251 passing tests, for export, animation, diff, snapshot, signature, and release notes. None pins the saved format, and no `toPersisted` or `fromPersisted` exists. CI does not run the app tests.

13. **Define the project shape once (APP-04).** Derive the persisted types from the API schemas, write each projection in one place, and fix the default theme id.

    **Status: open.** The default theme id is still `'fleetTheme'` (`state/editor/editor.ts:36`), and no theme has that id.

14. **Parse at the boundaries (APP-03).** One parser each for IndexedDB, localStorage, the URL, and the API response.

    **Status: open.** One field is parsed, the frame signature (`state/frame/model.ts:83`, called from `createEditorSync.ts:159`). The rest still enters through casts.

15. **Derive saving from state (APP-05).** One memo returns the persisted projection of the three stores. One debounced effect writes it, and skips the write when the projection equals the last saved one. Add a `pagehide` flush. Then delete the three command lists. This step carries the most risk in the roadmap, so steps 12 to 14 come first. Before the change, write down the expected result for a reload, for a local copy that is newer than the server copy, for a failed save, and for two saves in flight.

    **Status: open.** The three lists are at `state/editor/frame.ts:157-171`, `terminal.ts:139-148`, and `editor.ts:160-170`, and the frame list grew from 9 to 12 commands. The debounces are at `createEditorSync.ts:183-186`. No `pagehide` handler exists in `apps/codeimage/src`.

16. **Remove rxjs and `packages/atomic-state` (APP-08).** Keep the "ignore while busy" behavior of copy to clipboard.

    **Status: open.** `packages/atomic-state` exists. rxjs is imported in 12 app files. `@codeimage/atomic-state` still has 2 app importers.

### Components

The classic editor is gone. Steps 17 to 21 now cover shared code, dashboard controls, dependencies, and patches. The unified page imports none of these older UI libraries directly. Its shared canvas still uses tab drag and drop and transitions.

17. **Remove `solid-headless` (UI-02, UI-03).** `KeyboardShortcuts` was deleted. Turn the shared `FadeInOutTransition` into CSS and replace the remaining headless primitives in `packages/ui`. Replace `createRef` in `core/helpers/create-ref.ts` with `mergeRefs` from `@solid-primitives/refs`, and replace the `ButtonProps` type import in the `packages/ui` `Button.tsx`. Delete the package and its patch in the same change.

    **Status: open.** 7 files still import it. They are `core/helpers/create-ref.ts` and six primitives in `packages/ui`. Both package manifests and `patches/solid-headless.patch` still retain it.

18. **Move toast to Kobalte Toast.** Keep the `toast.success` and `toast.error` calls as they are. Delete `solid-toast` and the code that patches it.

    **Status: open.** `solid-toast` is still a dependency of `packages/ui` (`packages/ui/package.json:93`). `SnackbarHost.tsx` and `patch-solid-toast.ts` still import it.

19. **Replace the app's three animation mechanisms with CSS.** Delete `@motionone/solid`, `motion`, and the patch from the app.

    **Status: partly done.** `pages/Editor/components/LeftSidebar.tsx` is deleted and no source file imports `@motionone/solid`. Both package manifests and `patches/@motionone__solid.patch` retain it. `motion` still powers `apps/codeimage/src/ui/DynamicSizedContainer/DynamicSizedContainer.tsx:1-2` and remains in the app manifest. Shared transitions still use `solid-headless`.

20. **Make `RadioBlock` a real radio group (UI-07).**

    **Status: partly done.** The window style picker was deleted. The unified editor uses Kobalte radio groups. `RadioBlock` remains in `packages/ui/src/lib/primitives/RadioBlock/RadioBlock.tsx:12-23` and the dashboard's `components/Toolbar/SettingsDialog.tsx:68-140`. Remove that dashboard settings path or replace its choices.

21. **Upgrade tinykeys to 4 and delete its patch.**

    **Status: open.** `apps/codeimage/package.json:112` has `tinykeys` `^3.0.0`, and `patches/tinykeys.patch` remains. The unified shortcuts still use `hooks/use-hotkey.ts:3-16`, which imports tinykeys.

22. **Consume `packages/ui` from source (UI-06).** Either move it into `apps/codeimage/src/ui`, or keep the workspace package and point `exports` at `src`. Delete the Rollup and Babel pipeline.

    **Status: open, and larger.** `packages/ui/package.json:12-22` still points at `dist` with CJS entries, and the Rollup and Babel dependencies remain. 147 source files import `@codeimage/ui`, and 40 of them are in the unified editor.

23. **Extract CSS at build time (UI-01).** One trial on a scratch branch failed with 75 errors, because app `.css.ts` files import built component code. Two fixes are possible and neither is tested: consume `packages/ui` from source (step 22) and import tokens from a module with no component code, or add a tokens-only entry point to the built package. Try the tokens-only entry point first, because it does not need step 22.

    **Status: open.** `apps/codeimage/vite.config.ts:11` still sets `unstable_mode: 'transform'`. The 2026-11-15 build ships a 68 kB `vanilla-extract-css.browser` chunk and preloads it from `dist/index.html`.

24. **Keep each theme's syntax colours as data (UI-15).** `defineEditorTheme` takes a `highlight` map and returns only CodeMirror extensions, so the loaded theme does not carry its own colours. Store the map on the theme, for example as `properties.syntax`, and let the three themes that do not use `defineEditorTheme` declare it. A theme picker can then draw a theme from its colours with no code preview.

    **Status: still needed, for a smaller reason.** The theme picker this step was meant to unblock now exists. `UnifiedEditor/syntax.ts` builds a CodeMirror state and an `EditorView` for each theme, asks `highlightingFor` which classes a tag gets, and then finds their `color` with a regular expression over the rule text from `EditorView.styleModule`. The result is cached per theme and works in the browser. It still depends on CodeMirror internals and a DOM, covers only seven tags, and falls back to the base colour when a rule does not match the regular expression. Storing the map on the theme replaces that file with a property read and makes the colours available where no DOM exists. The move to `pages/UnifiedEditor` is done. This remains a cleanup, not a blocker.

### Delivery and export

25. **Put runtime packages in `dependencies` (PLAT-006).** `@prisma/adapter-pg` in `apps/api` and `@prisma/client-runtime-utils` in `packages/prisma-models` are imported at runtime and sit in `devDependencies`.

    **Status: partly done.** #724 (`0d2df5eb`) moved `@prisma/adapter-pg` to `dependencies`. `@prisma/client-runtime-utils` is still a dev dependency of `packages/prisma-models`.

26. **Prove the API deploy bundle starts alone (PLAT-006).** Install the bundle with production dependencies outside the workspace and start it. Replace `pnpm-bundle-workspace-package` with `pnpm deploy` only if `pnpm deploy` produces a bundle that passes the same check.

    **Status: partly done.** #724 (`0d2df5eb`) makes the bundle install with npm on Railway. It drops `devDependencies` and copies back the generated Prisma client's `package.json`. `apps/api` has `test:built` and `test:built:cli` smoke scripts, but no workflow runs them. The bundle still comes from `pnpm-bundle-workspace-package` (`scripts/prepare-api-deploy.mjs:10`).

27. **Add browser fixtures to the exporter, then fix its cleanup (PLAT-007).** Cover fonts, a long snippet, PNG, JPEG, SVG, and two exports in a row. After that, key the resource cache on the full URL and remove both iframes in a `finally` block.

    **Status: open.** `packages/dom-export` gained two unit test files, which run in happy-dom, not a browser. The cache key still drops the query (`getBlobFromURL.ts:11`), and the iframe in `iosResourceFix.ts:32` is still not removed.

## Phase 4: decisions that belong to the maintainer

These steps wait for an answer in [Open questions](#open-questions).

28. **`@codeui/kit`.** Either publish a new release on Kobalte 0.13.14 with a clean manifest, or move the 18 components that the app uses into the app on direct Kobalte imports. Then merge the two token systems.

    **Status: open, and larger.** 0.1.5 is still the latest release. 70 source files import it, and 33 of them are in the unified editor. The count of 18 components is from 2026-11-14.

29. **statebuilder.** Either release a version with `solid-js` as a peer dependency, or inline the nine stores as `createStore` plus plain functions, one store per pull request. Step 15 removes the command lists, and after that each store is a small change.

    **Status: open.** 0.8.1 is still the latest release. 32 app source files import it, and 10 of them are in the unified editor. The count of nine stores was not checked again.

## Phase 5: Solid 2.0, later

Start when all of these are true.

- `solid-js` 2.0 is on the `latest` tag.
- Kobalte 2 is beta or stable, with a version range as its peer.
- `@solidjs/router` 2.0 is stable.
- `solid-codemirror` has a 2.0 release, and so does statebuilder if step 29 kept it.
- Step 28 is done, or `@codeui/kit` has a 2.0 release.
- `@thisbeyond/solid-dnd` is forked, replaced, or dropped.

**Status on 2026-11-15.** The release gates were not checked again for this refresh. `@thisbeyond/solid-dnd` still has four importers in the shared tab and drag code. `solid-js` `latest` is 1.9.19 and `next` is `2.0.0-rc.21`. Kobalte is at `2.0.0-alpha.4` with the peer pinned to `2.0.0-rc.16`. `@solidjs/router` 2.0 is at `2.0.0-next.44`. Its `latest` tag is now 1.0.3, and the app is still on `^0.16.1`.

Phases 2 and 3 remove `solid-headless`, the app's direct use of `@motionone/solid`, and most of the interop code that 2.0 breaks. Phase 4 decides `@codeui/kit` and statebuilder. Begin the move in `packages/ui`, which has about 45 affected call sites.

## What not to do

- **Do not start Solid 2.0 now.** A release candidate plus an alpha headless library pinned to an older release candidate means weeks spent following upstream churn.
- **Do not move to Tailwind or Panda.** Neither fixes a problem that step 23 leaves open.
- **Do not add a state library.** The need is three stores and a debounce.
- **Do not replace Fastify, Prisma, or Auth0.** The backend findings are configuration drift and packaging. A new framework fixes neither.
- **Do not swap the image exporter yet.** `packages/dom-export` is the product's core output. Step 27 adds browser fixtures. After that, compare a maintained library such as `modern-screenshot` behind the same adapter. `main` now has that adapter (`apps/codeimage/src/core/rasterize/index.ts`) and Takumi behind a renderer flag, so the fixtures can compare both.
- **Do not apply the knip list without checking it.** It has false positives.

## Open questions

1. Is CodeImage meant to exercise statebuilder, `@codeui/kit`, and `solid-codemirror`? If yes, steps 28 and 29 mean "release those libraries first". If no, both can be inlined.
2. Is offline or PWA support still wanted? Step 10 deletes the service worker if not.
3. Is `packages/ui` meant to be published? Nobody outside this repository uses it today.
4. For a saved snippet, may the last three seconds of edits be lost when the tab closes, or must the local copy win when it is newer?
5. Is drag to reorder tabs worth keeping through a Solid 2.0 move? `@thisbeyond/solid-dnd` has no path there.
6. Which Safari and iOS versions must export support? The answer sets the acceptance cases for any exporter change.
7. Do contributors use the msw mock mode? If not, `src/mocks`, `@mswjs/data`, and `@ngneat/falso` can go. The UI prototype work used it to run the app with no backend.
8. Decided. #764 moved account snippets to the unified editor and #754 deleted the classic editor. Steps 17 to 21 shrink to shared primitives, dashboard settings, manifest dependencies, and patches. They are not complete because those files still exist.
