import {
  Dialog as ShDialog,
  DialogOverlay,
  DialogProps as ShDialogProps,
} from 'solid-headless';
import {JSXElement, Show} from 'solid-js';
import {omitProps} from 'solid-use';
import clsx from 'clsx';
import * as styles from './Dialog.css';
import {
  FadeInOutTransition,
  FadeInOutWithScaleTransition,
} from '../Transition/Transition';
import {PropsWithChildren} from 'solid-js/types/render/component';
import {DialogTitle} from './DialogTitle';
import {DialogPanel, DialogPanelProps} from './DialogPanel';
import {Box} from '@codeimage/ui';

export type DialogProps = Omit<ShDialogProps, 'children'> & {
  title?: string;
  fullScreen?: DialogPanelProps['fullScreen'];
  size: DialogPanelProps['size'];
};

export function Dialog(props: PropsWithChildren<DialogProps>): JSXElement {
  return (
    <ShDialog
      class={clsx(styles.host, props.class)}
      data-full-screen={props.fullScreen}
      {...omitProps(props, ['class'])}
    >
      <div class={styles.wrapper}>
        <FadeInOutTransition childTransition={true}>
          <DialogOverlay class={styles.overlay} />
        </FadeInOutTransition>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span class="inline-block h-screen align-middle" aria-hidden="true">
          &#8203;
        </span>

        <FadeInOutWithScaleTransition
          childTransition={true}
          as={Box}
          width={'100%'}
          display={'flex'}
          justifyContent={'center'}
        >
          <DialogPanel fullScreen={props.fullScreen} size={props.size}>
            <Show when={props.title}>
              <DialogTitle as={'h3'}>{props.title}</DialogTitle>
            </Show>
            {props.children}
          </DialogPanel>
        </FadeInOutWithScaleTransition>
      </div>
    </ShDialog>
  );
}
