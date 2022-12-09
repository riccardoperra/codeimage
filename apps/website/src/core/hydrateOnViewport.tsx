import {
  createComponent,
  createEffect,
  createSignal,
  createUniqueId,
  getOwner,
  JSXElement,
  lazy,
  onMount,
  runWithOwner,
} from 'solid-js';
import {hydrate, Hydration, NoHydration} from 'solid-js/web';

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
  const [load, setLoad] = createSignal(!!import.meta.env.SSR);

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
    const id = createUniqueId();
    const owner = getOwner();

    onMount(() => {
      el = document.querySelector(`[data-c="${id}"]`);
      const strategy = {
        visible: onVisible,
        load: onLoad,
        idle: onIdle,
      };
      strategy[type](options);
    });

    if (import.meta.env.SSR) {
      return (
        <Hydration>
          <div data-c={id} ref={el}>
            <NoHydratedComponent />
          </div>
        </Hydration>
      );
    } else {
      createEffect(() => {
        if (load()) {
          const marker = document.querySelector(
            `[data-c="${id}"]`,
          ) as HTMLElement;
          LazyComponent.preload().then(m => {
            const component = runWithOwner(owner, () =>
              createComponent(m.default, {}),
            );
            hydrate(() => component, marker, {
              renderId: marker.dataset.hk,
              owner,
            });
          });
        }
      });

      return <NoHydratedComponent />;
      // {/*<Show when={load()} fallback={<NoHydratedComponent />}>*/}
      // {/*  <LazyComponent />*/}
      // {/*</Show>*/}
    }
  };
}
