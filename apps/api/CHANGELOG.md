# @codeimage/api

## 0.7.0

### Minor Changes

- [#736](https://github.com/riccardoperra/codeimage/pull/736) [`8893be7`](https://github.com/riccardoperra/codeimage/commit/8893be7e73e7ff6ccbb94bfb18d0b285eb147172) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Add animation editing to the unified editor, with a resizable timeline,
  per-transition easing, repeated steps, preview editing and saved header modes.

- [#736](https://github.com/riccardoperra/codeimage/pull/736) [`22123f4`](https://github.com/riccardoperra/codeimage/commit/22123f42d4ce604896c5d292876616d037edb03b) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Adds an Animate panel to the editor. With two or more tabs, it plays the morph from one tab to the next in place of the editor frame, with the same keyframes the export renders. Steps follow the tabs and can be reordered, and each step's hold, the transition, the easing, and the frame rate are saved with the project.

- [#698](https://github.com/riccardoperra/codeimage/pull/698) [`746c072`](https://github.com/riccardoperra/codeimage/commit/746c0726fad17bfcbc8a8ebb2a6c7a51cb78930c) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Add undoable diff, highlight, and focus line marks to the web editor and image exports. Import unified diffs and Shiki annotations on paste, and persist marks with each project tab.

- [#717](https://github.com/riccardoperra/codeimage/pull/717) [`612d52d`](https://github.com/riccardoperra/codeimage/commit/612d52dcb9b5c9bcde331239b6219f898cf7a6fb) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Organize the API into contract-driven modules with typed command and query buses, owner-scoped repositories, a shared error envelope, and request ids.

- [#729](https://github.com/riccardoperra/codeimage/pull/729) [`24a636d`](https://github.com/riccardoperra/codeimage/commit/24a636d8271c9d5a6d40122ebb2879bdb057401f) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Give the new editor's signature three styles (Minimal, Pill and Card), an optional platform icon, a Card avatar, three positions and ink that follows the background, all sized to the frame so they stay readable on social exports. Load the Card avatar from a public GitHub, Bluesky or Mastodon profile, or from an upload. Save up to three signatures per user, in the account or, for guests, in the browser, with one default for new snippets. Clicking the signature on the canvas opens its settings.

- [#696](https://github.com/riccardoperra/codeimage/pull/696) [`4f73ae6`](https://github.com/riccardoperra/codeimage/commit/4f73ae6a2a96069a26f8fe2e2d1171faceccdd5e) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Add exact social export sizes and an optional handle signature. Fit the whole code window inside each target, retain the existing watermark, and persist the target and signature in projects and presets.

- [#732](https://github.com/riccardoperra/codeimage/pull/732) [`1d7183c`](https://github.com/riccardoperra/codeimage/commit/1d7183c600530df80a3cd97753f063fdb0cbbe2b) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Add Card, Editor and Terminal window styles, an Accent wash surface, a theme-derived Hairline border and an Ambient frame suggestion. Persist surface choices in projects and presets, and expose generated keyword accents on built-in themes.

### Patch Changes

- [#717](https://github.com/riccardoperra/codeimage/pull/717) [`081ade6`](https://github.com/riccardoperra/codeimage/commit/081ade68ed2aff7f2bbd15eb6fee2161dc18bae6) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Update backend dependencies and remove unused development and schema packages.

- [#717](https://github.com/riccardoperra/codeimage/pull/717) [`b2a3630`](https://github.com/riccardoperra/codeimage/commit/b2a3630d5b252af37d03ceb1ae900b6f3b32c220) Thanks [@riccardoperra](https://github.com/riccardoperra)! - fix(api): check project ownership on update and rename
- Updated dependencies [[`22123f4`](https://github.com/riccardoperra/codeimage/commit/22123f42d4ce604896c5d292876616d037edb03b), [`746c072`](https://github.com/riccardoperra/codeimage/commit/746c0726fad17bfcbc8a8ebb2a6c7a51cb78930c), [`6c77052`](https://github.com/riccardoperra/codeimage/commit/6c770522498310d34b59dacddd8b63bef5869134), [`24a636d`](https://github.com/riccardoperra/codeimage/commit/24a636d8271c9d5a6d40122ebb2879bdb057401f), [`4f73ae6`](https://github.com/riccardoperra/codeimage/commit/4f73ae6a2a96069a26f8fe2e2d1171faceccdd5e), [`1d7183c`](https://github.com/riccardoperra/codeimage/commit/1d7183c600530df80a3cd97753f063fdb0cbbe2b)]:
  - @codeimage/prisma-models@0.1.1

## 0.6.0

### Minor Changes

- [#685](https://github.com/riccardoperra/codeimage/pull/685) [`22b1ca8`](https://github.com/riccardoperra/codeimage/commit/22b1ca841bc709909818164323f7bf59733938ff) Thanks [@riccardoperra](https://github.com/riccardoperra)! - [#685](https://github.com/riccardoperra/codeimage/issues/685) Refactor codebase to use latest stack

  CodeImage tech stack will be upgraded with latest modern versions
  - General workspace upgrades
  - [x] Eslint -> Oxlint
  - [x] Prettier -> Oxlint
  - [x] pnpm 6 -> pnpm 10
  - @codeimage/app
  - [x] Vite 5.4 -> Vite 8
  - [x] Solid 1.6 -> 1.9
  - @codeimage/api
  - [x] Fastify 4.18.0 -> 5.8.2
  - [x] Prisma 4.15 -> 7.5.0 https://github.com/riccardoperra/codeimage/pull/688
  - [x] TypeScript 5.3 -> 6.0.2 https://github.com/riccardoperra/codeimage/pull/687
  - [x] Tsup -> Tsdown
  - [x] Vitest 0.31.4 -> 4.1.0
  - codeimage/website
  - [x] solid-start 0.2.26 -> TanStack Start (SSG)
  - [x] Vite 3.2 -> Vite 8
  - @codeimage/{config,locale,atomic-state,highlight}
  - [x] Vite 3.2 -> Vite 8
  - [x] Vitest 0.26.2 -> 4.1.0
  - [x] TypeScript 5.3.2 -> 6.0.2
  - [x] Rollup 2.79.2 -> tsdown
  - [x] prettier 2.8 -> prettier 3.8 (application logic for code formatting into canvas)
  - @codeimage/ui
  - [x] Vite 3.2.5 -> Vite 8
  - [x] Rollup 2.79 -> 4.60.0
  - [x] vanilla-extract latest versions

### Patch Changes

- [#685](https://github.com/riccardoperra/codeimage/pull/685) [`0a6bbf9`](https://github.com/riccardoperra/codeimage/commit/0a6bbf97a1692e73daa51449a76ae32388ffcbaa) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Update to TypeScript 6.0

- [#685](https://github.com/riccardoperra/codeimage/pull/685) [`9d17f94`](https://github.com/riccardoperra/codeimage/commit/9d17f945b8074dab4bb172106f5478122a90458a) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Upgrade to Prisma 7

- Updated dependencies [[`22b1ca8`](https://github.com/riccardoperra/codeimage/commit/22b1ca841bc709909818164323f7bf59733938ff), [`0a6bbf9`](https://github.com/riccardoperra/codeimage/commit/0a6bbf97a1692e73daa51449a76ae32388ffcbaa), [`9d17f94`](https://github.com/riccardoperra/codeimage/commit/9d17f945b8074dab4bb172106f5478122a90458a)]:
  - @codeimage/prisma-models@0.1.0

## 0.5.0

### Minor Changes

- [#647](https://github.com/riccardoperra/codeimage/pull/647) [`db76eb05`](https://github.com/riccardoperra/codeimage/commit/db76eb0564534953ed3c05d1daadfc680d8277ae) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Update @codeui dependency, update vite/rollup and infra deps

## 0.4.1

### Patch Changes

- [#631](https://github.com/riccardoperra/codeimage/pull/631) [`d8b472a2`](https://github.com/riccardoperra/codeimage/commit/d8b472a2a3ddc1fd113d89688d045755046ee8b0) Thanks [@riccardoperra](https://github.com/riccardoperra)! - feat: add support for go lang

## 0.4.0

### Minor Changes

- [#611](https://github.com/riccardoperra/codeimage/pull/611) [`e94e8a2d`](https://github.com/riccardoperra/codeimage/commit/e94e8a2d5ec01cddd7593c837bf59f55b8a4e231) Thanks [@riccardoperra](https://github.com/riccardoperra)! - feat(app,api) add new border type glass option

- [#624](https://github.com/riccardoperra/codeimage/pull/624) [`9e537bcd`](https://github.com/riccardoperra/codeimage/commit/9e537bcdf92ffaf43eb5e38f5f7fb578eaef9709) Thanks [@riccardoperra](https://github.com/riccardoperra)! - feat(app,api): add line number start option

## 0.3.2

### Patch Changes

- [#587](https://github.com/riccardoperra/codeimage/pull/587) [`779c8813`](https://github.com/riccardoperra/codeimage/commit/779c8813627a45102f04d39fdeea42d0b869082c) Thanks [@riccardoperra](https://github.com/riccardoperra)! - fix: fix api test

## 0.3.1

### Patch Changes

- [#560](https://github.com/riccardoperra/codeimage/pull/560) [`b0bb4c73`](https://github.com/riccardoperra/codeimage/commit/b0bb4c739f3d800007725c3314bebd549019f5fc) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Export with rounded corners

## 0.3.0

### Minor Changes

- [#493](https://github.com/riccardoperra/codeimage/pull/493) [`d639a547`](https://github.com/riccardoperra/codeimage/commit/d639a547db0b0fa0286ff5318244deab2428cff9) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Add `presets` support #472 #451

- [#527](https://github.com/riccardoperra/codeimage/pull/527) [`2a85dec7`](https://github.com/riccardoperra/codeimage/commit/2a85dec7f748cbdffb770769b0989b3acc712365) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Add ESM, TypeScript 5.0, Vitest and nodenext support

### Patch Changes

- [#493](https://github.com/riccardoperra/codeimage/pull/493) [`b7951610`](https://github.com/riccardoperra/codeimage/commit/b79516107805a9f6b2de1fe88f5cd0cf52999284) Thanks [@riccardoperra](https://github.com/riccardoperra)! - feat(api): add configurable preset limit

## 0.2.0

### Minor Changes

- [#486](https://github.com/riccardoperra/codeimage/pull/486) [`f5df888f`](https://github.com/riccardoperra/codeimage/commit/f5df888f031b416e0db62863218f2aeb512766c8) Thanks [@riccardoperra](https://github.com/riccardoperra)! - feat(app/api): allow to disable ligatures in fonts #483

## 0.1.1

### Patch Changes

- [`f38633d4`](https://github.com/riccardoperra/codeimage/commit/f38633d4ae89bae1c3a40bdedf4b8fb94adde689) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Handle auth0 registration error

## 0.1.0

### Minor Changes

- [#327](https://github.com/riccardoperra/codeimage/pull/327) [`2580cd60`](https://github.com/riccardoperra/codeimage/commit/2580cd606b1bf76880289e96537bc9c41658a2a9) Thanks [@riccardoperra](https://github.com/riccardoperra)! - add /clone endpoint
