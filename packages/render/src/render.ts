import type {
  FrameSize,
  RenderEntry,
} from '../../../apps/codeimage/src/render/contract';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {createFontStore, FontFileError} from './fontCache';
import type {FontCacheOptions} from './fontCache';
import {findFont} from './fontManifest';
import {Renderer} from '@takumi-rs/core';
import {positionWatermark} from './watermarkGeometry';
import type {ImageSource} from '@takumi-rs/core';
import type {
  ProjectSnapshot,
  SnapshotDocument,
  SnapshotInput,
} from './document';
import {parseSnapshotDocument} from './document';

export interface AnnotatedCode {
  code: string;
  marks: NonNullable<ProjectSnapshot['editor']['editors'][number]['marks']>;
  count: number;
  sourceLines: number[];
}

export async function annotateCode(
  code: string,
  languageId: string,
  tabName: string,
): Promise<AnnotatedCode> {
  return (await getRuntime()).entry.annotateCode(code, languageId, tabName);
}

export interface SnapshotFont {
  family: string;
  file: string;
  data: Uint8Array;
  weight?: number;
  unicodeRange?: [number, number][];
}

export interface SnapshotMarkup {
  document: SnapshotDocument;
  html: string;
  css: string[];
  // Browser layout, before Takumi's frame sizing overrides.
  naturalCss: string[];
  size: FrameSize;
  // Verified buffers used by measurement, in catalog order.
  fonts: SnapshotFont[];
  // The fallback chain every measure and render uses.
  fontFamilies: string[];
  images: ImageSource[];
}

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
const getRuntime = () => (runtime ??= loadRuntime());

// Takumi 2.19 parses `to bottom right` but drops the equivalent
// `to right bottom`, which seven built-in theme backgrounds use.
const gradientCorner = /(linear-gradient\(\s*)to (left|right) (top|bottom)\b/g;
const normalizeGradients = (css: string) =>
  css.replace(gradientCorner, '$1to $3 $2');

// Solid escapes `<` in text and `"` in attribute values, so a raw `<` always
// opens a tag and a quoted value never holds a raw quote. Only style values
// change; text and other attributes are the user's.
const htmlTag = /<!--[\s\S]*?-->|<[^>"]*(?:"[^"]*"[^>"]*)*>/g;
const styleAttribute = /"[^"]*"|(\sstyle=")([^"]*")/g;
const normalizeStyleAttributes = (html: string) =>
  html.replace(htmlTag, tag =>
    tag.replace(styleAttribute, (match, name?: string, value?: string) =>
      name && value ? name + normalizeGradients(value) : match,
    ),
  );

export async function supportedThemeIds(): Promise<string[]> {
  return (await getRuntime()).entry.SUPPORTED_THEME_IDS;
}

export async function supportedFontIds(): Promise<string[]> {
  return (await getRuntime()).entry.SUPPORTED_FONT_IDS;
}

export interface RendererOptions extends FontCacheOptions {
  codeFontFile?: string;
}
export function createRenderer(options: RendererOptions = {}) {
  const store = createFontStore(options);
  async function prepare(input: SnapshotInput) {
    const document = parseSnapshotDocument(input);
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
        const format =
          magic === 'wOF2'
            ? 'woff2'
            : magic === 'wOFF'
              ? 'woff'
              : magic === 'OTTO'
                ? 'otf'
                : magic === '\x00\x01\x00\x00' || magic === 'true'
                  ? 'ttf'
                  : undefined;
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
    const frame = await entry.composeFrame(document, {
      offline: options.offline,
      async measure(markup) {
        if (code.family !== markup.fontFamily)
          throw new Error(
            `Font family differs from catalog: ${markup.fontFamily}`,
          );
        const content = await renderer.measure(
          normalizeStyleAttributes(markup.html),
          {
            css: [...markup.css, stylesheet].map(normalizeGradients),
            images: markup.images,
            fontFamilies,
            fonts,
            signal: options.signal,
            devicePixelRatio: scale,
          },
        );
        return {width: content.width / scale, height: content.height / scale};
      },
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
    });
    const css = [...frame.css, stylesheet].map(normalizeGradients);
    const html = await positionWatermark({
      html: normalizeStyleAttributes(frame.html),
      ...frame.watermarkFrame,
      pixelRatio: scale,
      measure: html =>
        renderer.measure(html, {
          css,
          images: frame.images,
          fonts,
          fontFamilies,
          width: frame.size.width * scale,
          height: frame.size.height * scale,
          devicePixelRatio: scale,
          signal: options.signal,
        }),
    });
    const prepared = await renderer.prepare(html, {
      css,
      images: options.offline
        ? {
            sources: frame.images,
            fetch: async () => {
              throw new Error(
                'Remote background is unavailable with --offline',
              );
            },
          }
        : frame.images,
      signal: options.signal,
      fontFamilies,
      fonts,
      width: Math.floor(frame.size.width * scale),
      height: Math.floor(frame.size.height * scale),
      devicePixelRatio: scale,
    });
    const markup: SnapshotMarkup = {
      document,
      html,
      css,
      naturalCss: [...frame.browserCss, stylesheet].map(normalizeGradients),
      size: frame.size,
      fonts: [...(await resources.faces()), ...(local ? [local] : [])],
      fontFamilies,
      images: frame.images,
    };
    return {markup, renderer, prepared};
  }

  return {
    async markup(input: SnapshotInput): Promise<SnapshotMarkup> {
      return (await prepare(input)).markup;
    },
    async render(input: SnapshotInput): Promise<Uint8Array | string> {
      const {markup, renderer, prepared} = await prepare(input);
      if (markup.document.format === 'svg')
        return renderer.renderSvg(prepared, {signal: options.signal});
      const image = await renderer.render(prepared, {
        format: markup.document.format,
        signal: options.signal,
      });
      return new Uint8Array(image.buffer, image.byteOffset, image.byteLength);
    },
  };
}
export function snapshotMarkup(input: SnapshotInput): Promise<SnapshotMarkup> {
  return createRenderer().markup(input);
}
export function renderSnapshot(
  input: SnapshotInput,
): Promise<Uint8Array | string> {
  return createRenderer().render(input);
}
