# Modernization roadmap

This page proposes what to change in CodeImage and in what order. The [audit](./audit.md) holds the measurements behind each step, and the IDs below point to its tables.

## The short version

CodeImage does not need a new framework, a new styling system, or a new state library. It needs fewer of the ones it has.

The three auditors agree on the first three calls below. They differ on rxjs. One auditor recommends removal, and one would keep it until tests cover saving. Step 16 comes after those tests, which satisfies both.

- **Stay on Solid 1.9.** Solid 2.0 is a release candidate, and eight dependencies have no stable 2.0 release. Three of them are maintainer-owned: statebuilder, `@codeui/kit`, and `solid-codemirror`.
- **Keep vanilla-extract.** It is in 90 style files and upstream is active. Tailwind or Panda would be a rewrite with no gain for the user.
- **Make Kobalte the one headless layer.** It already sits under every `@codeui/kit` component and has active Solid 2.0 work, so choosing it adds no library.
- **Remove rxjs and `@codeimage/atomic-state`.** They exist mostly to debounce one save. The two other uses are copy to clipboard and the font permission check.
- **Fix verification before anything else.** A red `typecheck` and a red `test` command hide every later regression.

Most steps delete code, and most are one small pull request. Steps 10, 27, and 28 are several.

## Phase 0: fix what is broken now

These steps do not depend on each other. Do them first.

1. **Clear the editor interval (APP-01).** Delete the `setInterval` in `PreviewExportEditor.tsx`, call `requestMeasure()` once after `syncDispatch`, and return the listener's unsubscribe through `onCleanup`. Before and after, export a 300-line snippet, because the interval may hide a stale measure.
2. **Refresh the lockfile for the advisories (PLAT-002).** Update `@fastify/jwt` to 10.2.7 and `fastify-auth0-verify` to 4.1.4, so that `fast-jwt` reaches 6.3.4 or later. Update Vite to 8.3.8, and check the second copy, Vite 6.4.1, that `@codeui/kit` installs. Remove `--host` from the default `dev` script, so that the dev server listens on localhost unless a contributor asks for more. Run `pnpm audit` again and record the counts.
3. **Guard the production backend deploy (PLAT-003).** Put the `deploy-backend` condition on the whole `deploy-api` job, and let `deploy-app` run when that job is skipped. Check which database the `NEXT_DATABASE_URL` secret points at, and rename it.
4. **Replace `rmdirSync` with `rmSync` (DEV-01).** One line in `scripts/vercel-output-build.ts`.
5. **Land the private security fixes.** The maintainer has them.

## Phase 1: make the checks tell the truth

6. **Make API types available to the app typecheck (PLAT-004, APP-02).** Running `pnpm --filter=@codeimage/api build:ts` before the typecheck clears the 6 errors. A smaller change may be to point the `types` condition of the `./schemas` export at `src`, which is not tested yet. A better change moves the TypeBox schemas to a source-only package, so that the frontend never needs a backend build. Step 14 needs that package to parse with the schema values.
7. **Repair the test command (PLAT-005).** Give the API unit tests fixed environment values, make the test helper fail on a startup error, move the cases that need a database to the integration run, fix the swapped dates in the mapper test, pass the fourth argument in the two exporter tests, and delete the placeholder `test` scripts.
8. **Run the missing checks in CI (PLAT-009, PLAT-012).** Format the three source files, exclude the generated route tree, and add `format:check`, the exporter tests, and a lint and typecheck for `apps/website` to `main.yml`. Make the Next deploy require the typecheck job. Repair or delete the path filter in the same change.
9. **Document the frontend-only path (PLAT-010).** The app runs on mocks with no Docker. Say so in `CONTRIBUTING.md`. Find the cause of the msw worker errors (DEV-02) in a separate change.

## Phase 2: delete

10. **Delete dead code and dead dependencies (APP-13, UI-05, UI-06, PLAT-008).** Use three pull requests.
    - Patches and dependencies: the two patches that change nothing, `patches/csstype@3.1.1.patch`, `polished`, `@corvu/utils`, `@kobalte/utils`, `@types/prettier`, and `.oxlintrc.json.bak`.
    - Code: the unused files that knip lists and the ten `packages/ui` components with no caller. Check each knip entry by hand. `modern-normalize` and `inter-ui` are false positives, because SCSS imports them.
    - The service worker and workbox, after open question 2 has an answer.
11. **Fix the small bugs (APP-11, PLAT-013, UI-10, UI-11).** One pull request each. PLAT-013 gets a test now, because `apps/api` has a test runner. Remove `maximum-scale=1.0, user-scalable=no` from `index.html`, which blocks zoom. UI-10 and UI-11 change exported images slightly: `Group` writes `[object Object]` into `data-orientation`, and two editor themes carry invalid font values.

## Phase 3: one way to do each thing

The three tracks below are independent.

### Saving

12. **Add Vitest to the app and pin the saved format.** Test `toPersisted(state)` and `fromPersisted(unknown)` against real stored values from 1.x releases. No component tests yet.
13. **Define the project shape once (APP-04).** Derive the persisted types from the API schemas, write each projection in one place, and fix the default theme id.
14. **Parse at the boundaries (APP-03).** One parser each for IndexedDB, localStorage, the URL, and the API response.
15. **Derive saving from state (APP-05).** One memo returns the persisted projection of the three stores. One debounced effect writes it, and skips the write when the projection equals the last saved one. Add a `pagehide` flush. Then delete the three command lists. This step carries the most risk in the roadmap, so steps 12 to 14 come first. Before the change, write down the expected result for a reload, for a local copy that is newer than the server copy, for a failed save, and for two saves in flight.
16. **Remove rxjs and `packages/atomic-state` (APP-08).** Keep the "ignore while busy" behavior of copy to clipboard.

