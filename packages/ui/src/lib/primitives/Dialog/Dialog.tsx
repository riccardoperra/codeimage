import {AriaDialogProps, createDialog} from '@solid-aria/dialog';
import {FocusScope} from '@solid-aria/focus';
import {
  AriaModalProps,
  AriaOverlayProps,
  createModal,
  createOverlay,
  createPreventScroll,
} from '@solid-aria/overlays';
import {JSXElement, ParentProps, Show} from 'solid-js';
import * as styles from './Dialog.css';
import {DialogPanel, DialogPanelProps} from './DialogPanel';

export interface DialogProps
  extends AriaDialogProps,
    AriaModalProps,
    AriaOverlayProps {
  title?: string;
  // @ts-expect-error Fix vanilla-extract typing
  fullScreen?: DialogPanelProps['fullScreen'];
  // @ts-expect-error Fix vanilla-extract typing
  size: DialogPanelProps['size'];
}

export function Dialog(props: ParentProps<DialogProps>): JSXElement {
  let ref: HTMLDivElement | undefined;
  const {overlayProps, underlayProps} = createOverlay(props, () => ref);
  createPreventScroll();
  const {modalProps} = createModal();
  const {dialogProps, titleProps} = createDialog(props, () => ref);

  return (
    <div
      class={styles.overlay}
      data-full-screen={props.fullScreen}
      {...underlayProps}
    >
      <FocusScope contain restoreFocus autofocus>
        <div
          {...overlayProps}
          {...dialogProps}
          {...modalProps}
          ref={ref}
          class={styles.wrapper}
        >
          <DialogPanel fullScreen={props.fullScreen} size={props.size}>
            <Show when={props.title}>
              <h3 {...titleProps} class={styles.title}>
                {props.title}
              </h3>
            </Show>
            {props.children}
          </DialogPanel>
        </div>
      </FocusScope>
    </div>
  );
}
