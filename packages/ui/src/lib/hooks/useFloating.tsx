import type {
  ComputePositionConfig,
  MiddlewareData,
  Placement,
} from '@floating-ui/core';
import type {ReferenceElement} from '@floating-ui/dom';
import {autoUpdate, computePosition} from '@floating-ui/dom';
import type {Accessor} from 'solid-js';
import {createEffect, createSignal} from 'solid-js';

interface UseFloatingProps {
  placement: Placement;
  x: number | null;
  y: number | null;
  strategy: ComputePositionConfig['strategy'];
  middlewareData: MiddlewareData;
}

export type UseFloatingReturn = UseFloatingProps & {
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

  const [data, setData] = createSignal<UseFloatingProps>({
    x: null,
    y: null,
    strategy: strategy ?? 'absolute',
    placement: 'bottom',
    middlewareData: {},
  });

  function updatePosition(
    referenceEl: ReferenceElement,
    floatingEl: HTMLElement,
  ) {
    computePosition(referenceEl, floatingEl, {
      middleware: middleware,
      placement,
      strategy,
    }).then(setData);
  }

  function update() {
    const referenceEl = reference();
    const floatingEl = floating();
    if (referenceEl && floatingEl) updatePosition(referenceEl, floatingEl);
  }

  createEffect(
    () => [reference(), floating()] as const,
    ([referenceEl, floatingEl]) => {
      if (!referenceEl || !floatingEl) return;
      if (runAutoUpdate) {
        return autoUpdate(referenceEl, floatingEl, () =>
          updatePosition(referenceEl, floatingEl),
        );
      }
      updatePosition(referenceEl, floatingEl);
    },
  );

  return {
    get placement() {
      return data().placement;
    },
    get x() {
      return data().x;
    },
    get y() {
      return data().y;
    },
    get strategy() {
      return data().strategy;
    },
    get middlewareData() {
      return data().middlewareData;
    },
    update,
    setReference,
    setFloating,
    refs: {
      reference,
      floating,
    },
  };
}
