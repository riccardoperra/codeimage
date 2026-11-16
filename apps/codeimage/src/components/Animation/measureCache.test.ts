import {describe, expect, it, vi} from 'vitest';
import {createMeasureCache} from './measureCache';

describe('createMeasureCache', () => {
  it('measures a key once', async () => {
    const cache = createMeasureCache();
    const make = vi.fn(async () => 1);
    await cache.get('a', make);
    await cache.get('a', make);
    expect(make).toHaveBeenCalledTimes(1);
  });

  it('never caches without a key', async () => {
    const cache = createMeasureCache();
    const make = vi.fn(async () => 1);
    await cache.get(undefined, make);
    await cache.get(undefined, make);
    expect(make).toHaveBeenCalledTimes(2);
    expect(cache.size).toBe(0);
  });

  it('forgets a failed measurement', async () => {
    const cache = createMeasureCache();
    await expect(
      cache.get('a', () => Promise.reject(new Error('no font'))),
    ).rejects.toThrow('no font');
    expect(await cache.get('a', async () => 2)).toBe(2);
  });

  it('drops the least recently used key past the limit', async () => {
    const cache = createMeasureCache(2);
    const make = vi.fn(async () => 1);
    await cache.get('a', make);
    await cache.get('b', make);
    await cache.get('a', make);
    await cache.get('c', make);
    await cache.get('a', make);
    expect(make).toHaveBeenCalledTimes(3);
    await cache.get('b', make);
    expect(make).toHaveBeenCalledTimes(4);
  });
});
