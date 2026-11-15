# P11 delivery evidence

Base: P10 `3f0f4fdc`. Node 24.14.0, macOS arm64, 2026-11-15.

## Measurements

`npm pack --dry-run --json` on P10 and P11 produced these byte counts:

| Package | P10 packed | P11 packed | P10 unpacked | P11 unpacked |
| ------- | ---------: | ---------: | -----------: | -----------: |
| CLI     | 14,284,074 |  3,854,295 |   25,796,172 |   13,756,632 |
| Render  | 13,790,599 |  3,350,351 |   23,687,219 |   11,603,358 |

Each package's font payload falls from 12,921,196 B to 561,256 B, a 95.66% reduction.
The nine remaining files are UI Inter, signature Inter Latin/Latin-ext, and six
JetBrains Mono subsets. Packed reductions are 10,429,779 B and 10,440,248 B.
Both exceed 80% of P10's font bytes, 10,336,957 B.

`packages/cli/scripts/measure-font-delivery.mjs` alternated seven cold processes
per side for the same 50-line TypeScript file, Fira Code preset and scale 1.
All fourteen PNGs were byte-identical; no command failed. P10 median was
2,273.1 ms, range 1,595.5–6,164.0 ms. P11 median was 1,451.2 ms, range
709.6–1,953.6 ms. The observed median meets the P10 +50 ms limit.
The eight-core host was overloaded, with load averages around 13 and other
pnpm/Node processes running. These numbers do not establish a speedup.
Separate main-thread profiles show module compilation and idle/native waits
among the largest costs; they do not profile Takumi's native worker.

## Verification

- Prisma generation, prisma-models build, API build and CI-style `pnpm libs:build` passed.
- CLI/render/app TypeScript checks and touched-file oxfmt/oxlint passed.
- 92 CLI tests and 85 renderer tests passed. The manifest generator test also passed.
- The overloaded host caused existing five-second tests to time out in a parallel run. Serialized local verification used a 30-second timeout.
- All 271 remote URLs matched their pinned size and SHA-256.
- All 75 Chrome parity cells matched P10's result rows exactly. Every native PNG also matched P10 byte-for-byte.
- Another 56 cache-backed PNGs, covering 14 fonts and four weights with mixed scripts, matched P10 byte-for-byte.
- All 28 existing CLI feature-flag runs and artifacts passed.
- Four independent cache workers and four cold CLI processes published one valid object and produced identical PNGs.
- Fourteen code fonts in a fresh cache acquired only thirteen remote files and no fallbacks. Corrupt Fira repaired to the original PNG.
- An installed CLI tarball reused another installation's cache offline. The final tarball produced a valid offline PNG with read-only HOME and an explicit cache override.
- The installed macOS SFNSMono font rendered without cache mutation. Help, JSON inventory, paths and diagnostics stayed on stderr.
- A temporary forbidden clack import failed the oxlint restriction. Only `ui.ts` imports clack; each call binds stderr.

Rerunnable scripts are `packages/render/scripts/verify-font-urls.mjs`,
`verify-font-parity.mjs`, `packages/cli/scripts/verify-font-cache.mjs` and
`measure-font-delivery.mjs`. The parity and timing scripts take a P10 built
entry/binary path. Live PNGs and logs were kept in the local temporary evidence
directories rather than committed. The Linux marks-with-line-numbers 0.17%
cell is a known P10 issue on hold.

## Deviations from the sketch

- Signature Inter remains bundled under P10's separate family alias. It is still Inter and preserves P10 typography.
- Geist and IBM use the operator-approved pinned raw GitHub files. Geist failed the ASCII comparison; IBM passed ASCII probes but failed the full mixed-script render gate. Agave and variable Monaspace use the same pinned main commit.
- One Latin/default face of the selected code font loads before the needs pass. Without it, CJK-only Space Mono changes native line metrics. The other subsets remain lazy.
- Native renderers belong to requests rather than a long-lived renderer wrapper. This prevents registry history from affecting concurrent/local-font operations; the measured cold median stays below the limit.
- Final markup uses Takumi's public prepared-source API. Target sizing initially omits signatures, so collecting buffers directly after measurement missed signature-only glyphs. Bundled UI faces also accompany markup because Chrome needs their metrics even when the native pass skips them.
- Inventory verifies hashes, beyond the sketch's size-only check, so same-length corruption appears as missing without mutation.
- Help, lists and all paths use stderr as the operator requested, overriding the base sketch's stdout list/path examples. Plain and quiet completions report bytes and elapsed time after writing. Feature diagnostics are checked separately from completion and sidecar lines.
- A root-exported `resolveFontId` validates CLI names from the generated catalog. Importing app font configuration into the CLI pulled browser-only FontData types into Node.
- Cache clean detaches its managed subtree before deletion, and reads reject managed-directory symlinks. These strengthen clean/race safety while preserving the chosen content-addressed layout.
