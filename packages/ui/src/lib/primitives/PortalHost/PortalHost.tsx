import type {JSX} from '@solidjs/web';
import type {
  Element as JSXElement,
  ParentProps as PropsWithChildren,
} from 'solid-js';
import {createSignal, merge, onSettled, Show} from 'solid-js';
import * as styles from './PortalHost.css';
import {Portal} from '@solidjs/web';

export function PortalHost(
  props: Omit<JSX.IntrinsicElements['div'], 'class' | 'style'>,
): JSXElement {
  const mergedProps = merge({id: 'portal-host'}, props);

  return <div class={styles.host} {...mergedProps} />;
}

export function PortalHostContext(props: PropsWithChildren) {
  const [ref, setRef] = createSignal<HTMLElement | null>();

  onSettled(() => {
    const el = document.querySelector('#portal-host') as HTMLElement | null;
    setRef(() => el);
  });

  return (
    <Show when={ref()}>
      <Portal mount={ref() as HTMLElement}>{props.children}</Portal>
    </Show>
  );
}
