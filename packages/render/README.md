# @codeimage/render

Renders a saved CodeImage project to PNG, JPEG, WebP, or SVG in Node, with no browser. The CLI calls it.

```ts
import {renderSnapshot} from '@codeimage/render';

const png = await renderSnapshot(project); // Uint8Array, or a string for SVG
```

`project` is the `ProjectEditorPersistedState` the app stores, plus optional `format` (default `png`), `scale` (default 2) and `width` in CSS pixels. As in the web export, the frame is never narrower than its longest line, so `width` is a minimum and code never wraps. Without `width` the frame is as wide as its content. `snapshotDocumentSchema` is the shared zod 4 schema; it accepts any version in the supported major and keeps unknown fields.

## How it renders

1. `dist/ssr/entry-server.js` is a Vite SSR build of `apps/codeimage/src/render/entry-server.tsx`. It server-renders the app's own frame and terminal components and P1's `StaticCodeView` with `renderToStringAsync`.
2. The CSS is the build's vanilla-extract output plus the stylesheet a CodeMirror editor with the theme would mount, CodeMirror's base theme included.
3. Takumi measures the frame, the frame is sized to whole CSS pixels as the web export is, and Takumi rasterizes it at `scale`.

Only Inter and JetBrains Mono ship in `dist/fonts`. Other fonts come from a
build-generated catalog of immutable URLs, sizes, cmap-narrowed Unicode ranges
and SHA-256 hashes. Takumi selects the needed subsets. Each request owns its
native renderer and verified buffers, so concurrent or earlier requests cannot
change its font selection. The selected code font's Latin/default face loads
before selection because its metrics affect CJK-only line boxes.

The fallback order is Twemoji, Noto Sans SC, then Noto Sans KR. Japanese text
uses Noto Sans SC glyph shapes. Characters absent from these fonts retain the
renderer’s missing-glyph behavior. Bundled notices are in `dist/fonts/licenses`.

```ts
import {createRenderer, openFontCache} from '@codeimage/render';

const renderer = createRenderer({
  offline: true,
  cacheDir: '/tmp/codeimage-cache',
});
const png = await renderer.render(project);
const markup = await renderer.markup(project);
// markup.fonts contains verified data buffers, including required fallbacks.
const cache = openFontCache();
await cache.install(['fira-code']);
const inventory = await cache.list();
await cache.clean();
```

`createRenderer` also accepts `codeFontFile`, an abort `signal` and an `onEvent`
callback. `snapshotMarkup` and `renderSnapshot` retain their online defaults.
Cache policy and CLI commands are documented in [the CLI README](../cli/README.md#fonts-and-offline-rendering).

## Develop

`pnpm --filter=@codeimage/render build` runs the app's `vite build --mode render`, copies the fonts, and bundles the package. Build the other libraries first; `pnpm libs:build` does both in order. Tests read the built `dist`.

- `pnpm --filter=@codeimage/render test` runs the schema and render tests.
- `pnpm exec tsx scripts/perf.ts` from this package times a 300-line render.
- `pnpm exec tsx scripts/parity/takumi-vs-chrome.ts` from the repository root compares every theme and terminal against Chrome.
- `pnpm exec tsx scripts/parity/live-p3.ts` from the repository root runs the renderer's live checks.

Font source recipes live in `build-fonts.mjs`. Package versions must match exact
`devDependencies` pins. The generator derives every hash and Unicode range.
`node packages/render/scripts/verify-font-urls.mjs` checks all remote artifacts.
`node packages/render/scripts/verify-font-parity.mjs <P10-dist/index.mjs>` compares
all font families and weights against a P10 build using the shared cache.
