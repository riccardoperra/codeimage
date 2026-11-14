import type {Renderer} from '@takumi-rs/wasm';
import interUrl from 'inter-ui/variable/InterVariable.woff2?url';
import type {CustomFontConfiguration} from '../configuration/font';
import {ExportFontError} from './font-error';
import {determineFontFaceName} from '../modules/localFontAccessApi/font';
import type {Rasterizer} from './index';

interface FontSource {
  name: string;
  key: string;
  weight: number;
  style: 'normal' | 'italic';
  unicodeRange?: [number, number][];
  data: () => Promise<Uint8Array>;
}

let session: Promise<Renderer> | undefined;
const fonts = new Map<string, Promise<void>>();
let registered = Promise.resolve();
const externalCss = new Map<string, Promise<string>>();

async function getRenderer() {
  session ??= Promise.all([
    import('@takumi-rs/wasm'),
    import('@takumi-rs/wasm/wasm-url'),
  ])
    .then(async ([{default: init, Renderer}, {default: wasmUrl}]) => {
      await init({module_or_path: wasmUrl});
      return new Renderer();
    })
    .catch(error => {
      session = undefined;
      throw error;
    });
  return session;
}

async function readBytes(url: string) {
  const response = await fetch(url);
  if (
    !response.ok ||
    response.headers.get('content-type')?.includes('text/html')
  ) {
    throw new Error(`Cannot load export font: ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function registerFont(renderer: Renderer, source: FontSource) {
  let pending = fonts.get(source.key);
  if (!pending) {
    const data = source.data().catch(error => {
      throw new ExportFontError(source.name, 'read', error);
    });
    data.catch(() => undefined);
    // Takumi falls back through fonts in registration order, so register in
    // call order rather than in the order the downloads finish.
    pending = registered
      .then(async () => {
        const bytes = await data;
        const collection =
          bytes[0] === 0x74 &&
          bytes[1] === 0x74 &&
          bytes[2] === 0x63 &&
          bytes[3] === 0x66;
        try {
          // Collections carry their own face weights and styles. Overriding
          // those values would turn every face into the same variant.
          await renderer.registerFont(
            collection
              ? {name: source.name, data: bytes}
              : {...source, data: bytes},
          );
        } catch (error) {
          throw new ExportFontError(
            source.name,
            collection
              ? 'collection'
              : error instanceof Error &&
                  error.message === 'Unsupported font format'
                ? 'format'
                : 'registration',
            error,
          );
        }
      })
      .catch(error => {
        fonts.delete(source.key);
        throw error;
      });
    registered = pending.catch(() => undefined);
    fonts.set(source.key, pending);
  }
  await pending;
}

function normalizeFamily(name: string) {
  return name
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .toLowerCase();
}

function absoluteUrls(css: string, base: string) {
  return css.replace(
    /url\(\s*(?:"([^"]+)"|'([^']+)'|([^)]*?))\s*\)/g,
    (_match, double: string, single: string, bare: string) =>
      `url("${new URL(double ?? single ?? bare, base).href}")`,
  );
}

async function readStylesheet(sheet: CSSStyleSheet) {
  try {
    return [...sheet.cssRules].map(rule => rule.cssText).join('\n');
  } catch (error) {
    if (!sheet.href) throw error;
    let pending = externalCss.get(sheet.href);
    if (!pending) {
      pending = fetch(sheet.href).then(response => {
        if (!response.ok) throw new Error('Cannot load export stylesheet.');
        return response.text();
      });
      externalCss.set(sheet.href, pending);
    }
    return pending;
  }
}

async function collectCss(codeFamily: string, text: string) {
  const sources: FontSource[] = [];
  const css = await Promise.all(
    [...document.styleSheets].map(async sheet => {
      const text = absoluteUrls(
        await readStylesheet(sheet),
        sheet.href ?? document.baseURI,
      );
      const parsed = new CSSStyleSheet();
      parsed.replaceSync(text);
      const rules: string[] = [];
      for (const rule of parsed.cssRules) {
        if (!(rule instanceof CSSFontFaceRule)) {
          rules.push(rule.cssText);
          continue;
        }
        const name = rule.style
          .getPropertyValue('font-family')
          .replace(/['"]/g, '')
          .trim();
        if (normalizeFamily(name) !== codeFamily || name.startsWith('Inter'))
          continue;
        const url = /url\("([^"]+)"\)/.exec(
          rule.style.getPropertyValue('src'),
        )?.[1];
        if (!url) continue;
        const weight =
          parseInt(rule.style.getPropertyValue('font-weight')) || 400;
        const style =
          rule.style.getPropertyValue('font-style') === 'italic'
            ? 'italic'
            : 'normal';
        const unicodeRange = rule.style.getPropertyValue('unicode-range');
        sources.push({
          name,
          key: `${name}:${weight}:${style}:${url}`,
          weight,
          style,
          unicodeRange: unicodeRange
            ? unicodeRange
                .split(',')
                .filter(Boolean)
                .map((range): [number, number] => {
                  const [start, end = start] = range
                    .trim()
                    .replace(/^U\+/i, '')
                    .split('-');
                  return [
                    parseInt(start.replaceAll('?', '0'), 16),
                    parseInt(end.replaceAll('?', 'F'), 16),
                  ];
                })
            : undefined,
          data: () => readBytes(url),
        });
      }
      return rules.join('\n');
    }),
  );
  return {
    css,
    sources: sources.filter(
      source =>
        !source.unicodeRange ||
        [...text].some(char => {
          const point = char.codePointAt(0)!;
          return source.unicodeRange?.some(
            ([start, end]) => point >= start && point <= end,
          );
        }),
    ),
  };
}

// A CSSOM write reserializes the whole style attribute, which rounds lengths
// to six significant digits and writes corner gradients as `to right bottom`.
function appendStyle(element: Element, declaration: string) {
  element.setAttribute(
    'style',
    `${element.getAttribute('style') ?? ''}; ${declaration}`,
  );
}

function cloneExportNode(node: HTMLElement) {
  const clone = node.cloneNode(true);
  if (!(clone instanceof HTMLElement)) throw new Error('Invalid export node.');
  // Chrome sized the frame with its own text metrics, and Takumi ignores
  // `min-width: max-content`. Let the frame fit Takumi's widest line.
  appendStyle(
    clone,
    `width: max-content; min-width: ${node.getBoundingClientRect().width}px`,
  );
  const originals = [node, ...node.querySelectorAll('*')];
  const copies = [clone, ...clone.querySelectorAll('*')];
  originals.forEach((original, index) => {
    const copy = copies[index];
    if (original.closest('[data-export-exclude="true"]')) {
      copy.remove();
      return;
    }
    const computed = getComputedStyle(original);
    if (/to (left|right) (top|bottom)/.test(computed.backgroundImage)) {
      // Takumi 2.19 drops `to right bottom` but draws `to bottom right`.
      appendStyle(
        copy,
        `background-image: ${computed.backgroundImage.replace(
          /to (left|right) (top|bottom)/g,
          'to $2 $1',
        )}`,
      );
    }
    if (original.matches('.cm-gutterElement')) {
      const line = original.closest('.cm-editor')?.querySelector('.cm-line');
      // CodeMirror measured this height at the display DPR. Let Takumi resolve
      // the code line height at the export DPR, preserving the zero-height spacer.
      if (line && original.getBoundingClientRect().height > 0) {
        appendStyle(copy, `height: ${getComputedStyle(line).lineHeight}`);
      }
    }
  });
  const html = document.documentElement.cloneNode(false);
  const body = document.body.cloneNode(false);
  if (!(html instanceof HTMLElement) || !(body instanceof HTMLElement))
    throw new Error('Invalid document.');
  body.append(clone);
  html.append(body);
  return {html: html.outerHTML, text: clone.textContent ?? ''};
}

function localFontSources(font: CustomFontConfiguration): FontSource[] {
  if (font.type !== 'system') return [];
  return (font.fontData.sources ?? []).map(source => ({
    name: font.name,
    key: source.postscriptName,
    weight: Number(determineFontFaceName(source.style)),
    style: /italic|oblique/i.test(source.style) ? 'italic' : 'normal',
    data: async () => new Uint8Array(await (await source.blob()).arrayBuffer()),
  }));
}

export const takumi: Rasterizer = async (
  node,
  {format, pixelRatio, quality, codeFont},
) => {
  const {width, height} = node.getBoundingClientRect();
  const {html, text} = cloneExportNode(node);
  const codeFamily = normalizeFamily(codeFont.name);
  const [renderer, {css, sources}] = await Promise.all([
    getRenderer(),
    collectCss(codeFamily, text),
  ]);
  const fontSources = [
    ...(codeFont.type === 'web' ? sources : localFontSources(codeFont)),
    ...['Inter', 'Inter var'].map(
      (name): FontSource => ({
        name,
        key: name,
        weight: 400,
        style: 'normal',
        data: () => readBytes(interUrl),
      }),
    ),
  ];
  if (
    !fontSources.some(source => normalizeFamily(source.name) === codeFamily)
  ) {
    throw new ExportFontError(codeFont.name, 'unavailable');
  }
  await Promise.all(
    fontSources.map(async source => {
      try {
        await registerFont(renderer, source);
      } catch (error) {
        if (normalizeFamily(source.name) === codeFamily) throw error;
        console.warn('[CodeImage] Optional export font unavailable.', error);
      }
    }),
  );
  const options = {
    width: Math.round(width) * pixelRatio,
    height: Math.round(height) * pixelRatio,
    css,
    fontFamilies: [codeFont.name, 'Inter', 'Inter var'],
  };
  if (format === 'svg') {
    const prepared = await renderer.prepare(html, {
      ...options,
      width: Math.round(width),
      height: Math.round(height),
    });
    const svg = await renderer.renderSvg(prepared);
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    document.documentElement.setAttribute('width', String(options.width));
    document.documentElement.setAttribute('height', String(options.height));
    return new Blob([new XMLSerializer().serializeToString(document)], {
      type: 'image/svg+xml',
    });
  }
  const prepared = await renderer.prepare(html, {
    ...options,
    devicePixelRatio: pixelRatio,
  });
  const bytes = await renderer.render(prepared, {
    format,
    quality: Math.round(quality * 100),
  });
  return new Blob([new Uint8Array(bytes)], {type: `image/${format}`});
};
