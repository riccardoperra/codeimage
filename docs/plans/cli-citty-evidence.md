# CLI citty migration evidence

The CLI uses citty 0.2.2, pinned exactly. The baseline is PR #704 head
`c446a24ae4b365c64586dac14226ce46ab38d780`. This branch targets
`feat/cli-feature-flags`. No other PR branch was changed.

## Structure

`args.ts` declares the core options, and each feature module declares its own
`args`. Together they are a citty `ArgsDef`, which is the only option schema.
`COMMAND` adds the command name and the `FILE...` positional, and citty's
`renderUsage(COMMAND)` prints help on stdout and the no-input TTY usage on
stderr. The old `USAGE` literal, the `OPTIONS` map, and the per-feature
aligned help strings are gone.

Node's `parseArgs` parses argv once and strictly, from the same schema, with
citty's `alias` renamed to Node's `short`. Citty's own parser is `parseArgs`
with `strict: false` plus extras the CLI does not want. It accepts unknown
flags and missing values, treats `--no-redact` as negating `redact`, and keeps
only the last of repeated values. Parsing strictly keeps exit 2 and the Node
error messages that name the flag. `multiple: true` on `--focus` makes it
repeatable. Feature transforms, conflicts, line ranges, theme validation, and
zod preset parsing keep their rules. The 77 existing tests are unchanged.

`bin.ts` keeps its own `main` and error boundary: 0 for success, 1 for render
or write failures, 2 for usage errors. It does not use citty's `runCommand`,
which would parse argv a second time and permissively. It also does not use
`runMain`, which exits 1 on usage errors.

## Review round

The first version ran Node's strict parser as a preflight and rebuilt argv for
it. It then parsed argv again with citty and restored repeated `--focus`
values from the rebuilt argv. The review deleted the preflight rebuild, the
second parse, the camel-case workaround for `--no-redact`, the repeated-value
restore, and the `runCommand` wrapper. One strict parse remains. Help output is
byte-identical to the first version.

## Verification

Verification ran with Node 26.5.0. No server or browser ran.

- `pnpm install`, the API Prisma and `build:ts` steps, and `pnpm libs:build`
  pass.
- CLI tests pass 77/77. Renderer tests pass 48/48. Shared diff, annotation,
  and alt-text tests pass 32/32.
- `pnpm lint` passes with 0 CLI warnings. The app keeps its 32 existing
  warnings. Full `pnpm typecheck` passes.
- A Node harness ran the built `bin.js` from the first version (`a436aaaa`)
  and from this head on 69 cases. Exit status, stdout bytes, stderr bytes, and
  every written file match in all 69. Cases cover help, unknown and missing
  flags, invalid values for each option, mixed `-o`/`--output`, inline values,
  `--` separators, duplicate and empty stdin, PNG and SVG stdout, repeated and
  invalid repeated `--focus`, redaction, sizes, signatures, split tabs, alt
  sidecars, diffs, presets, format inference, and write errors.
- Under a PTY (`script`), no input, explicit `-`, and `--help` give identical
  bytes and exit codes (2, 2, 0) on both builds.
- In tmux, the feature-flags verifier passes all 28 runs on both builds. All
  42 image and alt-sidecar files are byte-identical. After normalizing the
  output directory, stdout, stderr, and results files are identical.
- The packed tarball installs with `npx --package=<tgz> codeimage` from a
  clean directory, with an empty npm cache and only `node`, `npx`, and `sh`
  on PATH. It renders a masked 1200 by 630 PNG with repeated focus ranges, a
  highlight, a signature, and a masked alt sidecar, writes PNG bytes to
  `-o -`, and exits 2 on `--bogus`.

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
node .agents/skills/verify-codeimage/scripts/cli/feature-flags/index.mjs /tmp/cli-citty-flags
```

## Source line counts

Counts include blank lines and comments. Test files are unchanged.

| `packages/cli/src`               | #704 `c446a24a` | First version `a436aaaa` | This head |
| -------------------------------- | --------------: | -----------------------: | --------: |
| All tracked files                |           1,529 |                    1,621 |     1,585 |
| Production TypeScript (no tests) |             753 |                      845 |       809 |

Parsing logic is smaller than in #704. The remaining 56 lines are declarative
citty metadata: each option is a formatted object of 3 to 6 lines, where #704
had one hand-aligned help line. Dropping the `valueHint`s would save only 18
more lines and degrade help labels to `--lines=<lines>`, so this branch keeps
them.

```sh
git ls-tree -r --name-only c446a24a packages/cli/src | while IFS= read -r path; do git show "c446a24a:$path"; done | wc -l
git ls-files packages/cli/src | xargs cat | wc -l
```
