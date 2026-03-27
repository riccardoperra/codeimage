# @codeimage/locale

## 0.8.0

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

## 0.7.0

### Minor Changes

- [#647](https://github.com/riccardoperra/codeimage/pull/647) [`db76eb05`](https://github.com/riccardoperra/codeimage/commit/db76eb0564534953ed3c05d1daadfc680d8277ae) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Update @codeui dependency, update vite/rollup and infra deps

## 0.6.2

### Patch Changes

- [#390](https://github.com/riccardoperra/codeimage/pull/390) [`ba3389a`](https://github.com/riccardoperra/codeimage/commit/ba3389a635ba8a5dae619ca59b38b48f2cb7a768) Thanks [@riccardoperra](https://github.com/riccardoperra)! - update dependencies

## 0.6.1

### Patch Changes

- [#298](https://github.com/riccardoperra/codeimage/pull/298) [`ac93b10`](https://github.com/riccardoperra/codeimage/commit/ac93b10887d52648a68a57e72ba6a1e427494c55) Thanks [@riccardoperra](https://github.com/riccardoperra)! - update dependencies and solid-codemirror to 2.0.0

## 0.6.0

### Minor Changes

- [#281](https://github.com/riccardoperra/codeimage/pull/281) [`18c1e22`](https://github.com/riccardoperra/codeimage/commit/18c1e224c4b717cad54b7c36f87d9501501197ce) Thanks [@riccardoperra](https://github.com/riccardoperra)! - perf: bundle/performance improvements, skeleton, split chunks and lazy loading

## 0.5.1

### Patch Changes

- [#256](https://github.com/riccardoperra/codeimage/pull/256) [`10839dc`](https://github.com/riccardoperra/codeimage/commit/10839dc41edc22ca81002083c34d5150f705df3e) Thanks [@riccardoperra](https://github.com/riccardoperra)! - build: update SolidJS to 1.4.2

## 0.5.0

### Minor Changes

- [#228](https://github.com/riccardoperra/codeimage/pull/228) [`2b7248e`](https://github.com/riccardoperra/codeimage/commit/2b7248e9ba080dec9de44f954a56d7f560dfd899) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Update dependencies and codemirror

* [#226](https://github.com/riccardoperra/codeimage/pull/226) [`e8aa8a3`](https://github.com/riccardoperra/codeimage/commit/e8aa8a3a2dd10e024991a42a9c858c665092d1e7) Thanks [@riccardoperra](https://github.com/riccardoperra)! - update deps, update codemirror

## 0.4.6

### Patch Changes

- [#171](https://github.com/riccardoperra/codeimage/pull/171) [`dedd4b6`](https://github.com/riccardoperra/codeimage/commit/dedd4b69ecb912c035218ab873cf9aa458652392) Thanks [@riccardoperra](https://github.com/riccardoperra)! - update dependencies

## 0.4.5

### Patch Changes

- [#165](https://github.com/riccardoperra/codeimage/pull/165) [`fa30bbe`](https://github.com/riccardoperra/codeimage/commit/fa30bbeaf83ab528973cbb23db97113b61a3f87e) Thanks [@riccardoperra](https://github.com/riccardoperra)! - build: update vite dependency

## 0.4.4

### Patch Changes

- 280de75: refactor(locale): replaced i18n core with solid-primitives

## 0.4.3

### Patch Changes

- ff4d634: fix: fix broken image export using safari

## 0.4.2

### Patch Changes

- 4d087e3: Workflow update

## 0.4.1

### Patch Changes

- c8ffdf7: New changeset workflow

## 0.4.0

### Minor Changes

- d53c7c8: feat: add mobile ui
- d44324d: feat: add pwa support
- 97ab722: feat: add font change support

## 0.3.0

### Minor Changes

- f653b6f: feat: add multiple language editor support
- fda1ee7: feat: add @codeimage/config

## 0.2.0

### Minor Changes

- 171d02f: Update package to @codeimage
- 56a7c2b: feat: add language selector

## 0.1.0

### Minor Changes

- 642944c: Add localization support

### Patch Changes

- 1d6b98e: fix use-i18n typings

## 0.1.0

### Minor Changes

- 5d94d1c: Add dynamic theme switch

## 0.0.2

### Patch Changes

- Add ui dynamic theme support
