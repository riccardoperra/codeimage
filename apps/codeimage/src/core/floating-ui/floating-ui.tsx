import type {
  ComputePositionConfig,
  ComputePositionReturn,
  VirtualElement,
} from '@floating-ui/core';
import {autoUpdate, computePosition} from '@floating-ui/dom';
import {createStore} from 'solid-js/store';
import {Accessor, createEffect, createSignal, mergeProps, on} from 'solid-js';

export {
  autoPlacement,
  flip,
  hide,
  offset,
  shift,
  limitShift,
  size,
  inline,
  detectOverflow,
  autoUpdate,
} from '@floating-ui/dom';

type Data = Omit<ComputePositionReturn, 'x' | 'y'> & {
  x: number | null;
  y: number | null;
};

type UseFloatingReturn = Data & {
  update: () => void;
  setReference: (node: Element | VirtualElement | null) => void;
  setFloating: (node: HTMLElement | null) => void;
  refs: {
    reference: Accessor<Element | VirtualElement | null>;
    floating: Accessor<HTMLElement | null>;
  };
};

export type UseFloatingOptions = Omit<
  Partial<ComputePositionConfig>,
  'platform'
> & {
  runAutoUpdate?: boolean;
};

export function useFloating({
  middleware,
  placement,
  strategy,
  runAutoUpdate,
}: UseFloatingOptions = {}): UseFloatingReturn {
  const [reference, setReference] = createSignal<
    Element | VirtualElement | null
  >(null);

  const [floating, setFloating] = createSignal<HTMLElement | null>(null);

  const [data, setData] = createStore<Data>({
    x: null,
    y: null,
    strategy: strategy ?? 'absolute',
    placement: 'bottom',
    middlewareData: {},
  });

  const update = () => {
    if (!reference() || !floating()) {
      return;
    }

    function updater() {
      computePosition(reference() as HTMLElement, floating() as HTMLElement, {
        middleware: middleware,
        placement,
        strategy,
      }).then(data => setData(data));
    }

    if (runAutoUpdate) {
      autoUpdate(reference(), floating(), updater, {
        animationFrame: true,
        ancestorResize: true,
        ancestorScroll: true,
        elementResize: true,
      });
    } else {
      updater();
    }
  };

  createEffect(on([reference, floating], () => update()));

  const result = mergeProps(data, {
    update,
    setReference,
    setFloating,
    refs: {
      reference,
      floating,
    },
  });

  return result as UseFloatingReturn;
}
