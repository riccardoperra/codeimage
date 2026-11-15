export const isApple = /Mac|iPhone|iPad/.test(
  globalThis.navigator?.platform ?? '',
);
