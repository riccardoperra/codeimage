// @vitest-environment happy-dom
import {afterEach, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  fallback: vi.fn(async () => new Blob(['fallback'], {type: 'image/png'})),
  takumi: vi.fn(async () => new Blob(['takumi'], {type: 'image/png'})),
  track: vi.fn(),
  notify: vi.fn(),
}));
vi.mock('./notify-font-fallback', () => ({notifyFontFallback: mocks.notify}));
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
    codeFont: {id: 'test', name: 'Test Mono', type: 'web', types: []},
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
  const options = {
    format: 'png',
    pixelRatio: 2,
    quality: 1,
    codeFont: {id: 'test', name: 'Test Mono', type: 'web', types: []},
  } as const;
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

it('names the unavailable code font and its failure reason in the fallback notification', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const {ExportFontError} = await import('./font-error');
  mocks.takumi.mockRejectedValueOnce(
    new ExportFontError('Menlo', 'read', new Error('Blob unavailable')),
  );
  const {createRasterizer} = await import('./index');
  await createRasterizer('takumi', 'blob')(document.createElement('div'), {
    format: 'png',
    pixelRatio: 2,
    quality: 1,
    codeFont: {id: 'Menlo', name: 'Menlo', type: 'web', types: []},
  });
  expect(mocks.notify).toHaveBeenCalledWith(
    expect.objectContaining({family: 'Menlo', reason: 'read'}),
  );
  expect(mocks.fallback).toHaveBeenCalledOnce();
});

it('hides the Animate edit aids while either renderer reads the frame', async () => {
  const {animateAidsHidden} = await import('../animation/aids');
  const seen: boolean[] = [];
  const record = async () => {
    seen.push(animateAidsHidden());
    return new Blob(['image'], {type: 'image/png'});
  };
  mocks.fallback.mockImplementationOnce(record);
  mocks.takumi.mockImplementationOnce(record);
  const {createRasterizer} = await import('./index');
  const options = {
    format: 'png',
    pixelRatio: 2,
    quality: 1,
    codeFont: {id: 'test', name: 'Test Mono', type: 'web', types: []},
  } as const;
  const node = document.createElement('div');
  await createRasterizer('dom-export', 'blob')(node, options);
  await createRasterizer('takumi', 'blob')(node, options);
  expect(seen).toEqual([true, true]);
  expect(animateAidsHidden()).toBe(false);
});
