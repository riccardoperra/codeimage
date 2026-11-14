// @vitest-environment happy-dom
import {afterEach, expect, it, vi} from 'vitest';
import {domExport} from './domExport';

const methods = vi.hoisted(() => ({
  toBlob: vi.fn(async () => new Blob(['png'], {type: 'image/png'})),
  toSvg: vi.fn(
    async () =>
      'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3Ctext%3E%CE%BB%3C%2Ftext%3E%3C%2Fsvg%3E',
  ),
  toJpeg: vi.fn(),
  toPng: vi.fn(),
}));
vi.mock('@codeimage/dom-export', () => methods);
afterEach(() => vi.clearAllMocks());

it('returns an SVG blob for SVG share and getBlob exports', async () => {
  const blob = await domExport('blob')(document.createElement('div'), {
    format: 'svg',
    pixelRatio: 2,
    quality: 1,
  });
  expect(blob).toBeInstanceOf(Blob);
  if (!(blob instanceof Blob)) throw new Error('Expected an SVG blob.');
  expect(blob.type).toBe('image/svg+xml');
  expect(await blob.text()).toBe('<svg><text>λ</text></svg>');
  expect(methods.toBlob).not.toHaveBeenCalled();
});
