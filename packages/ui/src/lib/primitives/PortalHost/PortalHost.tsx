import {
  createSignal,
  JSX,
  JSXElement,
  mergeProps,
  onMount,
  Show,
} from 'solid-js';
import * as styles from './PortalHost.css';
import {PropsWithChildren} from 'solid-js/types/render/component';
import {Portal} from 'solid-js/web';

export function PortalHost(
  props: Omit<JSX.IntrinsicElements['div'], 'class' | 'style'>,
): JSXElement {
  const mergedProps = mergeProps({id: 'portal-host'}, props);

  return <div class={styles.host} {...mergedProps} />;
}

export function PortalHostContext(props: PropsWithChildren) {
  const [ref, setRef] = createSignal<HTMLElement | null>();

  onMount(() => {
    const el = document.querySelector('#portal-host') as HTMLElement | null;
    setRef(() => el);
  });

  return (
    <Show when={ref()}>
      <Portal mount={ref() as HTMLElement}>{props.children}</Portal>
    </Show>
  );
}
