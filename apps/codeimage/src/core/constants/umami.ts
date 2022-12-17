declare global {
  interface Window {
    umami: Umami;
  }
}

const isDev = import.meta.env.DEV;

function getUmamiMock() {
  const umamiMock: Umami = () => void 0;

  if (isDev) {
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
  } else {
    umamiMock.trackEvent = () => void 0;
    umamiMock.trackView = () => void 0;
  }

  return umamiMock;
}

export function getUmami() {
  return window?.umami ?? getUmamiMock();
}
