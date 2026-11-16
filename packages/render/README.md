# @codeimage/render

Renders a saved CodeImage project to PNG, JPEG, WebP, or SVG in Node, with no browser. The CLI calls it.

```ts
import {renderSnapshot} from '@codeimage/render';

const png = await renderSnapshot(project); // Uint8Array, or a string for SVG
```

`project` is the `ProjectEditorPersistedState` the app stores, plus optional `format` (default `png`), `scale` (default 2) and `width` in CSS pixels. As in the web export, the frame is never narrower than its longest line, so `width` is a minimum and code never wraps. Without `width` the frame is as wide as its content. `snapshotDocumentSchema` is the shared zod 4 schema; it accepts any version in the supported major and keeps unknown fields.

## Animation

```ts
import {renderAnimation} from '@codeimage/render';

const webp = await renderAnimation({...project, format: 'webp'}); // Uint8Array
```

`renderAnimation` plays the `animation` the project stores, as the editor's Animate panel saves it: each step holds its tab for `holdMs`, and the transition into a step lasts that step's own `transition.ms` with its `transition.easing`, else the animation's `transitionMs` and `easing`. An easing is `smooth`, `snappy`, `strong`, `linear`, or a `cubic-bezier()`. `header.mode` shows the active tab (`tab`), every tab (`tabs`), or only `header.title` (`title`) in every frame. A project without steps plays every tab in order with 800 ms holds, 700 ms transitions, the `smooth` easing, and 30 fps. `format` is `webp` (default), `gif`, or `apng`, and `scale` and `width` work as for a still image. `parseAnimationSettings` reads the settings as the editor reads them: it clamps durations to the editor's limits, falls back to the defaults for invalid values, and drops a step whose tab is gone. `src/animationSettings.test.ts` checks it against the editor's own parser.

The image is as large as the largest step. The first and last frame of a transition match the still export of the step it leaves and the step it reaches.

- WebP is lossless. Takumi writes lossy animated WebP without an alpha channel, so the clear pixels around the frame would turn opaque: its rounded corners fill in, and the margin around a smaller step turns black.
- A GIF frame lasts whole hundredths of a second. As in the web export, GIF plays at 50 fps when the settings ask for 50 or 60, and at 25 fps otherwise. `animationFps(format, fps)` returns the rate a file plays at.
- Takumi 2.19 marks no GIF frame to be cleared before the next one, so a frame that shrinks left its old edges behind. `clearGifFrames` in `src/gif.ts` sets that mark. Remove it when Takumi sets it.
- Takumi gives each GIF frame its own 256 colors from a sparse sample, so small details change color between frames, and near-black pixels can turn transparent. WebP and APNG keep every pixel.

## How it renders

1. `dist/ssr/entry-server.js` is a Vite SSR build of `apps/codeimage/src/render/entry-server.tsx`. It server-renders the app's own frame and terminal components and P1's `StaticCodeView` with `renderToStringAsync`.
2. The CSS is the build's vanilla-extract output plus the stylesheet a CodeMirror editor with the theme would mount, CodeMirror's base theme included.
3. Takumi measures the frame, the frame is sized to whole CSS pixels as the web export is, and Takumi rasterizes it at `scale`.

Only Inter and JetBrains Mono ship in `dist/fonts`. Other fonts come from a
build-generated catalog of immutable URLs, sizes, cmap-narrowed Unicode ranges
and SHA-256 hashes. Takumi selects the needed subsets. Each request owns its
native renderer and verified buffers, so concurrent or earlier requests cannot
change its font selection. The faces of the UI, signature and code fonts that
cover U+0020 load before selection: a line box takes its height from that face
even when it holds no text, so it never depends on the fallbacks other text
needed.

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
- `pnpm exec tsx scripts/parity/takumi-vs-chrome/index.ts` from the repository root compares every theme and terminal against Chrome.
- `pnpm exec tsx scripts/parity/live-p3/index.ts` from the repository root runs the renderer's live checks.
- `pnpm exec tsx scripts/parity/animation-endpoints/index.ts --encode` from the repository root compares every frame of each animated format with a direct render. It needs `webpmux`, `dwebp`, and `gif2webp` from libwebp.

Font source recipes live in `build-fonts.mjs`. Package versions must match exact
`devDependencies` pins. The generator derives every hash and Unicode range.
`node .agents/skills/verify-codeimage/scripts/cli/font-urls.mjs` checks all remote artifacts.
`node .agents/skills/verify-codeimage/scripts/cli/font-parity.mjs <baseline/dist/index.mjs>`
compares every font family and weight with another build, byte for byte.
