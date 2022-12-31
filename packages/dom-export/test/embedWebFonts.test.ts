import {Window} from 'happy-dom';
import {describe, expect, it} from 'vitest';
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
      const result = getUsedFontFamiliesByNode(fontMap, node, cssRules);
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

      const result = getUsedFontFamiliesByNode(fontMap, node, cssRules);
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
