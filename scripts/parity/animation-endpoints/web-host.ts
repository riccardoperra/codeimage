import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {openFontCache} from '../../../packages/render/dist/index.mjs';
import {PNG} from 'pngjs';
import type {
  AnimationHost,
  AnimationScenes,
  ComposedFrame,
  FrameMarkup,
} from '../../../apps/codeimage/src/render/contract';
import {positionWatermark} from '../../../packages/render/src/watermarkGeometry';
import {watermarkScenes} from '../../../packages/render/src/animationWatermark';
import {type Entry, type Document} from './types';
import {inCssPixels} from './layout-checks';
const dist = new URL('../../../packages/render/dist/', import.meta.url);
const require = createRequire(
  new URL('../../../packages/render/package.json', import.meta.url),
);
const {Renderer} = require('@takumi-rs/core');
export async function createWebHost() {
  const entry = (await import(
    new URL('ssr/entry-server.js', dist).href
  )) as Entry;
  const stylesheet = await readFile(
    new URL('ssr/assets/style.css', dist),
    'utf8',
  );

  const fontCache = openFontCache();
  const fontFamilies = fontCache.fallbackFamilies;
  let renderer = new Renderer();
  let fonts: unknown[] = [];
  async function useDocument(document: Document) {
    const {fontId} = document.editor.options;
    const code = fontCache.catalog.fonts.find(
      font => font.id.toLowerCase() === fontId.toLowerCase(),
    );
    if (!code) throw new Error(`Unknown font "${fontId}"`);
    const resources = fontCache.resources(code);
    renderer = new Renderer();
    for (const primary of resources.primaries) {
      await renderer.registerFont(primary);
    }
    fonts = resources.loaders;
  }

  const gradientCorner =
    /(linear-gradient\(\s*)to (left|right) (top|bottom)\b/g;
  const normalizeGradients = (css: string) =>
    css.replace(gradientCorner, '$1to $3 $2');
  const htmlTag = /<!--[\s\S]*?-->|<[^>"]*(?:"[^"]*"[^>"]*)*>/g;
  const styleAttribute = /"[^"]*"|(\sstyle=")([^"]*")/g;
  const normalizeStyleAttributes = (html: string) =>
    html.replace(htmlTag, tag =>
      tag.replace(styleAttribute, (match, name?: string, value?: string) =>
        name && value ? name + normalizeGradients(value) : match,
      ),
    );

  const pageCss = (css: string[]) =>
    [...css, stylesheet].map(normalizeGradients);

  const decode = (bytes: Uint8Array) => PNG.sync.read(Buffer.from(bytes));

  const host = (scale: number): AnimationHost => {
    const layout = async (markup: FrameMarkup) =>
      inCssPixels(
        await renderer.measure(normalizeStyleAttributes(markup.html), {
          css: pageCss(markup.css),
          images: markup.images,
          fontFamilies,
          fonts,
          devicePixelRatio: scale,
        }),
        scale,
      );
    return {
      async measure(markup) {
        const {width, height} = await layout(markup);
        return {width, height};
      },
      layout,
      pixels: (markup, size) =>
        renderer.render(markup.html, {
          css: markup.css,
          images: markup.images,
          width: size,
          height: size,
          format: 'raw',
          devicePixelRatio: 1,
        }),
    };
  };

  const placeWatermark = (frame: ComposedFrame, scale: number) =>
    positionWatermark({
      html: normalizeStyleAttributes(frame.html),
      ...frame.watermarkFrame,
      pixelRatio: scale,
      measure: html =>
        renderer.measure(html, {
          css: pageCss(frame.css),
          images: frame.images,
          fontFamilies,
          fonts,
          width: frame.size.width * scale,
          height: frame.size.height * scale,
          devicePixelRatio: scale,
        }),
    });

  async function staticExport(document: Document, editorId: string) {
    const {scale} = document;
    const frame = await entry.composeFrame(document, host(scale), editorId);
    const html = await placeWatermark(frame, scale);
    return decode(
      await renderer.render(html, {
        width: Math.floor(frame.size.width * scale),
        height: Math.floor(frame.size.height * scale),
        css: pageCss(frame.css),
        images: frame.images,
        fontFamilies,
        fonts,
        format: 'png',
        devicePixelRatio: scale,
      }),
    );
  }

  const withWatermarks = async (
    animation: AnimationScenes,
    scale: number,
  ): Promise<AnimationScenes> => ({
    ...animation,
    scenes: await watermarkScenes(animation, step =>
      placeWatermark(step, scale),
    ),
  });

  return {
    entry,
    useDocument,
    host,
    staticExport,
    withWatermarks,
    normalizeStyleAttributes,
    pageCss,
    fontFamilies,
    get renderer() {
      return renderer;
    },
    get fonts() {
      return fonts;
    },
    decode,
  };
}

export type WebHost = Awaited<ReturnType<typeof createWebHost>>;
