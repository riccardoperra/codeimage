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

Fonts come from `dist/fonts`: the app's own font files and the fontsource packages for the families the app loads from Google Fonts. Emoji and CJK text fall back to the host's system fonts, as in a browser.

## Develop

`pnpm --filter=@codeimage/render build` runs the app's `vite build --mode render`, copies the fonts, and bundles the package. Build the other libraries first; `pnpm libs:build` does both in order. Tests read the built `dist`.

- `pnpm --filter=@codeimage/render test` runs the schema and render tests.
- `pnpm exec tsx scripts/perf.ts` from this package times a 300-line render.
- `pnpm exec tsx scripts/parity/takumi-vs-chrome.ts` from the repository root compares every theme and terminal against Chrome.
- `pnpm exec tsx scripts/parity/live-p3.ts` from the repository root runs the renderer's live checks.
