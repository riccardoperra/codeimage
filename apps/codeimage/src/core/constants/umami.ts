declare global {
  interface Window {
    umami: Umami;
  }
}

export const enableUmami = () => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const umamiMock: Umami = function () {};
  umamiMock.trackEvent = (event_value, event_type, url, website_id) => {
    console.groupCollapsed(`[DEV] Umami track event`);
    console.table([{event_value, event_type, website_id, url}]);
    console.groupEnd();
  };
  umamiMock.trackView = (url, referrer, website_id) => {
    console.groupCollapsed(`[DEV] Umami track view`);
    console.table([{url, referrer, website_id}]);
    console.groupEnd();
  };

  window.umami = window.umami || umamiMock;
};
