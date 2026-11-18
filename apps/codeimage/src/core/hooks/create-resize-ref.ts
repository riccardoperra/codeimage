import {createEffect, createSignal} from 'solid-js';

export function createResizeRef(measure: (element: HTMLDivElement) => void) {
  const [target, setTarget] = createSignal<HTMLDivElement>();
  createEffect(target, element => {
    if (!element) return;
    const observer = new ResizeObserver(() => measure(element));
    observer.observe(element);
    return () => observer.disconnect();
  });
  return setTarget;
}
