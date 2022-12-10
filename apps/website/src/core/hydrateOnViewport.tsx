import {
  createComponent,
  createUniqueId,
  getOwner,
  JSXElement,
  lazy,
  onMount,
  Owner,
  runWithOwner,
} from 'solid-js';
import {hydrate, Hydration, NoHydration} from 'solid-js/web';

type LoadType = 'visible' | 'idle' | 'load';

type ExtractOptionsByLoadType<TLoadType extends LoadType> = {
  visible: IntersectionObserverInit;
  idle: never;
  load: never;
}[TLoadType];

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'codeimage-hydratable': {
        children: JSX.Element;
      };
    }
  }
}

export function hydrateOnViewport<
  T extends () => JSXElement,
  TLoadType extends LoadType,
>(
  Comp: () => Promise<{default: T}>,
  type: TLoadType,
  options?: ExtractOptionsByLoadType<TLoadType>,
): () => JSXElement {
  const LazyComponent = lazy(Comp);
  let el: Element;
  let id: string;
  let owner: Owner;

  function NoHydratedComponent() {
    return (
      <NoHydration>
        <LazyComponent />
      </NoHydration>
    );
  }

  function onIdle() {
    const cb = () => mount();
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
        mount();
        io.disconnect();
      }
    }, ioOptions);
    io.observe(el);
  }

  function onLoad() {
    mount();
  }

  function mount() {
    if (!import.meta.env.SSR) {
      LazyComponent.preload().then(m => {
        runWithOwner(owner, () => {
          const component = createComponent(m.default, {});
          hydrate(() => component, el, {renderId: id});
        });
      });
    }
  }

  return () => {
    id = createUniqueId();
    owner = getOwner();

    onMount(() => {
      el = document.querySelector(`[data-c="${id}"]`) as Element;
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
          <codeimage-hydratable data-c={id}>
            <NoHydratedComponent />
          </codeimage-hydratable>
        </Hydration>
      );
    } else {
      return <NoHydratedComponent />;
    }
  };
}
