# Codebase audit, November 2026

This page records the state of CodeImage on `main` at commit `27b185f1`, measured on 2026-11-14. The [roadmap](./roadmap.md) says what to do about it.

## How the audit ran

Three auditors on two model families read the repository independently, each with the same brief and one area to cover in depth.

| Auditor           | Area covered in depth                                                                     | Findings |
| ----------------- | ----------------------------------------------------------------------------------------- | -------- |
| Claude Fable 5.2  | Application architecture and state (`apps/codeimage/src`, `packages/atomic-state`)        | 14       |
| Claude Opus 5.5   | Component layer and UI dependencies (`packages/ui`, `packages/highlight`, `patches/`)     | 14       |
| Codex GPT-6.1 Sol | Platform, dependencies, backend, and delivery (`apps/api`, `.github/`, package manifests) | 13       |

A coordinator ran the builds and the checks once, merged the three reports, and tested the claims that carried the most weight. The **Status** column in the tables below uses these words.

- **Run**: the coordinator executed something that shows the defect or the fix.
- **Read**: the coordinator read the cited code and agrees.
- **Reported**: one or more auditors cite the code, and the coordinator did not check it again.

Findings that need a private fix are not on this page. The maintainer has them.

## Baseline

[`baseline.sh`](./baseline.sh) produced these results from a fresh install. Run it from the repository root to write one log per check to `.audit/baseline/`.

| Check                                | Result                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `pnpm libs:build`                    | Passes in 11 s                                                                                   |
| `pnpm --filter=@codeimage/app build` | Passes in 5 s. The largest chunk is 2,745 kB (522 kB gzip), a lazy-loaded SQL formatter          |
| `pnpm lint`                          | 0 errors, 33 warnings                                                                            |
| `pnpm typecheck`                     | Fails with 6 implicit-any errors in `apps/codeimage`                                             |
| `pnpm format:check`                  | Fails on 4 files                                                                                 |
| `pnpm -r test`                       | Fails in 5 packages                                                                              |
| `pnpm audit --json`                  | 12 critical and 135 high advisories in the lockfile, which last changed on 2026-03-28            |
| `pnpm outdated -r`                   | 119 entries: 114 behind, 35 of them by a major version, and 5 deprecated at their latest version |

The repository has 24 test files. `apps/api` has 23 and `packages/dom-export` has 1. The app, `packages/ui`, `packages/highlight`, and `packages/atomic-state` have none.

## Scorecard

Each auditor scored twelve areas from 1 (poor) to 5 (strong). The table shows the median, and the scores in the order Sol, Fable, Opus.

| Area                            | Median | Scores  | Main reason                                                                                                    |
| ------------------------------- | :----: | :-----: | -------------------------------------------------------------------------------------------------------------- |
| Architecture                    |   3    | 3, 3, 3 | Clear workspace and folder split. `packages/ui` is a full library build with one consumer                      |
| State management                |   2    | 2, 2, 3 | statebuilder, rxjs, and `@codeimage/atomic-state` sit on Solid stores to save a debounced copy of three stores |
| Type safety                     |   2    | 2, 3, 2 | `strict` is on, but API types become `any` when `apps/api` is not built, and no external data is parsed        |
| UI component layer              |   2    | 2, 2, 2 | Four component libraries overlap on seven components                                                           |
| Styling                         |   3    | 3, 3, 2 | vanilla-extract is used consistently, but production compiles it in the browser                                |
| Dependency health               |   2    | 2, 2, 2 | Deprecated packages, six patch files, and a lockfile with known advisories                                     |
| Build and tooling               |   3    | 2, 3, 3 | Vite 8, tsdown, oxlint, and oxfmt are recent. The root `typecheck` and `test` commands fail                    |
| Tests                           |   1    | 1, 1, 1 | No frontend tests. The default test command is red                                                             |
| CI and release                  |   3    | 2, 3, 3 | Lint, build, typecheck, and API tests run. Path filters are disabled and format and package tests do not run   |
| Docs and contributor experience |   2    | 2, 2, 3 | The guide tells a frontend contributor to start Docker, which the mock mode does not need                      |
| Performance and bundle          |   2    | 3, 2, 2 | A timer leak in the editor, and a CSS runtime on the critical path                                             |
| Accessibility                   |   2    | 2, 2, 2 | Zoom is disabled in `index.html:22`, and two live controls work with a mouse only                              |

