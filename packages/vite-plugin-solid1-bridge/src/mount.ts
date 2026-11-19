import {createComponent, createSignal, mergeProps} from 'solid-js';
import type {Component} from 'solid-js';
import {render} from 'solid-js/web';
import type {LegacyMount, PropsSnapshot} from './contracts.js';

export function createLegacyMount(
  Component: Component<PropsSnapshot>,
): LegacyMount {
  return (target, initialProps) => {
    const [props, setProps] = createSignal(initialProps);
    const liveProps = mergeProps(() => props());
    const dispose = render(() => createComponent(Component, liveProps), target);
    return {
      update(nextProps) {
        setProps(nextProps);
      },
      dispose,
    };
  };
}
