// @vitest-environment happy-dom
import {expect, it, vi} from 'vitest';
import {ExportExtension, exportImage, ExportMode} from './use-export-image';

const rasterize = vi.hoisted(() => vi.fn(async () => new Blob(['png'])));
vi.mock('@core/rasterize', () => ({createRasterizer: () => rasterize}));
vi.mock('@core/hooks/use-webshare', () => ({
  useWebshare: () => [() => false, () => false, vi.fn()],
}));

it('uses the requested pixel ratio override for an exact-size export', async () => {
  const ref = document.createElement('div');
  const node = document.createElement('div');
  ref.append(node);
  const result = await exportImage({
    ref,
    renderer: 'takumi',
    rasterizeOptions: {pixelRatio: 1},
    options: {
      mode: ExportMode.getBlob,
      extension: ExportExtension.png,
      pixelRatio: 3,
      quality: 1,
    },
  });
  expect(result).toBeInstanceOf(Blob);
  expect(rasterize).toHaveBeenCalledWith(node, {
    format: 'png',
    pixelRatio: 1,
    quality: 1,
  });
});
