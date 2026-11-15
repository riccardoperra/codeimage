import type {
  FrameSize,
  RenderEntry,
} from '../../../apps/codeimage/src/render/contract';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Renderer} from '@takumi-rs/core';
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

interface FontFile {
  file: string;
  weight?: number;
  unicodeRange?: [number, number][];
}

interface FontManifest {
  // The files of each app font and of the UI font.
  fonts: Record<string, FontFile[]>;
  // Families for glyphs the app fonts lack, in the order Takumi tries them.
  fallbacks: {family: string; files: FontFile[]}[];
}

export interface SnapshotFont extends Omit<FontFile, 'file'> {
  family: string;
  path: string;
}

export interface SnapshotMarkup {
  document: SnapshotDocument;
  html: string;
  css: string[];
  // Browser layout, before Takumi's frame sizing overrides.
  naturalCss: string[];
  size: FrameSize;
  // The UI and code fonts the markup names. Fallbacks are not listed.
  fonts: SnapshotFont[];
  // The fallback chain every measure and render uses.
  fontFamilies: string[];
  images: ImageSource[];
}

const UI_FONT = {id: 'ui', family: 'Inter var'} as const;

const dist = new URL('../dist/', import.meta.url);

async function loadRuntime() {
  const [entry, stylesheet, manifest] = await Promise.all([
    import(new URL('ssr/entry-server.js', dist).href) as Promise<RenderEntry>,
    readFile(new URL('ssr/assets/style.css', dist), 'utf8'),
    readFile(new URL('fonts/manifest.json', dist), 'utf8').then(
      text => JSON.parse(text) as FontManifest,
    ),
  ]);
  const renderer = new Renderer();
  const faces = (family: string, files: FontFile[]): SnapshotFont[] =>
    files.map(({file, ...face}) => ({
      family,
      path: fileURLToPath(new URL(`fonts/${file}`, dist)),
      ...face,
    }));
  const fontsFor = (fontId: string, family: string) => {
    const files = manifest.fonts[fontId];
    if (!files) throw new Error(`No font files for font "${fontId}"`);
    return faces(family, files);
  };
  const register = async (fonts: SnapshotFont[]) => {
    const files = await Promise.all(fonts.map(font => readFile(font.path)));
    for (const [index, font] of fonts.entries()) {
      await renderer.registerFont({
        name: font.family,
        data: files[index],
        weight: font.weight,
        unicodeRange: font.unicodeRange,
      });
    }
  };
  // The fallbacks and the UI font register once, in a fixed order, before the
  // first render. Each render names the same fallback chain, so the image never
  // depends on which app fonts earlier renders registered.
  for (const {family, files} of manifest.fallbacks) {
    await register(faces(family, files));
  }
  const uiFonts = fontsFor(UI_FONT.id, UI_FONT.family);
  await register(uiFonts);
  const appFonts = new Map<string, Promise<void>>();
  const registerAppFont = (fontId: string, family: string) => {
    let pending = appFonts.get(fontId);
    if (!pending) {
      pending = register(fontsFor(fontId, family));
      appFonts.set(fontId, pending);
    }
    return pending;
  };
  return {
    entry,
    stylesheet,
    renderer,
    uiFonts,
    fontsFor,
    registerAppFont,
    fontFamilies: manifest.fallbacks.map(({family}) => family),
  };
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

export async function snapshotMarkup(
  input: SnapshotInput,
): Promise<SnapshotMarkup> {
  const document = parseSnapshotDocument(input);
  const {
    entry,
    stylesheet,
    renderer,
    uiFonts,
    fontsFor,
    registerAppFont,
    fontFamilies,
  } = await getRuntime();
  const {fontId} = document.editor.options;
  const scale = document.format === 'svg' ? 1 : document.scale;
  const frame = await entry.composeFrame(document, {
    async measure(markup) {
      await registerAppFont(fontId, markup.fontFamily);
      const content = await renderer.measure(
        normalizeStyleAttributes(markup.html),
        {
          css: [...markup.css, stylesheet].map(normalizeGradients),
          images: markup.images,
          fontFamilies,
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
      });
    },
  });
  return {
    document,
    html: normalizeStyleAttributes(frame.html),
    css: [...frame.css, stylesheet].map(normalizeGradients),
    naturalCss: [...frame.browserCss, stylesheet].map(normalizeGradients),
    size: frame.size,
    fonts: [...uiFonts, ...fontsFor(fontId, frame.fontFamily)],
    fontFamilies,
    images: frame.images,
  };
}

export async function renderSnapshot(
  input: SnapshotInput,
): Promise<Uint8Array | string> {
  const {document, html, css, images, fontFamilies, size} =
    await snapshotMarkup(input);
  const {renderer} = await getRuntime();
  if (document.format === 'svg') {
    return renderer.renderSvg(html, {css, images, fontFamilies, ...size});
  }
  const image = await renderer.render(html, {
    width: Math.floor(size.width * document.scale),
    height: Math.floor(size.height * document.scale),
    css,
    images,
    fontFamilies,
    format: document.format,
    devicePixelRatio: document.scale,
  });
  return new Uint8Array(image.buffer, image.byteOffset, image.byteLength);
}
