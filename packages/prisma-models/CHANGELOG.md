# @codeimage/prisma-models

## 0.1.1

### Patch Changes

- [#736](https://github.com/riccardoperra/codeimage/pull/736) [`22123f4`](https://github.com/riccardoperra/codeimage/commit/22123f42d4ce604896c5d292876616d037edb03b) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Adds an Animate panel to the editor. With two or more tabs, it plays the morph from one tab to the next in place of the editor frame, with the same keyframes the export renders. Steps follow the tabs and can be reordered, and each step's hold, the transition, the easing, and the frame rate are saved with the project.

- [#698](https://github.com/riccardoperra/codeimage/pull/698) [`746c072`](https://github.com/riccardoperra/codeimage/commit/746c0726fad17bfcbc8a8ebb2a6c7a51cb78930c) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Add undoable diff, highlight, and focus line marks to the web editor and image exports. Import unified diffs and Shiki annotations on paste, and persist marks with each project tab.

- [#717](https://github.com/riccardoperra/codeimage/pull/717) [`6c77052`](https://github.com/riccardoperra/codeimage/commit/6c770522498310d34b59dacddd8b63bef5869134) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Regenerate the Prisma client with Prisma 7.10.1 and align its runtime utilities.

- [#729](https://github.com/riccardoperra/codeimage/pull/729) [`24a636d`](https://github.com/riccardoperra/codeimage/commit/24a636d8271c9d5a6d40122ebb2879bdb057401f) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Give the new editor's signature three styles (Minimal, Pill and Card), an optional platform icon, a Card avatar, three positions and ink that follows the background, all sized to the frame so they stay readable on social exports. Load the Card avatar from a public GitHub, Bluesky or Mastodon profile, or from an upload. Save up to three signatures per user, in the account or, for guests, in the browser, with one default for new snippets. Clicking the signature on the canvas opens its settings.

- [#696](https://github.com/riccardoperra/codeimage/pull/696) [`4f73ae6`](https://github.com/riccardoperra/codeimage/commit/4f73ae6a2a96069a26f8fe2e2d1171faceccdd5e) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Add exact social export sizes and an optional handle signature. Fit the whole code window inside each target, retain the existing watermark, and persist the target and signature in projects and presets.

- [#732](https://github.com/riccardoperra/codeimage/pull/732) [`1d7183c`](https://github.com/riccardoperra/codeimage/commit/1d7183c600530df80a3cd97753f063fdb0cbbe2b) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Add Card, Editor and Terminal window styles, an Accent wash surface, a theme-derived Hairline border and an Ambient frame suggestion. Persist surface choices in projects and presets, and expose generated keyword accents on built-in themes.

## 0.1.0

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
