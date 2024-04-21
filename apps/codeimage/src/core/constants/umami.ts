declare global {
  interface Window {
    umami: Umami;
  }
}

const isDev = import.meta.env.DEV;

function getUmamiMock() {
  const umamiMock: Umami = {} as Umami;

  if (isDev) {
    umamiMock.track = ((
      event_name: string,
      event_data?: {[key: string]: string | number},
    ) => {
      console.groupCollapsed(`[DEV] Umami track event`);
      console.log({
        event_name,
        event_data,
      });
      console.groupEnd();
    }) as typeof umamiMock.track;
  } else {
    umamiMock.track = () => void 0;
  }

  return umamiMock;
}

export function getUmami() {
  return window?.umami ?? getUmamiMock();
}
