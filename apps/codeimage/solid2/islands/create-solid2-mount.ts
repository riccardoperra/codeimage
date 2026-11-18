import {render} from '@solidjs/web';
import type {Component} from 'solid-js';
import {createComponent, createSignal} from 'solid-js';
import type {Solid2Mount} from '../../src/core/solid2-islands/contracts';

export function createSolid2Mount<Props extends object>(
  Component: Component<Props>,
): Solid2Mount<Props> {
  return (target, initialSnapshot) => {
    const [snapshot, setSnapshot] = createSignal({props: initialSnapshot});
    const props = new Proxy(
      {...initialSnapshot},
      {
        get: (_, key) => Reflect.get(snapshot().props, key),
        has: (_, key) => Reflect.has(snapshot().props, key),
        ownKeys: () => Reflect.ownKeys(snapshot().props),
        getOwnPropertyDescriptor: (_, key) => {
          const descriptor = Reflect.getOwnPropertyDescriptor(
            snapshot().props,
            key,
          );
          return descriptor && {...descriptor, configurable: true};
        },
      },
    );
    const dispose = render(() => createComponent(Component, props), target);
    return {
      update(nextSnapshot) {
        setSnapshot({props: nextSnapshot});
      },
      dispose,
    };
  };
}
