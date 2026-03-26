# @codeimage/dom-export

## 1.12.0

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

## 1.11.5

### Patch Changes

- [#634](https://github.com/riccardoperra/codeimage/pull/634) [`7f715bd2`](https://github.com/riccardoperra/codeimage/commit/7f715bd2db3424503702a1156d69dbf1fbfeb10c) Thanks [@riccardoperra](https://github.com/riccardoperra)! - fix: disable box-shadow rendering on ios/safari

## 1.11.4

### Patch Changes

- [#631](https://github.com/riccardoperra/codeimage/pull/631) [`d8b472a2`](https://github.com/riccardoperra/codeimage/commit/d8b472a2a3ddc1fd113d89688d045755046ee8b0) Thanks [@riccardoperra](https://github.com/riccardoperra)! - feat: add support for go lang

## 1.11.3

### Patch Changes

- [#596](https://github.com/riccardoperra/codeimage/pull/596) [`ce94a3f1`](https://github.com/riccardoperra/codeimage/commit/ce94a3f17fffdd0e2e758f666a248e0217f3bce1) Thanks [@riccardoperra](https://github.com/riccardoperra)! - fix: add inter font on node export result

## 1.11.2

### Patch Changes

- [#533](https://github.com/riccardoperra/codeimage/pull/533) [`15312cd5`](https://github.com/riccardoperra/codeimage/commit/15312cd5e03b7890d80a29fbe073af832d499d9d) Thanks [@riccardoperra](https://github.com/riccardoperra)! - fix(app): canvas export image content is not rendered if it's higher than viewport

- [#510](https://github.com/riccardoperra/codeimage/pull/510) [`e38b990d`](https://github.com/riccardoperra/codeimage/commit/e38b990dfb1edcbc7ff4dd559a444eff05ecc277) Thanks [@riccardoperra](https://github.com/riccardoperra)! - feat: customizable export options

## 1.11.1

### Patch Changes

- [#446](https://github.com/riccardoperra/codeimage/pull/446) [`eddbed7f`](https://github.com/riccardoperra/codeimage/commit/eddbed7f6d2d1e89e7d2ec37a9718a80a3045096) Thanks [@riccardoperra](https://github.com/riccardoperra)! - fix(dom-export): cannot load font style value on firefox

## 1.11.0

### Minor Changes

- [#433](https://github.com/riccardoperra/codeimage/pull/433) [`25c4fdf4`](https://github.com/riccardoperra/codeimage/commit/25c4fdf4560282bb1769fd14cbc7a5b5301855fd) Thanks [@riccardoperra](https://github.com/riccardoperra)! - Add experimental `experimental_optimizeFontLoading` property

## 1.10.1

### Patch Changes

- [#351](https://github.com/riccardoperra/codeimage/pull/351) [`f317d34`](https://github.com/riccardoperra/codeimage/commit/f317d341c3ca87a2b197d7a5a34041a2f5bcbdbd) Thanks [@riccardoperra](https://github.com/riccardoperra)! - fix: disable shadow rendering on iOS devices

## 1.10.0

### Minor Changes

- [#270](https://github.com/riccardoperra/codeimage/pull/270) [`fc3b8fc`](https://github.com/riccardoperra/codeimage/commit/fc3b8fc413cd82eb6b461d0a1aad72b53ee35b35) Thanks [@riccardoperra](https://github.com/riccardoperra)! - build: fork and fixes
