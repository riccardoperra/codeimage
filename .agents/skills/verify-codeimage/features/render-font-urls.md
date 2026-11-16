# Immutable font sources

Parse the shipped font manifest, fetch every remote file with six workers and a 30-second timeout, and require the exact byte length and SHA-256 hash. Local-only artifacts are excluded.

Source entry points (repository-relative): packages/render/src/fontManifest.ts.

## Prerequisites and launch

Node 24, built renderer manifest, network access to the manifest URLs. This is an external-resource check and does not need a browser.

From the repository root:

```sh
node .agents/skills/verify-codeimage/scripts/cli/font-urls.mjs [manifest.json]
```

These assertions cover the listed lanes. They do not certify production OAuth, the real API or another operating system. Keep logs and downloaded artifacts outside the checkout.
