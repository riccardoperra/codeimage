import {createEffect, onCleanup, onMount} from 'solid-js';
import type {Solid2Mount} from './contracts';

interface IslandHost {
  name: string;
  class?: string;
}

export function createSolid2Island<Props extends object>(
  mount: Solid2Mount<Props>,
  host: IslandHost,
) {
  return function Solid2Island(props: Props) {
    let target: HTMLDivElement | undefined;

    onMount(() => {
      if (!target) return;
      const connection = mount(target, {...props});
      createEffect(() => connection.update({...props}));
      onCleanup(connection.dispose);
    });

    return (
      <div
        class={host.class}
        ref={element => {
          target = element;
        }}
        data-solid2-island={host.name}
      />
    );
  };
}
