import {createViewportObserver} from '@solid-primitives/intersection-observer';
import {
  Accessor,
  createContext,
  createMemo,
  createResource,
  createSignal,
  FlowProps,
  JSX,
  onCleanup,
  onMount,
  Resource,
  startTransition,
  Suspense,
  SuspenseList,
  useContext,
} from 'solid-js';

interface VirtualizeItemProps {
  height: number;
  fallback: JSX.Element;
}

type VirtualizeContextProps = IntersectionObserverInit & {
  scrollElement: HTMLElement;
};

type VirtualizeContext = {
  register: (el: Accessor<HTMLElement>) => Accessor<boolean>;
  unregister: (el: Accessor<HTMLElement>) => void;
};

const $VirtualizeContext = createContext<VirtualizeContext>();

export function VirtualizeContext(props: FlowProps<VirtualizeContextProps>) {
  const [mounted, setMounted] = createSignal(false);
  const [addObserver, {remove}] = createViewportObserver({
    root: props.root,
    rootMargin: props.rootMargin,
    threshold: props.threshold,
  });

  const reveal = createMemo(() => {
    if (!mounted()) return 'together';
    return 'forwards';
  });

  const register = (el: Accessor<HTMLElement>): Resource<boolean> => {
    const [visibility, setVisibility] = createSignal(false);
    const [visible] = createResource(
      visibility,
      async (visibility, {value}) => {
        if (visibility === value) {
          return visibility as boolean;
        }

        await new Promise(r => {
          setTimeout(() => {
            startTransition(() => r(true));
          });
        });

        return visibility;
      },
      {initialValue: false},
    );

    onMount(() => {
      const ref = el();
      let pendingId: number | undefined = undefined;
      addObserver(ref, entry => {
        if (pendingId !== undefined) {
          clearTimeout(pendingId);
          pendingId = window.setTimeout(() => {
            setVisibility(entry.isIntersecting);
          });
        } else {
          setVisibility(entry.isIntersecting);
        }
      });
      onCleanup(() => remove(ref));
      // TODO: not working with safari
      window.requestIdleCallback(() => {
        setMounted(true);
      });
    });

    return visible;
  };

  const unregister = (el: Accessor<HTMLElement>) => remove(el());

  return (
    <$VirtualizeContext.Provider
      value={{
        register,
        unregister,
      }}
    >
      <SuspenseList revealOrder={reveal()}>{props.children}</SuspenseList>
    </$VirtualizeContext.Provider>
  );
}

export function VirtualizeItem(props: FlowProps<VirtualizeItemProps>) {
  const {register} = useContext($VirtualizeContext)!;
  const visible = register(() => ref);
  let ref!: HTMLDivElement;

  return (
    <div style={{height: `${props.height}px`}} ref={ref}>
      <Suspense fallback={props.fallback}>
        {visible() && props.children}
      </Suspense>
    </div>
  );
}
