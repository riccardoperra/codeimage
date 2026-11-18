const browser = typeof window === 'undefined' ? undefined : window.navigator;
const userAgent = browser?.userAgent ?? '';

export const isIOS =
  /iphone|ipod/i.test(userAgent) ||
  (/ipad/i.test(userAgent) && (browser?.maxTouchPoints ?? 0) > 1);
export const isSafari =
  !!browser?.vendor.includes('Apple') &&
  !!userAgent &&
  !/CriOS|FxiOS/.test(userAgent);
export const isBlink = /Chrome\/[0-9.]+/.test(userAgent);
export const isFirefox = /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(userAgent);
