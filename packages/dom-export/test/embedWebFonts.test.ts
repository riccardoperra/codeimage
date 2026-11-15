import {Window} from 'happy-dom';
import {describe, expect, it, vi} from 'vitest';
import {
  getCSSRules,
  getFontsMap,
  getUsedFontFamiliesByNode,
} from '../src/lib/embedWebFonts';

describe('embedWebFonts', () => {
  it('should get fonts map', async () => {
    const documentEl = await buildDocument(
      `
        @font-face {
          font-family: 'Font1';
          src: url('data:application/x-font-woff2;base64,AAA') format('woff2'), local(Arial);
          font-weight: 400;
          font-style: normal;
        }
        @font-face {
          font-family: 'Font2';
          src: url('data:application/x-font-woff2;base64,BBB') format('woff2'), local(Arial);
          font-weight: 400;
          font-style: normal;
        }
    `,
    );
    const stylesheets = documentEl.styleSheets as unknown as CSSStyleSheet[];
    const cssRules = await getCSSRules(stylesheets, {});
    const result = getFontsMap(cssRules);
    expect(result.font1).toBeDefined();
    expect(result.font2).toBeDefined();
    expect(result.font1).toHaveProperty('400-normal');
    expect(result.font2).toHaveProperty('400-normal');
  });

  it('keeps variable faces and defaults an omitted font style to normal', async () => {
    const documentEl = await buildDocument(`
      @font-face { font-family: 'Signature'; src: url('signature.woff2'); font-weight: 100 900; }
      @font-face { font-family: 'Other'; src: url('other.woff2'); font-weight: 400; }
    `);
    const cssRules = await getCSSRules(
      documentEl.styleSheets as unknown as CSSStyleSheet[],
      {},
    );
    // happy-dom drops variable ranges, which Chrome exposes on the descriptor.
    const face = cssRules.find(rule => rule.style.fontFamily === 'Signature');
    if (!face) throw new Error('Missing signature face');
    vi.spyOn(face.style, 'fontWeight', 'get').mockReturnValue('100 900');
    const node = documentEl.querySelector(
      '.container',
    ) as unknown as HTMLElement;
    node.style.fontFamily = 'Signature';
    node.style.fontWeight = '650';
    node.style.fontStyle = 'normal';
    const result = getUsedFontFamiliesByNode(
      getFontsMap(cssRules),
      node,
      cssRules,
      [],
    );
    expect(result).toHaveLength(1);
    expect(result[0].cssText).toContain('signature.woff2');
  });
  describe('getUsedFontFamiliesByNode', async () => {
    const documentEl = await buildDocument(
      `
        @font-face {
          font-family: 'Font1';
          src: url('data:application/x-font-woff2;base64,AAA') format('woff2'), local(Arial);
          font-weight: 400;
          font-style: normal;
        }
        @font-face {
          font-family: 'Font2';
          src: url('data:application/x-font-woff2;base64,BBB') format('woff2'), local(Arial);
          font-weight: 400;
          font-style: normal;
        }
    `,
    );
    const stylesheets = documentEl.styleSheets as unknown as CSSStyleSheet[];
    const cssRules = await getCSSRules(stylesheets, {});
    const fontMap = getFontsMap(cssRules);
    const node = documentEl.querySelector(
      '.container',
    ) as unknown as HTMLElement;

    it('should no return fonts', function () {
      const result = getUsedFontFamiliesByNode(fontMap, node, cssRules, []);
      expect(result.length).toBe(0);
    });

    it('should return used fonts', function () {
      const container = documentEl.querySelector('.container');

      const el1 = container.querySelector(
        '.element-1',
      ) as unknown as HTMLElement;

      el1.style.fontFamily = 'Font2';
      el1.style.fontWeight = '400';
      el1.style.fontStyle = 'normal';

      const result = getUsedFontFamiliesByNode(fontMap, node, cssRules, []);
      expect(result.length).toBe(1);
    });
  });
});

async function buildDocument(customStyles?: string) {
  const window = new Window();
  const document = window.document;
  const data = await import('./embedWebFontsTestPage.html?raw')
    .then(data => data.default)
    .then(data =>
      data.replace('%%CUSTOM_STYLES%%', `<style>${customStyles ?? ''}</style>`),
    );
  document.write(data);
  return document;
}
