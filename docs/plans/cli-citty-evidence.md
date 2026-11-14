# CLI citty migration evidence

The CLI command uses citty 0.2.2, pinned exactly. The baseline is PR #704
head `c446a24ae4b365c64586dac14226ce46ab38d780`. This branch targets
`feat/cli-feature-flags`. The operator updated the baseline from `ffc0827c`
after PR #704 advanced during implementation. No existing PR branch was changed by this task.

## Structure and compatibility

`bin.ts` defines and runs a citty command. Core arguments and each feature's
`args` supply the parsing schema and generated help. The old `OPTIONS`,
`USAGE`, and per-feature aligned help strings are removed. Feature transforms,
conflicts, line ranges, theme validation, and zod preset parsing retain their
rules. The existing 77 tests are unchanged.

Citty's parser accepts unknown flags and missing string values. It also
interprets `--no-` prefixes as boolean negation and handles mixed aliases
differently from Node's strict parser. `normalizeArgs` derives a strict Node
syntax preflight from the citty definitions. It passes canonical option names,
inline string values, and an explicit positional separator to citty. Boolean
names use citty's camel-case aliases to preserve literal `--no-redact`.
Ordinary string options keep the last value, including mixed `-o` and
`--output`. Citty does not accumulate repeated strings. A `multiple: true` extension in a
feature's citty definition marks repeatable arguments. The boundary adapter
restores those values from the normalized options before the positional
separator, so `--focus 2-3 --focus 9` reaches the existing domain logic as an
array. Other string options still keep their last value. There is one
maintained argument schema and no custom scanner for original CLI syntax.

The command uses `runCommand`, rather than `runMain`, so its existing error
boundary retains usage exit 2 and render/write exit 1. Citty's `renderUsage`
supplies help on stdout and no-input TTY usage on stderr. Its generated layout
uses argument and option sections and `--flag=<hint>` labels. The old example
block is absent from generated help. CLI usage examples remain in the README.

## Verification

Verification ran with Node 26.5.0. No server or browser ran.
Receipts are in `/tmp/codeimage-citty-latest-evidence/` on the verification machine.

- `pnpm install` and `pnpm libs:build` pass. Install and build retain existing
  peer, patch, and asset warnings.
- The unchanged CLI tests pass 77/77 before and after. Renderer tests pass
  48/48. Shared diff, annotation, and alt-text tests pass 32/32.
- `pnpm lint` and full `pnpm typecheck` pass. CLI lint has zero warnings.
  The app retains its existing 32 lint warnings. Prisma generation and the
  API declaration build ran as documented in the feature-flags evidence.
- The existing feature-flags verifier passes all 28 invocations in tmux,
  before and after. All 41 image and alt-sidecar files compare byte for byte.
- A local Node comparison harness passes 183 before/after cases. It compares
  exit status, stdout bytes, and stderr bytes for render and error cases.
  It covers binary PNG stdout, SVG stdout, empty stdin, explicit stdin,
  positional separators, missing files, render/write errors, invalid values,
  unknown flags, missing values, boolean assignments and negations, repeated
  values, mixed short/long aliases, repeated focus ranges and invalid earlier
  focus values, and dash-prefixed inline values. Help cases assert success
  and stdout usage, allowing the generated layout.
- A PTY harness passes no-input terminal usage, explicit `-` terminal errors,
  and help, on both versions. No input exits 2 with usage on stderr. Explicit
  `-` retains its exact error and exits 2. Help exits 0 on stdout.
- `pnpm --filter=@codeimage/cli pack` produces a tarball that installs through
  npx from a clean directory and empty npm cache, with only Node, npx, and sh
  on PATH. It renders an exact 1200 by 630 PNG with a signature, repeated focus
  ranges, a highlight, a redaction diagnostic, and a masked alt sidecar.

The Node comparison harness and receipts are saved as `compare-cli.mjs`,
`boundary-results.json`, and `boundary.log` in the receipt directory. PTY
receipts are `check-tty.py`, `tty-results.json`, and `tty.log`. The tmux
transcript is `tmux-after.txt`. Help captures are `help-before.txt` and
`help-after.txt`; both are included in the PR body.

## Reproduce

```sh
pnpm install
pnpm --filter=@codeimage/api exec prisma generate
pnpm --filter=@codeimage/prisma-models build
pnpm --filter=@codeimage/api build:ts
pnpm libs:build
pnpm --filter=@codeimage/cli test
pnpm --filter=@codeimage/render test
pnpm --filter=@codeimage/app test src/core/diff/parseAnnotations.test.ts src/core/diff/parseUnifiedDiff.test.ts src/core/altText.test.ts
pnpm lint
pnpm typecheck
```

Run in tmux, as in `cli-feature-flags-evidence.md`.

```sh
node packages/cli/scripts/verify-feature-flags.mjs /tmp/cli-citty-flags
```

Capture `node packages/cli/dist/bin.js --help` and the verifier outputs on the
baseline before rebuilding this branch. Compare the image and `.alt.txt`
bytes after the second run.

## Source line counts

Counts include blank lines and comments. Test files remain unchanged.

| Files in `packages/cli/src` | Before | After |
| --- | ---: | ---: |
| All tracked files, including README and tests | 1,529 | 1,621 |
| TypeScript, including tests | 1,522 | 1,614 |
| Production TypeScript, excluding tests and test utilities | 753 | 845 |

The increase is 92 lines. Citty metadata and the strict compatibility adapter
cost more lines than the deleted help literals and option map. The maintenance
improvement is one schema for arguments and generated help, with each feature
still owning its definitions and domain logic.

Regenerate the full-source counts with the following commands.

```sh
git ls-tree -r --name-only c446a24a packages/cli/src | while IFS= read -r path; do git show "c446a24a:$path"; done | wc -l
git ls-files packages/cli/src | xargs wc -l
```
