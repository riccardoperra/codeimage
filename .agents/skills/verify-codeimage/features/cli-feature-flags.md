# CLI feature flags

Run a built CLI with diff input, focus ranges, annotation marks, secret redaction, export targets, signatures, split tabs and alt-text sidecars. The check decodes PNGs, compares focus pixels and redacted SVGs, and rejects conflicting flags.

Source entry points (repository-relative): packages/cli/src/bin.ts, packages/cli/src/snapshot.ts, packages/cli/src/flags/index.ts.

## Prerequisites and launch

Node 24 and built render/CLI libraries. Each run uses a fresh output directory.

From the repository root:

```sh
node .agents/skills/verify-codeimage/scripts/cli/feature-flags/index.mjs /tmp/codeimage-flags
```

These assertions cover the listed lanes. They do not certify production OAuth, the real API or another operating system. Keep logs and downloaded artifacts outside the checkout.
