import {afterEach, expect, it, vi} from 'vitest';
import {useLocalFonts} from './use-local-fonts';

vi.mock('@core/modules/localFontAccessApi/fontMetrics', () => ({
  FontMetrics: class {
    for() {
      return {charWidth: () => ({width: 10})};
    }
    destroy() {}
  },
}));

afterEach(() => {
  delete window.queryLocalFonts;
});

it('retains each native FontData face alongside its family and weight labels', async () => {
  const faces = ['Regular', 'Bold', 'Italic'].map(style => ({
    family: 'Local Mono',
    style,
    fullName: `Local Mono ${style}`,
    postscriptName: `LocalMono-${style}`,
    blob: vi.fn(async () => new Blob()),
  }));
  window.queryLocalFonts = vi.fn(async () => faces);
  const fonts = await useLocalFonts();
  expect(window.queryLocalFonts).toHaveBeenCalledOnce();
  expect(fonts).toHaveLength(1);
  expect(fonts[0].sources).toEqual(faces);
  expect(fonts[0].sources[0]).toBe(faces[0]);
  expect(fonts[0].faces).toEqual(['400', '700']);
  expect(faces.every(face => face.blob.mock.calls.length === 0)).toBe(true);
});
