# @codeimage/prisma-models

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
