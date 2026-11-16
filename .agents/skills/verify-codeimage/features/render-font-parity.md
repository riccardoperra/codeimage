# Cached font pixel parity

Install all font resources and compare every font at weights 400, 500, 600 and 700 against a preserved renderer bundle. The multilingual fixture includes ligatures, CJK and emoji. Every PNG must be byte-identical.

Source entry points (repository-relative): packages/render/src/fontCache.ts, packages/render/src/render.ts.

## Prerequisites and launch

Use node_modules/.bin/tsx rather than node: the sample fixture imports TypeScript. Supply an independently preserved baseline with its dependencies and fonts, and record its revision. CODEIMAGE_CACHE_DIR selects a reusable cache.

From the repository root:

```sh
node_modules/.bin/tsx .agents/skills/verify-codeimage/scripts/cli/font-parity.mjs /absolute/baseline/dist/index.mjs
```

These assertions cover the listed lanes. They do not certify production OAuth, the real API or another operating system. Keep logs and downloaded artifacts outside the checkout.
