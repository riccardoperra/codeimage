import {Accessor, onCleanup} from 'solid-js';

export default function clickOutside(
  el: HTMLElement,
  accessor: Accessor<() => void>,
) {
  const onClick = (e: MouseEvent) =>
    !el.contains(e.target as Node | null) && accessor()?.();
  document.body.addEventListener('click', onClick);

  onCleanup(() => document.body.removeEventListener('click', onClick));
}

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      clickOutside: () => void;
    }
  }
}
