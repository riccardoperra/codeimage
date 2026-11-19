import type {JSX} from '@solidjs/web';
import clsx from 'clsx';
import type {ParentProps} from 'solid-js';
import {Show} from 'solid-js';
import {CloseIcon} from '../../components/Icons/CloseIcon';
import {CloseButton, Content, Portal, Root, Title} from './parts';
import type {DialogRootProps} from './parts';
import * as styles from './Dialog.css';

interface DialogProps extends DialogRootProps {
  size?: keyof typeof styles.panel;
  title?: JSX.Element;
  closeLabel?: string;
  class?: string;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: Event) => void;
}

export function Dialog(props: DialogProps) {
  return (
    <Root
      open={props.open}
      modal={props.modal}
      exitDuration={props.exitDuration}
      onOpenChange={props.onOpenChange}
    >
      <Portal>
        <div
          class={styles.positioner}
          data-dialog-backdrop
          data-panel-size={props.size ?? 'md'}
          data-nonmodal={props.modal === false ? '' : undefined}
          data-closed={props.open ? undefined : ''}
        >
          <Content
            role="alertdialog"
            class={clsx(styles.panel[props.size ?? 'md'], props.class)}
            onOpenAutoFocus={props.onOpenAutoFocus}
            onCloseAutoFocus={props.onCloseAutoFocus}
            onEscapeKeyDown={props.onEscapeKeyDown}
            onPointerDownOutside={props.onPointerDownOutside}
          >
            <Show when={props.title}>
              <div class={styles.titleRow} data-cui="dialog-panel-title">
                <Title>{props.title}</Title>
                <CloseButton size="xs" aria-label={props.closeLabel ?? 'close'}>
                  <CloseIcon class={styles.closeIcon} />
                </CloseButton>
              </div>
            </Show>
            {props.children}
          </Content>
        </div>
      </Portal>
    </Root>
  );
}

export {CloseButton as DialogCloseButton, Title as DialogTitle} from './parts';

export function DialogPanelContent(props: ParentProps) {
  return (
    <div class={styles.panelContent} data-cui="dialog-panel-content">
      {props.children}
    </div>
  );
}

export function DialogPanelFooter(props: ParentProps) {
  return (
    <div class={styles.panelFooter} data-cui="dialog-panel-footer">
      {props.children}
    </div>
  );
}
