// @vitest-environment happy-dom
import {afterEach, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  fallback: vi.fn(async () => new Blob(['fallback'], {type: 'image/png'})),
  takumi: vi.fn(async () => new Blob(['takumi'], {type: 'image/png'})),
  track: vi.fn(),
}));
vi.mock('./domExport', () => ({domExport: () => mocks.fallback}));
vi.mock('./takumi', () => ({takumi: mocks.takumi}));
vi.mock('../constants/umami', () => ({getUmami: () => ({track: mocks.track})}));

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

it('uses dom-export by default without invoking Takumi', async () => {
  const {createRasterizer} = await import('./index');
  await createRasterizer('dom-export', 'blob')(document.createElement('div'), {
    format: 'png',
    pixelRatio: 2,
    quality: 1,
  });
  expect(mocks.fallback).toHaveBeenCalledOnce();
  expect(mocks.takumi).not.toHaveBeenCalled();
});

it('falls back for this export and retries Takumi on the next export', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  mocks.takumi.mockRejectedValueOnce(new Error('WASM blocked'));
  const {createRasterizer} = await import('./index');
  const rasterize = createRasterizer('takumi', 'blob');
  const node = document.createElement('div');
  const options = {format: 'png', pixelRatio: 2, quality: 1} as const;
  const first = await rasterize(node, options);
  expect(first instanceof Blob && (await first.text())).toBe('fallback');
  const second = await rasterize(node, options);
  expect(second instanceof Blob && (await second.text())).toBe('takumi');
  expect(mocks.fallback).toHaveBeenCalledOnce();
  expect(mocks.track).toHaveBeenCalledWith('export-renderer-fallback', {
    renderer: 'takumi',
    format: 'png',
    error: 'Error',
  });
});
