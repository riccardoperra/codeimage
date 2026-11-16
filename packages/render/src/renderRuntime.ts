import type {
  AnimationHost,
  ComposedFrame,
  LayoutNode,
  RenderEntry,
} from '../../../apps/codeimage/src/render/contract';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {createFontStore} from './fontCache';
import {FontFileError} from './fontCacheTypes';

import {findFont} from './fontManifest';
import {Renderer} from '@takumi-rs/core';
import {positionWatermark} from './watermarkGeometry';

import type {MeasuredNode} from '@takumi-rs/core';
import type {
  AnimationDocument,
  ProjectSnapshot,
  SnapshotDocument,
} from './document';

import type {AnnotatedCode, SnapshotFont, RendererOptions} from './renderTypes';
const dist = new URL('../dist/', import.meta.url);
async function loadRuntime() {
  const [entry, stylesheet] = await Promise.all([
    import(new URL('ssr/entry-server.js', dist).href) as Promise<
      RenderEntry<ProjectSnapshot, AnnotatedCode>
    >,
    readFile(new URL('ssr/assets/style.css', dist), 'utf8'),
  ]);
  return {entry, stylesheet};
}

let runtime: ReturnType<typeof loadRuntime> | undefined;
export const getRuntime = () => (runtime ??= loadRuntime());

const gradientCorner = /(linear-gradient\(\s*)to (left|right) (top|bottom)\b/g;
export const normalizeGradients = (css: string) =>
  css.replace(gradientCorner, '$1to $3 $2');

const htmlTag = /<!--[\s\S]*?-->|<[^>"]*(?:"[^"]*"[^>"]*)*>/g;
const styleAttribute = /"[^"]*"|(\sstyle=")([^"]*")/g;
export const normalizeStyleAttributes = (html: string) =>
  html.replace(htmlTag, tag =>
    tag.replace(styleAttribute, (match, name?: string, value?: string) =>
      name && value ? name + normalizeGradients(value) : match,
    ),
  );

const inCssPixels = (node: MeasuredNode, scale: number): LayoutNode => ({
  width: node.width / scale,
  height: node.height / scale,
  children: node.children.map(child => inCssPixels(child, scale)),
  runs: node.runs.map(run => ({text: run.text, width: run.width / scale})),
});

export function createRendererRuntime(options: RendererOptions) {
  const store = createFontStore(options);
  async function open(document: SnapshotDocument | AnimationDocument) {
    const {entry, stylesheet} = await getRuntime();
    const renderer = new Renderer();
    const code = findFont(store.catalog, document.editor.options.fontId);
    const resources = store.resources(options.codeFontFile ? undefined : code);
    const fonts = resources.loaders;
    const fontFamilies = store.fallbackFamilies;
    for (const primary of resources.primaries)
      await renderer.registerFont(primary);
    let local: SnapshotFont | undefined;
    if (options.codeFontFile) {
      const path = resolve(options.codeFontFile);
      try {
        const data = await readFile(path);
        const magic = data.subarray(0, 4).toString('latin1');
        const format = fontFormat(magic);
        if (!format)
          throw new Error(
            'Expected a single TTF, OTF, WOFF or WOFF2 font; collections are unsupported',
          );
        const registered = await renderer.registerFont({
          name: code.family,
          data,
        });
        if (!registered.length) throw new Error('No usable font faces');
        local = {
          family: code.family,
          file: `${createHash('sha256').update(data).digest('hex')}.${format}`,
          data,
        };
      } catch (cause) {
        throw new FontFileError(
          `Cannot load --font-file ${path}: ${cause instanceof Error ? cause.message : String(cause)}`,
          {cause},
        );
      }
    }
    const scale = document.format === 'svg' ? 1 : document.scale;
    const pageCss = (css: string[]) =>
      [...css, stylesheet].map(normalizeGradients);
    const layout: AnimationHost['layout'] = async markup => {
      if (code.family !== markup.fontFamily)
        throw new Error(
          `Font family differs from catalog: ${markup.fontFamily}`,
        );
      const content = await renderer.measure(
        normalizeStyleAttributes(markup.html),
        {
          css: pageCss(markup.css),
          images: markup.images,
          fontFamilies,
          fonts,
          signal: options.signal,
          devicePixelRatio: scale,
        },
      );
      return inCssPixels(content, scale);
    };
    const host: AnimationHost = {
      offline: options.offline,
      async measure(markup) {
        const {width, height} = await layout(markup);
        return {width, height};
      },
      layout,
      async pixels(markup, size) {
        return renderer.render(markup.html, {
          css: markup.css,
          images: markup.images,
          width: size,
          height: size,
          format: 'raw',
          devicePixelRatio: 1,
          signal: options.signal,
        });
      },
    };

    const placeWatermark = (frame: ComposedFrame) =>
      positionWatermark({
        html: normalizeStyleAttributes(frame.html),
        ...frame.watermarkFrame,
        pixelRatio: scale,
        measure: html =>
          renderer.measure(html, {
            css: pageCss(frame.css),
            images: frame.images,
            fonts,
            fontFamilies,
            width: frame.size.width * scale,
            height: frame.size.height * scale,
            devicePixelRatio: scale,
            signal: options.signal,
          }),
      });
    return {
      entry,
      renderer,
      resources,
      fonts,
      fontFamilies,
      local,
      scale,
      pageCss,
      host,
      placeWatermark,
    };
  }

  return open;
}
export type OpenRenderer = ReturnType<typeof createRendererRuntime>;

function fontFormat(magic: string) {
  switch (magic) {
    case 'wOF2':
      return 'woff2';
    case 'wOFF':
      return 'woff';
    case 'OTTO':
      return 'otf';
    case '\x00\x01\x00\x00':
    case 'true':
      return 'ttf';
  }
}
