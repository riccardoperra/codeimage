import {afterEach, describe, expect, it, vi} from 'vitest';
import {nodeToDataURL} from '../src/lib/util';

const platform = vi.hoisted(() => ({isBlink: true, isFirefox: false}));
vi.mock('../src/lib/platform', () => platform);

describe('SVG layout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    platform.isBlink = true;
    platform.isFirefox = false;
  });

  it('keeps native SVG coordinates in WebKit', async () => {
    platform.isBlink = false;
    vi.stubGlobal('devicePixelRatio', 2);
    const node = document.createElement('div');
    node.style.zoom = '1.25';

    const dataUrl = await nodeToDataURL(node, 300, 100);
    const svg = new DOMParser().parseFromString(
      decodeURIComponent(dataUrl.split(',')[1]),
      'image/svg+xml',
    );

    expect(svg.documentElement.getAttribute('viewBox')).toBe('0 0 300 100');
    expect(svg.querySelector('div')?.style.zoom).toBe('1.25');
  });

  it('lays out Firefox content at the display pixel ratio', async () => {
    platform.isBlink = false;
    platform.isFirefox = true;
    vi.stubGlobal('devicePixelRatio', 2);
    const node = document.createElement('div');
    node.style.zoom = '1.25';

    const dataUrl = await nodeToDataURL(node, 300, 100);
    const svg = new DOMParser().parseFromString(
      decodeURIComponent(dataUrl.split(',')[1]),
      'image/svg+xml',
    );

    expect(svg.documentElement.getAttribute('width')).toBe('300');
    expect(svg.documentElement.getAttribute('viewBox')).toBe('0 0 600 200');
    expect(svg.querySelector('div')?.style.zoom).toBe('2.5');
  });

  it.each([1, 2, 3])(
    'preserves the output size and typography at DPR %s',
    async pixelRatio => {
      vi.stubGlobal('devicePixelRatio', pixelRatio);
      const node = document.createElement('div');
      node.style.fontSize = '14.5px';
      node.style.zoom = '1.25';
      node.textContent = 'Text at the edge of its line';

      const dataUrl = await nodeToDataURL(node, 300, 100);
      const svg = new DOMParser().parseFromString(
        decodeURIComponent(dataUrl.split(',')[1]),
        'image/svg+xml',
      );
      const root = svg.documentElement;
      const content = svg.querySelector('div');

      expect(root.getAttribute('width')).toBe('300');
      expect(root.getAttribute('height')).toBe('100');
      expect(root.getAttribute('viewBox')).toBe(
        `0 0 ${300 * pixelRatio} ${100 * pixelRatio}`,
      );
      expect(content?.style.fontSize).toBe('14.5px');
      expect(content?.style.zoom).toBe(`${1.25 * pixelRatio}`);
      expect(content?.textContent).toBe('Text at the edge of its line');
    },
  );
});
