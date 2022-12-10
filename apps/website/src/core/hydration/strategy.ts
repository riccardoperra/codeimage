export type HydrateOnIdleProps = {
  timeout?: number;
};

export function onIdle(onHydrate: () => void, options: HydrateOnIdleProps) {
  const {timeout = 200} = options;
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(onHydrate, {timeout});
  } else {
    setTimeout(onHydrate, timeout);
  }
}

export function onLoad(onHydrate: () => void) {
  onHydrate();
}

export type HydrateOnVisibleProps = {
  init?: IntersectionObserverInit;
};

export function onVisible(
  onHydrate: () => void,
  options: HydrateOnVisibleProps & {el: Element},
) {
  const ioOptions = {...(options || {})};
  const io = new IntersectionObserver(cb => {
    if (cb[0].isIntersecting) {
      onHydrate();
      io.disconnect();
    }
  }, ioOptions.init);
  io.observe(ioOptions.el);
}
