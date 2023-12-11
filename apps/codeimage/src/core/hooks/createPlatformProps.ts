import {
  isAndroid,
  isChrome,
  isFirefox,
  isIOS,
  isSafari,
  isChromium,
  isOpera,
  isEdge,
} from '@solid-primitives/platform';

export const browser = () => {
  if (isFirefox) {
    return 'firefox' as const;
  }
  if (isChrome) {
    return 'chrome' as const;
  }
  if (isEdge) {
    return 'edge' as const;
  }
  if (isSafari) {
    return 'safari' as const;
  }
  if (isOpera) {
    return 'opera' as const;
  }
};
const platform = () => {
  if (isFirefox) {
    return 'firefox';
  }
  if (isChrome || isChromium) {
    return 'chrome';
  }
  if (isSafari) {
    return 'safari';
  }
  if (isIOS) {
    return 'ios';
  }
  if (isAndroid) {
    return 'android';
  }
  if (isOpera) {
    return 'opera';
  }
};

export const createPlatformProps = () => {
  return {
    'data-platform': platform(),
  };
};
