import type {
  AnimationHost,
  ComposedFrame,
  LayoutNode,
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
import {watermarkScenes} from './animationWatermark';
import {clearGifFrames} from './gif';
import type {ImageSource, MeasuredNode} from '@takumi-rs/core';
import type {
  AnimationDocument,
  AnimationInput,
  ProjectSnapshot,
  SnapshotDocument,
  SnapshotInput,
} from './document';
import {parseAnimationDocument, parseSnapshotDocument} from './document';
import type {FrameSize} from '../../../apps/codeimage/src/render/contract';

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

export interface AnimationFrame {
  width: number;
  height: number;
  // Treat as read-only: adjacent hold frames may share these bytes.
  rgba: Uint8Array;
}

export interface RawAnimation {
  width: number;
  height: number;
  fps: number;
  durationMs: number;
  // A single-use stream; frames are rendered only as the consumer requests them.
  frames: AsyncIterable<AnimationFrame>;
}
// The frame rate a file of `format` plays at when the settings ask for `fps`.
// A GIF frame lasts whole hundredths of a second, and Takumi rejects one
// shorter than two of them. As the web export does (gifFps in
// apps/codeimage/src/core/gif/encode.ts), a GIF plays at 50 or 25 fps.
export function animationFps(
  format: AnimationDocument['format'],
  fps: number,
): number {
  return format === 'gif' ? (fps >= 50 ? 50 : 25) : fps;
}

const inCssPixels = (node: MeasuredNode, scale: number): LayoutNode => ({
  width: node.width / scale,
  height: node.height / scale,
  children: node.children.map(child => inCssPixels(child, scale)),
  runs: node.runs.map(run => ({text: run.text, width: run.width / scale})),
});

export function createRenderer(options: RendererOptions = {}) {
  const store = createFontStore(options);
  // A renderer with the faces of the document's code font, and the host the
  // SSR entry lays out and samples pages through.
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
    // Moves the watermark off code the way the web export does.
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

  async function prepare(input: SnapshotInput) {
    const document = parseSnapshotDocument(input);
    const opened = await open(document);
    const {entry, renderer, fonts, fontFamilies, scale, pageCss} = opened;
    const frame = await entry.composeFrame(document, opened.host);
    const css = pageCss(frame.css);
    const html = await opened.placeWatermark(frame);
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
      naturalCss: pageCss(frame.browserCss),
      size: frame.size,
      fonts: [
        ...(await opened.resources.faces()),
        ...(opened.local ? [opened.local] : []),
      ],
      fontFamilies,
      images: frame.images,
    };
    return {markup, renderer, prepared};
  }

  // Each step holds the static export of its tab, then morphs into the next
  // one. WebP is lossless: Takumi writes lossy animated WebP without an alpha
  // channel, which fills the frame's rounded corners and paints the margin
  // of a smaller step black.
  async function animate(input: AnimationInput): Promise<Uint8Array> {
    const document = parseAnimationDocument(input);
    const opened = await open(document);
    const {entry, renderer, fonts, fontFamilies, scale, pageCss} = opened;
    const fps = animationFps(document.format, document.animation.fps);
    const animation = await entry.renderAnimationScenes(
      document,
      {...document.animation, fps},
      opened.host,
    );
    const scenes = await watermarkScenes(animation, opened.placeWatermark);
    const image = await renderer.renderAnimation({
      scenes: scenes.map(({html, durationMs}) => ({
        node: normalizeStyleAttributes(html),
        durationMs,
      })),
      width: Math.floor(animation.width * scale),
      height: Math.floor(animation.height * scale),
      css: pageCss(animation.css),
      images: animation.images,
      fontFamilies,
      fonts,
      fps,
      format: document.format,
      devicePixelRatio: scale,
      signal: options.signal,
    });
    const bytes = new Uint8Array(
      image.buffer,
      image.byteOffset,
      image.byteLength,
    );
    if (document.format === 'gif') clearGifFrames(bytes);
    return bytes;
  }

  return {
    async animationFrames(input: AnimationInput): Promise<RawAnimation> {
      const document = parseAnimationDocument(input);
      const opened = await open(document);
      const {entry, renderer, fonts, fontFamilies, scale, pageCss} = opened;
      const fps = document.animation.fps;
      const animation = await entry.renderAnimationScenes(
        document,
        {...document.animation, fps},
        opened.host,
      );
      const scenes = await watermarkScenes(animation, opened.placeWatermark);
      const width = Math.floor(animation.width * scale);
      const height = Math.floor(animation.height * scale);
      const durationMs = scenes.reduce(
        (sum, scene) => sum + scene.durationMs,
        0,
      );
      return {
        width,
        height,
        fps,
        durationMs,
        frames: (async function* () {
          let index = 0;
          let startMs = 0;
          for (const scene of scenes) {
            const html = normalizeStyleAttributes(scene.html);
            const endMs = startMs + scene.durationMs;
            let held: Uint8Array | undefined;
            while ((index * 1000) / fps < endMs) {
              options.signal?.throwIfAborted();
              const rgba =
                held ??
                (await renderer.render(html, {
                  css: pageCss(animation.css),
                  images: animation.images,
                  fontFamilies,
                  fonts,
                  width,
                  height,
                  format: 'raw',
                  devicePixelRatio: scale,
                  timeMs: Math.floor((index * 1000) / fps) - startMs,
                  signal: options.signal,
                }));
              if (scene.kind === 'hold') held = rgba;
              yield {width, height, rgba};
              index++;
            }
            startMs = endMs;
          }
        })(),
      };
    },
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
    renderAnimation: animate,
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
export function renderAnimation(input: AnimationInput): Promise<Uint8Array> {
  return createRenderer().renderAnimation(input);
}
