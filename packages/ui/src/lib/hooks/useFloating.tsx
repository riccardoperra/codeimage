import type {
  ComputePositionConfig,
  ComputePositionReturn,
} from '@floating-ui/core';
import {autoUpdate, computePosition, ReferenceElement} from '@floating-ui/dom';
import {
  Accessor,
  createEffect,
  createSignal,
  mergeProps,
  on,
  onCleanup,
} from 'solid-js';
import {createStore} from 'solid-js/store';

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
  const [reference, setReference] = createSignal<ReferenceElement | null>(null);
  const [floating, setFloating] = createSignal<HTMLElement | null>(null);

  const [data, setData] = createStore<Data>({
    x: null,
    y: null,
    strategy: strategy ?? 'absolute',
    placement: 'bottom',
    middlewareData: {},
  });

  function update() {
    const referenceEl = reference();
    const floatingEl = floating();
    if (!referenceEl || !floatingEl) {
      return;
    }

    computePosition(referenceEl, floatingEl, {
      middleware: middleware,
      placement,
      strategy,
    }).then(data => setData(data));
  }

  createEffect(
    on([reference, floating], ([reference, floating]) => {
      if (reference && floating) {
        if (runAutoUpdate) {
          const cleanup = autoUpdate(reference, floating, update);
          if (cleanup) {
            onCleanup(cleanup);
          }
        } else {
          update();
        }
      }
    }),
  );

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
