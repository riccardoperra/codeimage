import {
  createSignal,
  JSXElement,
  lazy,
  onMount,
  Show,
  Suspense,
} from 'solid-js';
import {NoHydration} from 'solid-js/web';

type LoadType = 'visible' | 'idle' | 'load';

type ExtractOptionsByLoadType<TLoadType extends LoadType> = {
  visible: IntersectionObserverInit;
  idle: never;
  load: never;
}[TLoadType];

export function hydrateOnViewport<
  T extends () => any,
  TLoadType extends LoadType,
>(
  Comp:
    | T
    | (() => Promise<{
        default: T;
      }>),
  type: TLoadType,
  options?: ExtractOptionsByLoadType<TLoadType>,
): () => JSXElement {
  let el: HTMLDivElement;
  const [load, setLoad] = createSignal(false);

  const LazyComponent = lazy(Comp as () => Promise<{default: T}>);

  function NoHydratedComponent() {
    return (
      <NoHydration>
        <LazyComponent />
      </NoHydration>
    );
  }

  function onIdle() {
    const cb = () => setLoad(true);
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(cb, {timeout: 200});
    } else {
      setTimeout(cb, 200);
    }
  }

  function onVisible(options?: IntersectionObserverInit) {
    const ioOptions: IntersectionObserverInit = {...(options || {})};
    const io = new IntersectionObserver(cb => {
      if (cb[0].isIntersecting) {
        setLoad(true);
        io.disconnect();
      }
    }, ioOptions);
    io.observe(el);
  }

  function onLoad() {
    setLoad(true);
  }

  return () => {
    onMount(() => {
      const strategy = {
        visible: onVisible,
        load: onLoad,
        idle: onIdle,
      };
      strategy[type](options);
    });

    if (!globalThis.window) {
      return (
        <div>
          <NoHydratedComponent />
        </div>
      );
    }

    return (
      <div ref={el}>
        <Suspense>
          <Show when={load()} fallback={<NoHydratedComponent />}>
            <LazyComponent />
          </Show>
        </Suspense>
      </div>
    ) as unknown as T;
  };
}
