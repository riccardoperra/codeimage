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

`renderAnimation` plays the `animation` the project stores: each step holds its tab for `holdMs`, then morphs into the next step for `transitionMs`. A project without `animation` plays every tab in order with 800 ms holds, 900 ms transitions, the `smooth` easing, and 30 fps. `format` is `webp` (default), `gif`, or `apng`, and `scale` and `width` work as for a still image. `animationDocumentSchema` is the zod schema. It rounds durations to whole milliseconds and rejects an animation that lasts 0 ms or names a tab the project lacks.

The image is as large as the largest step. The first and last frame of a transition match the still export of the step it leaves and the step it reaches.

- WebP is lossless. Takumi writes lossy animated WebP without an alpha channel, so the clear pixels around the frame would turn opaque: its rounded corners fill in, and the margin around a smaller step turns black.
- A GIF frame lasts whole hundredths of a second, so GIF plays at 50, 25, or 20 fps. `animationFps(format, fps)` returns the rate a file plays at.
- Takumi 2.19 marks no GIF frame to be cleared before the next one, so a frame that shrinks left its old edges behind. `clearGifFrames` in `src/gif.ts` sets that mark. Remove it when Takumi sets it.
- Takumi gives each GIF frame its own 256 colors from a sparse sample, so small details change color between frames, and near-black pixels can turn transparent. WebP and APNG keep every pixel.

## How it renders

1. `dist/ssr/entry-server.js` is a Vite SSR build of `apps/codeimage/src/render/entry-server.tsx`. It server-renders the app's own frame and terminal components and P1's `StaticCodeView` with `renderToStringAsync`.
2. The CSS is the build's vanilla-extract output plus the stylesheet a CodeMirror editor with the theme would mount, CodeMirror's base theme included.
3. Takumi measures the frame, the frame is sized to whole CSS pixels as the web export is, and Takumi rasterizes it at `scale`.

Fonts come from `dist/fonts`: the app's own font files and the fontsource packages for the families the app loads from Google Fonts. The renderer never reads host fonts. Glyphs the snapshot's fonts lack fall back to bundled fonts, tried in this order:

| Family                        | Covers                         | License                                                      | Size                  |
| ----------------------------- | ------------------------------ | ------------------------------------------------------------ | --------------------- |
| Twemoji (`twemoji-colr-font`) | Emoji and flags                | Font OFL 1.1, art CC-BY 4.0 by Twitter, Inc and contributors | 0.5 MB                |
| Noto Sans SC Variable         | Chinese, kana, Latin, Cyrillic | OFL 1.1                                                      | 4.5 MB in 101 subsets |
| Noto Sans KR Variable         | Hangul                         | OFL 1.1                                                      | 3.5 MB in 124 subsets |

They and the UI font register once when the renderer starts, and every render uses the same fallback chain, so an image never depends on what rendered before it. Japanese text draws with Noto Sans SC glyph shapes, and rare kanji outside its subsets are missing. License texts are in `dist/fonts/licenses`.

## Develop

`pnpm --filter=@codeimage/render build` runs the app's `vite build --mode render`, copies the fonts, and bundles the package. Build the other libraries first; `pnpm libs:build` does both in order. Tests read the built `dist`.

- `pnpm --filter=@codeimage/render test` runs the schema and render tests.
- `pnpm exec tsx scripts/perf.ts` from this package times a 300-line render.
- `pnpm exec tsx scripts/parity/takumi-vs-chrome.ts` from the repository root compares every theme and terminal against Chrome.
- `pnpm exec tsx scripts/parity/live-p3.ts` from the repository root runs the renderer's live checks.
- `pnpm exec tsx scripts/parity/animation-endpoints.ts --encode` from the repository root compares every frame of each animated format with a direct render. It needs `webpmux`, `dwebp`, and `gif2webp` from libwebp.
