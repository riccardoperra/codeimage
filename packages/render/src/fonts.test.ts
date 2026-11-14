import type {PNG} from 'pngjs';
import {describe, expect, it, vi} from 'vitest';
import {countPixels, decode, plainDocument} from './test-utils';

// Each call loads the renderer in a new module graph, as a new process would.
const freshRenderer = async () => {
  vi.resetModules();
  return import('./render');
};

const saturated = (image: PNG) =>
  countPixels(image, (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) > 150);

describe('fallback fonts', {timeout: 60_000}, () => {
  it('draw a flag in the first render of a process', async () => {
    const {renderSnapshot} = await freshRenderer();
    const draw = async (code: string) =>
      decode(await renderSnapshot(plainDocument(code)));
    expect(saturated(await draw('"xx"'))).toBe(0);
    expect(saturated(await draw('"🇮🇹"'))).toBeGreaterThan(20);
  });

  it('give the same image whatever rendered before', async () => {
    const flag = plainDocument('const it = "🇮🇹";');
    const first = await (await freshRenderer()).renderSnapshot(flag);
    const warmed = await freshRenderer();
    for (const code of ['"🎉"', '"你好"', '"안녕"']) {
      await warmed.renderSnapshot(plainDocument(code));
    }
    await warmed.renderSnapshot(
      plainDocument('"Привет → ✓"', {fontId: 'fira-code'}),
    );
    expect(await warmed.renderSnapshot(flag)).toEqual(first);
  });
});
