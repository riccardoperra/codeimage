# CLI font delivery

Render every code font into a fresh cache, corrupt a same-length font object, and require repair with identical PNG bytes. Four concurrent cold processes must converge to one verified object. On macOS, SFNSMono must render offline without cache mutation. The optional second installed binary proves cache reuse across installs.

Source entry points (repository-relative): packages/cli/src/commands/fonts.ts, packages/render/src/fontCache.ts.

## Prerequisites and launch

Node 24, built CLI publish bundle, remote font access; macOS adds the system-font lane. The helper prints its temporary evidence directory.

From the repository root:

```sh
node .agents/skills/verify-codeimage/scripts/cli/font-cache.mjs [other-installed-cli/dist/bin.js]
```

These assertions cover the listed lanes. They do not certify production OAuth, the real API or another operating system. Keep logs and downloaded artifacts outside the checkout.
