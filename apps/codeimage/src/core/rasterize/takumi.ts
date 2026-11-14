import type {Renderer} from '@takumi-rs/wasm';
import interUrl from 'inter-ui/variable/InterVariable.woff2?url';
import {SUPPORTED_FONTS} from '../configuration/font';
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
    pending = source
      .data()
      .then(data => renderer.registerFont({...source, data}))
      .then(() => undefined)
      .catch(error => {
        fonts.delete(source.key);
        console.warn(
          `[CodeImage] Export font unavailable: ${source.name}`,
          error,
        );
      });
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

async function collectCss(usedFamilies: Set<string>) {
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
        if (
          !usedFamilies.has(normalizeFamily(name)) ||
          name.startsWith('Inter')
        )
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
  return {css, sources};
}

function cloneExportNode(node: HTMLElement) {
  const clone = node.cloneNode(true);
  if (!(clone instanceof HTMLElement)) throw new Error('Invalid export node.');
  // Keep a fractional intrinsic width from wrapping text in an integer viewport.
  clone.style.width = `${node.getBoundingClientRect().width}px`;
  const originals = [node, ...node.querySelectorAll('*')];
  const copies = [clone, ...clone.querySelectorAll('*')];
  const usedFamilies = new Set<string>(['inter', 'inter var']);
  originals.forEach((original, index) => {
    const copy = copies[index];
    if (original.closest('[data-export-exclude="true"]')) {
      copy.remove();
      return;
    }
    const computed = getComputedStyle(original);
    if (
      copy instanceof HTMLElement &&
      computed.backgroundImage.includes('linear-gradient(to ')
    ) {
      const {width, height} = original.getBoundingClientRect();
      // Takumi 2.19 accepts angles but drops gradients with corner keywords.
      copy.style.backgroundImage = computed.backgroundImage.replace(
        /linear-gradient\(to ((?:(?:top|bottom|left|right)\s*){1,2}),/g,
        (_match, direction: string) => {
          const x = direction.includes('right')
            ? 1
            : direction.includes('left')
              ? -1
              : 0;
          const y = direction.includes('bottom')
            ? 1
            : direction.includes('top')
              ? -1
              : 0;
          const angle =
            (Math.atan2(x * (y ? height : 1), -y * (x ? width : 1)) * 180) /
            Math.PI;
          return `linear-gradient(${(angle + 360) % 360}deg,`;
        },
      );
    }
    if (copy instanceof HTMLElement && computed.lineHeight.endsWith('px')) {
      // Chrome lays out line boxes in 1/64px units. Preserve that rounding so
      // fractional line heights do not accumulate drift in long snippets.
      copy.style.lineHeight = `${Math.floor(parseFloat(computed.lineHeight) * 64) / 64}px`;
    }
    computed.fontFamily
      .split(',')
      .forEach(name => usedFamilies.add(normalizeFamily(name)));
  });
  const html = document.documentElement.cloneNode(false);
  const body = document.body.cloneNode(false);
  if (!(html instanceof HTMLElement) || !(body instanceof HTMLElement))
    throw new Error('Invalid document.');
  body.append(clone);
  html.append(body);
  return {html: html.outerHTML, usedFamilies};
}

async function localFontSources(usedFamilies: Set<string>) {
  const webFamilies = new Set(
    SUPPORTED_FONTS.map(font => normalizeFamily(font.name)),
  );
  const localFamilies = [...usedFamilies].filter(
    name =>
      !webFamilies.has(name) &&
      ![
        'inter',
        'inter var',
        'system-ui',
        '-apple-system',
        'sans-serif',
        'monospace',
        'serif',
      ].includes(name),
  );
  if (!localFamilies.length || !window.queryLocalFonts) return [];
  try {
    const localFonts = await window.queryLocalFonts();
    return localFonts
      .filter(font => localFamilies.includes(normalizeFamily(font.family)))
      .map(
        (font): FontSource => ({
          name: font.family,
          key: font.postscriptName,
          weight: Number(determineFontFaceName(font.style)),
          style: /italic|oblique/i.test(font.style) ? 'italic' : 'normal',
          data: async () =>
            new Uint8Array(await (await font.blob()).arrayBuffer()),
        }),
      );
  } catch (error) {
    console.warn('[CodeImage] Local export font unavailable.', error);
    return [];
  }
}

export const takumi: Rasterizer = async (
  node,
  {format, pixelRatio, quality},
) => {
  const {width, height} = node.getBoundingClientRect();
  const {html, usedFamilies} = cloneExportNode(node);
  const [renderer, {css, sources}, localFonts] = await Promise.all([
    getRenderer(),
    collectCss(usedFamilies),
    localFontSources(usedFamilies),
  ]);
  await Promise.all(
    [
      ...sources,
      ...localFonts,
      ...['Inter', 'Inter var'].map(
        (name): FontSource => ({
          name,
          key: name,
          weight: 400,
          style: 'normal',
          data: () => readBytes(interUrl),
        }),
      ),
    ].map(source => registerFont(renderer, source)),
  );
  const options = {
    width: Math.round(width) * pixelRatio,
    height: Math.round(height) * pixelRatio,
    css,
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
