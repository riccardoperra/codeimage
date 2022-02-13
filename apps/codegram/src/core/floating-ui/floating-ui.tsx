import type {
  ComputePositionConfig,
  ComputePositionReturn,
  VirtualElement,
} from '@floating-ui/core';
import {computePosition} from '@floating-ui/dom';
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
  getScrollParents,
  detectOverflow,
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
>;

export function useFloating({
  middleware,
  placement,
  strategy,
}: Omit<Partial<ComputePositionConfig>, 'platform'> = {}): UseFloatingReturn {
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

    computePosition(reference() as Element, floating() as HTMLElement, {
      middleware: middleware,
      placement,
      strategy,
    }).then(data => {
      setData(data);
    });
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
