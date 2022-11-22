import {children, createSignal, lazy, onMount, Show, Suspense} from 'solid-js';
import {getHydrationKey, NoHydration} from 'solid-js/web';

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

  return () => {
    const hk = getHydrationKey();
    onMount(() => {
      const io = new IntersectionObserver(cb => {
        if (cb[0].isIntersecting) {
          setLoad(true);
          io.disconnect();
        }
      });
      io.observe(el);
    });

    if (!globalThis.window) {
      return (
        <div data-hk={hk}>
          <NoHydratedComponent />
        </div>
      );
    }

    return (
      <div data-hk={hk} ref={el}>
        <Suspense>
          <Show when={load()} fallback={<NoHydratedComponent />}>
            <LazyComponent />
          </Show>
        </Suspense>
      </div>
    ) as unknown as T;
  };
}
