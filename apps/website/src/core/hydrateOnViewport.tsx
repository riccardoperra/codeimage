import {createSignal, lazy, onMount, Show, Suspense} from 'solid-js';
import {isServer} from 'solid-js/web';
import {Hydration, NoHydration} from 'solid-js/web';
import {unstable_island} from 'solid-start';

export function hydrateOnViewport<T extends () => any>(
  Comp:
    | T
    | (() => Promise<{
        default: T;
      }>),
): any {
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

  if (isServer) {
    return () => (
      <div>
        <NoHydratedComponent />
      </div>
    );
  }

  return () => {
    onMount(() => {
      const io = new IntersectionObserver(cb => {
        if (cb[0].isIntersecting) {
          setLoad(true);
          io.disconnect();
        }
      });
      io.observe(el);
    });

    return (
      <div ref={el}>
        {isServer || !load() ? <NoHydratedComponent /> : <LazyComponent />}
      </div>
    ) as unknown as T;
  };
}
