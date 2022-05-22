import type {
  ComputePositionConfig,
  ComputePositionReturn,
  VirtualElement,
} from '@floating-ui/core';
import {autoUpdate, computePosition, ReferenceElement} from '@floating-ui/dom';
import {createStore} from 'solid-js/store';
import {Accessor, createEffect, createSignal, mergeProps, on} from 'solid-js';

type Data = Omit<ComputePositionReturn, 'x' | 'y'> & {
  x: number | null;
  y: number | null;
};

export type UseFloatingReturn = Data & {
  update: () => void;
  setReference: (node: ReferenceElement | null) => void;
  setFloating: (node: ReferenceElement | null) => void;
  refs: {
    reference: Accessor<ReferenceElement | null>;
    floating: Accessor<ReferenceElement | null>;
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
    const referenceEl = reference() as HTMLElement | null;
    const floatingEl = floating() as HTMLElement | null;

    if (!referenceEl || !floatingEl) {
      return;
    }

    function updater() {
      if (!referenceEl || !floatingEl) {
        return;
      }

      computePosition(referenceEl, floatingEl, {
        middleware: middleware,
        placement,
        strategy,
      }).then(data => setData(data));
    }

    if (runAutoUpdate) {
      autoUpdate(referenceEl, floatingEl, updater, {
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
