import type {AnimationInput, SnapshotInput} from './document';
import {parseSnapshotDocument} from './document';

import type {
  AnnotatedCode,
  RendererOptions,
  SnapshotMarkup,
} from './renderTypes';
export type {
  AnnotatedCode,
  SnapshotFont,
  SnapshotMarkup,
  RendererOptions,
  AnimationFrame,
  RawAnimation,
} from './renderTypes';
import {getRuntime, createRendererRuntime} from './renderRuntime';
import {createAnimationRenderer} from './renderAnimation';
export {animationFps} from './renderAnimation';
export async function annotateCode(
  code: string,
  languageId: string,
  tabName: string,
): Promise<AnnotatedCode> {
  return (await getRuntime()).entry.annotateCode(code, languageId, tabName);
}

export async function supportedThemeIds(): Promise<string[]> {
  return (await getRuntime()).entry.SUPPORTED_THEME_IDS;
}

export async function supportedFontIds(): Promise<string[]> {
  return (await getRuntime()).entry.SUPPORTED_FONT_IDS;
}

export function createRenderer(options: RendererOptions = {}) {
  const open = createRendererRuntime(options);
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
    ...createAnimationRenderer(open, options),
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
