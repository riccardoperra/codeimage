import {existsSync} from 'node:fs';
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

interface FrameMarkup {
  html: string;
  css: string;
  fontFamily: string;
  backgroundImage: string | null;
}

interface FrameSize {
  width?: number;
  height?: number;
}

interface RenderEntry {
  SUPPORTED_FONT_IDS: string[];
  SUPPORTED_THEME_IDS: string[];
  renderFrame(snapshot: ProjectSnapshot): Promise<FrameMarkup>;
  frameSizeCss(size: FrameSize): string;
}

interface FontFile {
  file: string;
  weight?: number;
  unicodeRange?: [number, number][];
}

export interface SnapshotFont {
  family: string;
  path: string;
  weight?: number;
  unicodeRange?: [number, number][];
}

export interface SnapshotMarkup {
  document: SnapshotDocument;
  html: string;
  css: string[];
  fonts: SnapshotFont[];
  images: ImageSource[];
}

const UI_FONT = {id: 'ui', family: 'Inter var'} as const;

// Browsers draw emoji and CJK text with system fonts, so the renderer falls
// back to the host's fonts for them instead of bundling large font sets.
const SYSTEM_FALLBACKS = [
  {
    needs: /\p{Extended_Pictographic}/u,
    paths: [
      '/System/Library/Fonts/Apple Color Emoji.ttc',
      '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf',
      '/usr/share/fonts/noto/NotoColorEmoji.ttf',
      '/usr/share/fonts/google-noto-emoji/NotoColorEmoji.ttf',
      'C:\\Windows\\Fonts\\seguiemj.ttf',
    ],
  },
  {
    needs: /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u,
    paths: [
      '/System/Library/Fonts/Hiragino Sans GB.ttc',
      '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
      '/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc',
      '/usr/share/fonts/google-noto-cjk/NotoSansCJK-Regular.ttc',
      'C:\\Windows\\Fonts\\msyh.ttc',
    ],
  },
];

const dist = new URL('../dist/', import.meta.url);

async function loadRuntime() {
  const [entry, stylesheet, manifest] = await Promise.all([
    import(new URL('ssr/entry-server.js', dist).href) as Promise<RenderEntry>,
    readFile(new URL('ssr/assets/style.css', dist), 'utf8'),
    readFile(new URL('fonts/manifest.json', dist), 'utf8').then(
      text => JSON.parse(text) as Record<string, FontFile[]>,
    ),
  ]);
  const renderer = new Renderer();
  const registered = new Map<string, Promise<unknown>>();
  const fontsFor = (fontId: string, family: string): SnapshotFont[] => {
    const files = manifest[fontId];
    if (!files) throw new Error(`No font files for font "${fontId}"`);
    return files.map(({file, ...face}) => ({
      family,
      path: fileURLToPath(new URL(`fonts/${file}`, dist)),
      ...face,
    }));
  };
  const registerFonts = (fonts: SnapshotFont[]) =>
    Promise.all(
      fonts.map(font => {
        const key = `${font.family}\u0000${font.path}`;
        let pending = registered.get(key);
        if (!pending) {
          pending = readFile(font.path).then(data =>
            renderer.registerFont({
              name: font.family,
              data,
              weight: font.weight,
              unicodeRange: font.unicodeRange,
            }),
          );
          registered.set(key, pending);
        }
        return pending;
      }),
    );
  const registerFallbacks = (text: string) =>
    Promise.all(
      SYSTEM_FALLBACKS.filter(({needs}) => needs.test(text)).map(({paths}) => {
        const path = paths.find(path => existsSync(path));
        if (!path) return;
        let pending = registered.get(path);
        if (!pending) {
          pending = readFile(path).then(data => renderer.registerFont({data}));
          registered.set(path, pending);
        }
        return pending;
      }),
    );
  return {
    entry,
    stylesheet,
    renderer,
    fontsFor,
    registerFonts,
    registerFallbacks,
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

async function fetchImage(url: string): Promise<ImageSource> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Background image ${url} answered ${response.status}`);
  }
  return {src: url, data: await response.arrayBuffer()};
}

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
    fontsFor,
    registerFonts,
    registerFallbacks,
  } = await getRuntime();
  const frame = await entry.renderFrame(document);
  const html = normalizeStyleAttributes(frame.html);
  const css = [stylesheet, frame.css].map(normalizeGradients);
  const fonts = [
    ...fontsFor(UI_FONT.id, UI_FONT.family),
    ...fontsFor(document.editor.options.fontId, frame.fontFamily),
  ];
  await registerFonts(fonts);
  await registerFallbacks(
    document.editor.editors
      .map(editor => `${editor.tabName}\n${editor.code}`)
      .join('\n'),
  );
  // The web export sizes the frame to the editor's integer client size.
  const measured = await renderer.measure(html, {
    css: [...css, entry.frameSizeCss({width: document.width})],
  });
  const size = {
    width: document.width ?? Math.ceil(measured.width),
    height: Math.ceil(measured.height),
  };
  return {
    document,
    html,
    css: [...css, entry.frameSizeCss(size)],
    fonts,
    images: frame.backgroundImage
      ? [await fetchImage(frame.backgroundImage)]
      : [],
  };
}

export async function renderSnapshot(
  input: SnapshotInput,
): Promise<Uint8Array | string> {
  const {document, html, css, images} = await snapshotMarkup(input);
  const {renderer} = await getRuntime();
  if (document.format === 'svg') {
    return renderer.renderSvg(html, {css, images});
  }
  const image = await renderer.render(html, {
    css,
    images,
    format: document.format,
    devicePixelRatio: document.scale,
  });
  return new Uint8Array(image.buffer, image.byteOffset, image.byteLength);
}