## Findings that need action first

| ID               | Finding                                                                                                                                                                             | Evidence                                                                                                                      | Status                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| APP-01           | Each editor transaction starts a `setInterval` with no delay and never clears it                                                                                                    | `apps/codeimage/src/components/CustomEditor/PreviewExportEditor.tsx:31`                                                       | **Run.** 17 live intervals at load, 122 after 50 keystrokes, 224 after 100                                                      |
| PLAT-003         | The production workflow deploys the backend on every run. Only the migration step reads the `deploy-backend` input                                                                  | `.github/workflows/prod-deploy.yml:227-262`                                                                                   | **Read**                                                                                                                        |
| PLAT-002         | The lockfile pins versions with known advisories, including `fast-jwt` 6.1.0 and Vite 8.0.3                                                                                         | `pnpm why fast-jwt`, `pnpm audit`                                                                                             | **Run.** One advisory identifier in the auditor's report could not be confirmed, so the severity for Vite is high, not critical |
| PLAT-004, APP-02 | The root `typecheck` fails because `@codeimage/api/schemas` points at `apps/api/dist`, which `pnpm libs:build` does not create                                                      | `apps/api/package.json:15`, `apps/codeimage/tsconfig.json:9`                                                                  | **Run.** 6 errors before `pnpm --filter=@codeimage/api build:ts`, 0 after                                                       |
| DEV-01           | The dev server stops at startup on Node 26 when `apps/codeimage/.vercel` exists. `rmdirSync` no longer accepts `recursive`, and `engines` allows any Node from 24                   | `scripts/vercel-output-build.ts:48`                                                                                           | **Run**                                                                                                                         |
| APP-05           | Saving depends on three hand-kept command lists, and 17 writes do not go through them. No code saves on `pagehide`, and the remote save waits about 3 s                             | `apps/codeimage/src/state/editor/frame.ts:121-136`, `terminal.ts:124-142`, `editor.ts:155-168`, `createEditorSync.ts:154-157` | **Reported.** The lost edit on tab close is inferred from the code                                                              |
| PLAT-005         | The default test command fails for unrelated reasons: missing environment values, a swapped date assertion, a missing argument in two exporter tests, and three placeholder scripts | `test.log` from the baseline script                                                                                           | **Reported**                                                                                                                    |
| PLAT-013         | Creating or cloning a project does not store `enableLigatures`, so the database default `true` wins                                                                                 | `apps/api/src/modules/project/infra/prisma/prisma-project.repository.ts:79`                                                   | **Reported**                                                                                                                    |

## State and data

| ID     | Finding                                                                                                                                                                                       | Evidence                                                                          | Status                                                                  |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| APP-03 | Data from IndexedDB, localStorage, the URL, and the API enters the stores through casts. Nothing parses it, and `$version` is written but never read                                          | Five boundaries listed in the Fable report                                        | **Reported**                                                            |
| APP-04 | Fourteen app files spell out the project shape field by field, and the copies have drifted. The default `themeId` `'fleetTheme'` matches no registered theme                                  | `apps/codeimage/src/state/editor/model.ts` and its callers                        | **Reported.** The empty Theme select in the editor sidebar matches this |
| APP-08 | rxjs is imported in 12 app files. Three are unused, and the rest need `debounceTime`, `switchMap`, and `exhaustMap`. The app uses 1 of the 9 functions that `@codeimage/atomic-state` exports | `rg` counts in the Fable report                                                   | **Reported**                                                            |
| APP-09 | statebuilder is imported in 24 files. Of its 37 `.hold()` handlers, 34 set one field. It has no Solid 2.0 build                                                                               | `npm view statebuilder`                                                           | **Reported**                                                            |
| APP-11 | Small bugs: `setTabName` ignores its `id` argument, the export file name uses the day of the month, `setFocused` is registered twice, and one i18n file name starts with a space              | `state/editor/editor.ts:208`, `hooks/use-export-image.ts:61`, `i18n/ notFound.ts` | **Read**                                                                |
| APP-13 | The service worker is not wired. `src/sw.ts`, five workbox packages, the `build-sw` script, and the `pwa` strings remain. knip reports 16 unused files in the app                             | `knip.log` from the baseline script                                               | **Reported**                                                            |