### Components

17. **Remove `solid-headless` (UI-02, UI-03).** Move `KeyboardShortcuts` to the Kobalte-based popover and turn `FadeInOutTransition` into CSS. Replace `createRef` in `core/helpers/create-ref.ts` with `mergeRefs` from `@solid-primitives/refs`, and replace the `ButtonProps` type import in the `packages/ui` `Button.tsx`. Delete the package and its patch in the same change.
18. **Move toast to Kobalte Toast.** Keep the `toast.success` and `toast.error` calls as they are. Delete `solid-toast` and the code that patches it.
19. **Replace the app's three animation mechanisms with CSS.** Delete `@motionone/solid`, `motion`, and the patch from the app.
20. **Make `RadioBlock` a real radio group (UI-07).**
21. **Upgrade tinykeys to 4 and delete its patch.**
22. **Consume `packages/ui` from source (UI-06).** Either move it into `apps/codeimage/src/ui`, or keep the workspace package and point `exports` at `src`. Delete the Rollup and Babel pipeline.
23. **Extract CSS at build time (UI-01).** One trial on a scratch branch failed with 75 errors, because app `.css.ts` files import built component code. Two fixes are possible and neither is tested: consume `packages/ui` from source (step 22) and import tokens from a module with no component code, or add a tokens-only entry point to the built package. Try the tokens-only entry point first, because it does not need step 22.

### Delivery and export

24. **Put runtime packages in `dependencies` (PLAT-006).** `@prisma/adapter-pg` in `apps/api` and `@prisma/client-runtime-utils` in `packages/prisma-models` are imported at runtime and sit in `devDependencies`.
25. **Prove the API deploy bundle starts alone (PLAT-006).** Install the bundle with production dependencies outside the workspace and start it. Replace `pnpm-bundle-workspace-package` with `pnpm deploy` only if `pnpm deploy` produces a bundle that passes the same check.
26. **Add browser fixtures to the exporter, then fix its cleanup (PLAT-007).** Cover fonts, a long snippet, PNG, JPEG, SVG, and two exports in a row. After that, key the resource cache on the full URL and remove both iframes in a `finally` block.

## Phase 4: decisions that belong to the maintainer

These steps wait for an answer in [Open questions](#open-questions).

27. **`@codeui/kit`.** Either publish a new release on Kobalte 0.13.14 with a clean manifest, or move the 18 components that the app uses into the app on direct Kobalte imports. Then merge the two token systems.
28. **statebuilder.** Either release a version with `solid-js` as a peer dependency, or inline the nine stores as `createStore` plus plain functions, one store per pull request. Step 15 removes the command lists, and after that each store is a small change.

## Phase 5: Solid 2.0, later

Start when all of these are true.

- `solid-js` 2.0 is on the `latest` tag.
- Kobalte 2 is beta or stable, with a version range as its peer.
- `@solidjs/router` 2.0 is stable.
- `solid-codemirror` has a 2.0 release, and so does statebuilder if step 28 kept it.
- Step 27 is done, or `@codeui/kit` has a 2.0 release.
- `@thisbeyond/solid-dnd` is forked, replaced, or dropped.

Phases 2 and 3 remove `solid-headless`, the app's direct use of `@motionone/solid`, and most of the interop code that 2.0 breaks. Phase 4 decides `@codeui/kit` and statebuilder. Begin the move in `packages/ui`, which has about 45 affected call sites.

## What not to do

- **Do not start Solid 2.0 now.** A release candidate plus an alpha headless library pinned to an older release candidate means weeks spent following upstream churn.
- **Do not move to Tailwind or Panda.** Neither fixes a problem that step 23 leaves open.
- **Do not add a state library.** The need is three stores and a debounce.
- **Do not replace Fastify, Prisma, or Auth0.** The backend findings are configuration drift and packaging. A new framework fixes neither.
- **Do not swap the image exporter yet.** `packages/dom-export` is the product's core output and has three tests. Step 26 adds browser fixtures. After that, compare a maintained library such as `modern-screenshot` behind the same adapter.
- **Do not apply the knip list without checking it.** It has false positives.

## Open questions

1. Is CodeImage meant to exercise statebuilder, `@codeui/kit`, and `solid-codemirror`? If yes, steps 27 and 28 mean "release those libraries first". If no, both can be inlined.
2. Is offline or PWA support still wanted? Step 10 deletes the service worker if not.
3. Is `packages/ui` meant to be published? Nobody outside this repository uses it today.
4. For a saved snippet, may the last three seconds of edits be lost when the tab closes, or must the local copy win when it is newer?
5. Is drag to reorder tabs worth keeping through a Solid 2.0 move? `@thisbeyond/solid-dnd` has no path there.
6. Which Safari and iOS versions must export support? The answer sets the acceptance cases for any exporter change.
7. Do contributors use the msw mock mode? If not, `src/mocks`, `@mswjs/data`, and `@ngneat/falso` can go. The UI prototype work used it to run the app with no backend.
