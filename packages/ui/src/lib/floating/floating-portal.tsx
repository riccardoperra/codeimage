import {
  createSignal,
  mergeProps,
  onMount,
  PropsWithChildren,
  Show,
} from 'solid-js';
import {Portal} from 'solid-js/web';

const DEFAULT_ID = 'floating-ui-root';

export interface CreateFloatingPortalNodeProps {
  id?: string;
}

export const createFloatingPortalNode = (
  props: CreateFloatingPortalNodeProps,
) => {
  const [portal, setPortal] = createSignal<HTMLElement | null>(null);
  const propsWithDefault = mergeProps({id: DEFAULT_ID}, props);

  onMount(() => {
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
  const portalNode = createFloatingPortalNode({id: props.id});

  return (
    <Show when={portalNode()} keyed>
      {node => <Portal mount={node}>{props.children}</Portal>}
    </Show>
  );
};
