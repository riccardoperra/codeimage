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
  options: HydrateOnVisibleProps & {el: Element; intersectionElement?: Element},
) {
  const ioOptions = {...(options || {})};
  const io = new IntersectionObserver(entries => {
    const [el, maybeIntersectionOElement] = entries;
    if (el.isIntersecting || maybeIntersectionOElement?.isIntersecting) {
      onIdle(() => onHydrate(), {timeout: 0});
      io.disconnect();
    }
  }, ioOptions.init);

  // This is always needed if the user refresh 😁
  io.observe(ioOptions.el);

  if (ioOptions.intersectionElement) {
    io.observe(ioOptions.intersectionElement);
  }
}
