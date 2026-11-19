import type {ParentProps as PropsWithChildren} from 'solid-js';
import {createSignal, merge, onSettled, Show} from 'solid-js';
import {Portal} from '@solidjs/web';

const DEFAULT_ID = 'floating-ui-root';

export interface CreateFloatingPortalNodeProps {
  id?: string;
}

export const createFloatingPortalNode = (
  props: CreateFloatingPortalNodeProps,
) => {
  const [portal, setPortal] = createSignal<HTMLElement | null>(null);
  const propsWithDefault = merge({id: DEFAULT_ID}, props);

  onSettled(() => {
    const rootNode = document.getElementById(propsWithDefault.id);
    if (rootNode) {
      setPortal(() => rootNode);
    } else {
      const element = document.createElement('div');
      element.id = propsWithDefault.id;
      setPortal(() => element);
    }
  });
  return portal;
};

export interface FloatingPortalProps {
  id?: string;
  root?: HTMLElement | null;
}

export const FloatingPortal = (
  props: PropsWithChildren<FloatingPortalProps>,
) => {
  const portalNode = createFloatingPortalNode({
    get id() {
      return props.id;
    },
  });

  return (
    <Show when={portalNode()} keyed>
      {node => <Portal mount={node}>{props.children}</Portal>}
    </Show>
  );
};
