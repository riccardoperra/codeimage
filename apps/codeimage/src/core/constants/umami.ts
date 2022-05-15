import {noop} from 'rxjs';

declare global {
  interface Window {
    umami: Umami;
  }
}

export const enableUmami = () => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const umamiMock = function () {};
  umamiMock.trackEvent = noop;
  umamiMock.trackPageView = noop;
  window.umami = window.umami || umamiMock;
};
