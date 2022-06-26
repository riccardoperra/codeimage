import {
  isAndroid,
  isChrome,
  isFirefox,
  isIOS,
} from '@solid-primitives/platform';

const platform = () => {
  if (isFirefox) {
    return 'firefox';
  }
  if (isChrome) {
    return 'chrome';
  }
  if (isIOS) {
    return 'ios';
  }
  if (isAndroid) {
    return 'android';
  }
};

export const createPlatformProps = () => {
  return {
    'data-platform': platform(),
  };
};
