export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  if (!obj) return {} as Omit<T, K>;
  return Object.keys(obj).reduce((acc, k) => {
    if (!keys.includes(k as K)) {
      return Object.assign(acc, {[k]: obj[k]});
    }
    return acc;
  }, {} as Omit<T, K>);
}

export function mapValues<T, R>(
  obj: T,
  cb: (item: T[keyof T]) => R,
): Record<keyof T, R> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    return Object.assign(acc, {
      [key]: cb(value),
    });
  }, {} as Record<keyof T, R>);
}
