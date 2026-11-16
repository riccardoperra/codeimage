/**
 * Remembers measurements of the preview by key, so an edit only measures the
 * steps it changed. A failed measurement is forgotten, and the oldest entries
 * leave first once the cache is full.
 */
export function createMeasureCache(limit = 64) {
  const entries = new Map<string, Promise<unknown>>();
  return {
    get<T>(key: string | undefined, make: () => Promise<T>): Promise<T> {
      if (key === undefined) return make();
      const hit = entries.get(key);
      if (hit) {
        entries.delete(key);
        entries.set(key, hit);
        return hit as Promise<T>;
      }
      const value = make();
      entries.set(key, value);
      value.catch(() => {
        if (entries.get(key) === value) entries.delete(key);
      });
      while (entries.size > limit) entries.delete(entries.keys().next().value!);
      return value;
    },
    get size() {
      return entries.size;
    },
  };
}