## Component layer and styling

| ID    | Finding                                                                                                                                                                                                                                               | Evidence                                                                               | Status                                                                        |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| UI-01 | Production compiles vanilla-extract styles in the browser. A 69 kB runtime is preloaded and about 106 kB of style modules ship as JavaScript                                                                                                          | `apps/codeimage/vite.config.ts:24`, `dist/assets/vanilla-extract-css.browser.esm-*.js` | **Run.** The proposed small fix did not work in one trial. See the note below |
| UI-02 | `@codeimage/ui` (142 importing files), `@codeui/kit` (63), `solid-headless` (8), and `@kobalte/core` (2 direct) overlap on Button, Link, TextField, Dropdown, Popover, segmented control, and toast. Two token systems use two attributes on `<html>` | Import counts in the Opus report                                                       | **Reported**                                                                  |
| UI-03 | `solid-headless` and `@motionone/solid` are deprecated on npm. `solid-toast`, `@solid-aria/types`, and `@thisbeyond/solid-dnd` have had no release since 2023                                                                                         | `npm view <package> deprecated time`                                                   | **Run** for the two deprecations                                              |
| UI-04 | `@codeui/kit` 0.1.5 was last published on 2024-10-31. Its manifest has a `link:` dependency that points to a folder on the author's machine. The app has 8 `@ts-expect-error` comments for `@codeui/kit` types                                        | `npm view @codeui/kit@0.1.5 dependencies`                                              | **Reported**                                                                  |
| UI-05 | The `@codeui/kit` and `@thisbeyond/solid-dnd` patches change nothing in the installed files. `patches/csstype@3.1.1.patch` is not referenced                                                                                                          | `patches/`, root `package.json`                                                        | **Reported**                                                                  |
| UI-06 | `packages/ui` is not on npm and has one consumer, but keeps a Rollup and Babel pipeline. Its `exports` map lists CJS and ESM, and the build writes ESM only. Ten of its components have no caller                                                     | `packages/ui/tools/with-solid.ts`, `packages/ui/package.json`                          | **Reported**                                                                  |
| UI-07 | `RadioBlock` is a `div` with `onClick` and no role, tab stop, or key handler. The window style picker and the theme mode picker use it                                                                                                                | `packages/ui/src/lib/primitives/RadioBlock/RadioBlock.tsx:14-21`                       | **Reported**                                                                  |

### Note on UI-01

The auditor proposed a small fix: update `@vanilla-extract/vite-plugin` to 5.2.6 and remove `unstable_mode: 'transform'`. The coordinator tried it on a scratch branch. The build fails with 75 errors of two kinds.

- App `.css.ts` files import from the `@codeimage/ui` entry point. That entry point loads Solid client code, and the vanilla-extract compiler evaluates it in a server context.
- The built `packages/ui/dist` refers to `.css.ts` files that the build does not ship.

The trial ran once and no fix was tested. Two fixes are possible: the app consumes `packages/ui` from source and imports tokens from a module with no component code, or the built package gets a tokens-only entry point.

## Platform and delivery

