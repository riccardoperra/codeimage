import {makeResizeObserver} from '@solid-primitives/resize-observer';
import {createEffect, createSignal} from 'solid-js';

export function createResizeRef(measure: (element: HTMLDivElement) => void) {
  const [target, setTarget] = createSignal<HTMLDivElement>();
  const {observe, unobserve} = makeResizeObserver<HTMLDivElement>(([entry]) => {
    if (entry) measure(entry.target);
  });
  createEffect(target, element => {
    if (!element) return;
    observe(element);
    return () => unobserve(element);
  });
  return setTarget;
}
