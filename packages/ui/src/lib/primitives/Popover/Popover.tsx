import {createDialog} from '@solid-aria/dialog';
import {FocusScope} from '@solid-aria/focus';
import {
  AriaOverlayProps,
  createModal,
  createOverlay,
  DismissButton,
} from '@solid-aria/overlays';
import {combineProps} from '@solid-primitives/props';
import {mergeRefs} from '@solid-primitives/refs';
import {access} from '@solid-primitives/utils';
import {JSX, Show, splitProps} from 'solid-js';
import * as styles from './Popover.css';

interface PopoverProps extends AriaOverlayProps {
  ref: HTMLDivElement | ((ref: HTMLDivElement) => void) | undefined;
  style?: JSX.CSSProperties | string;
  class?: string;
  title?: JSX.Element;
  children?: JSX.Element;
}

export function Popover(props: PopoverProps) {
  let ref: HTMLDivElement | undefined;

  const [local, others] = splitProps(props, [
    'ref',
    'class',
    'title',
    'children',
    'isOpen',
    'onClose',
  ]);

  const {overlayProps} = createOverlay(
    {
      onClose: local.onClose,
      isOpen: () => access(local.isOpen),
      isDismissable: true,
    },
    () => ref,
  );

  // Hide content outside the modal from screen readers.
  const {modalProps} = createModal();

  // Get props for the dialog and its title
  const {dialogProps, titleProps} = createDialog({}, () => ref);

  const rootProps = combineProps(overlayProps, dialogProps, modalProps, others);

  return (
    <FocusScope restoreFocus>
      <div
        {...rootProps}
        ref={mergeRefs(el => (ref = el), local.ref)}
        class={styles.container}
      >
        <Show when={!!props.title}>
          <h3 {...titleProps} class={styles.title}>
            {props.title}
          </h3>
          <div class={styles.content}>{props.children}</div>
        </Show>
        <DismissButton onDismiss={local.onClose} />
      </div>
    </FocusScope>
  );
}