| ID       | Finding                                                                                                                                                                                                                                                                                    | Evidence                                                                   | Status                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------ |
| PLAT-006 | The API deploy bundle keeps `catalog:` specifiers that only the workspace root resolves, and two packages needed at runtime sit in `devDependencies`                                                                                                                                       | `apps/api/package.json:70-71`, `packages/prisma-models/package.json:27`    | **Reported**                         |
| PLAT-007 | `packages/dom-export` is a fork of html-to-image. Its resource cache ignores URL queries and never evicts, and two iframes are not removed after export                                                                                                                                    | `packages/dom-export/src/lib/getBlobFromURL.ts:11`, `iosResourceFix.ts:31` | **Reported**                         |
| PLAT-008 | Five direct dependencies are deprecated on npm: `solid-headless`, `@motionone/solid`, `@mswjs/data`, `@types/prettier`, and `rollup-plugin-terser`. Peer ranges in `packages/ui` and `packages/dom-export` disagree with their own dependencies, and `.npmrc` turns off strict peer checks | `packages/ui/package.json:60-75`                                           | **Reported**                         |
| PLAT-009 | The CI path filter runs but its outputs are hard-coded to `true`. CI does not run `format:check` or the exporter tests                                                                                                                                                                     | `.github/workflows/main.yml:26-45`                                         | **Read** for the hard-coded outputs  |
| PLAT-010 | `CONTRIBUTING.md` requires Docker for every contributor. The app runs on mocks with a seven-line `.env.local` and no backend                                                                                                                                                               | `CONTRIBUTING.md:58`                                                       | **Run.** The UI track used this path |
| PLAT-012 | `format:check` fails on three source files and one generated route tree                                                                                                                                                                                                                    | `format-check.log` from the baseline script                                | **Run**                              |
| PLAT-014 | Development and CI use PostgreSQL 13, which is past its end of life                                                                                                                                                                                                                        | `apps/api/docker-compose.dev.yml`, `.github/workflows/main.yml:381`        | **Read**                             |
| APP-12   | The API client has no typed error. An autosave with an expired session can redirect the user during an edit                                                                                                                                                                                | `apps/codeimage/src/data-access/client.ts`                                 | **Reported**                         |
| DEV-02   | With mocks on, the page logs repeated `TypeError` exceptions from the msw worker client                                                                                                                                                                                                    | Browser console on `/`                                                     | **Run.** Cause not found             |

## Solid 2.0 readiness

`solid-js` is at 1.9.19 on the `latest` tag and at `2.0.0-rc.21` on `next` (`npm view solid-js dist-tags`, 2026-11-14). All three auditors recommend against a move now.

About 220 call sites in the app and 45 in `packages/ui` use an API that changes in 2.0. Most are renames. The hard ones are 10 `createResource` calls, the effects that write state, the `observable` and `from` interop behind rxjs, and store path setters reached through statebuilder.

The dependencies block the move more than the app code does. These have no stable Solid 2.0 release today. `solid-toast` and `@solid-aria/types` also peer on Solid 1. Roadmap step 18 removes the first, and a local type alias can replace the second.

| Dependency              |               Files that import it                | State on 2026-11-14                                             |
| ----------------------- | :-----------------------------------------------: | --------------------------------------------------------------- |
| `@kobalte/core`         | 2 direct, and under every `@codeui/kit` component | `2.0.0-alpha.4`, with the peer pinned to `solid-js 2.0.0-rc.16` |
| `@codeui/kit`           |                        63                         | No 2.0 work. Maintainer-owned                                   |
| `statebuilder`          |                        24                         | No 2.0 build. Maintainer-owned                                  |
| `solid-codemirror`      |                         6                         | No 2.0 work. Maintainer-owned                                   |
| `@solidjs/router`       |                    App routes                     | `2.0.0-next.44`, needs `solid-js ^2.0.0-rc.19`                  |
| `@thisbeyond/solid-dnd` |                         4                         | No release since 2023-11                                        |
| `solid-headless`        |                         8                         | Deprecated                                                      |
| `@motionone/solid`      |                         2                         | Deprecated                                                      |

## Lock-in

| Dependency or pattern            |         Importing files          | Cost to leave                              | Worth leaving                     |
| -------------------------------- | :------------------------------: | ------------------------------------------ | --------------------------------- |
| Solid 1 runtime and JSX          |               192                | High                                       | No                                |
| vanilla-extract                  | 86 importers, 90 `.css.ts` files | High                                       | No. All three auditors say keep   |
| `@codeimage/ui` package boundary |               142                | Medium, a path codemod                     | Yes                               |
| `@codeui/kit`                    |                63                | High, 18 components to move                | Maintainer's call                 |
| statebuilder                     |                24                | Medium                                     | Maintainer's call                 |
| rxjs                             |                12                | Medium, after saving is derived from state | Yes                               |
| `@codeimage/atomic-state`        |                2                 | Low                                        | Yes                               |
| `solid-headless`                 |                8                 | Low                                        | Yes                               |
| Fastify, Prisma, Auth0           |            46, 32, 20            | Medium to high                             | No                                |
| `packages/dom-export`            |           2 consumers            | Low for the API, high for behavior         | Not before browser fixtures exist |
