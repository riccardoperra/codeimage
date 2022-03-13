import {
  Dialog as ShDialog,
  DialogOverlay,
  DialogProps as ShDialogProps,
  TransitionChild,
} from 'solid-headless';
import {JSXElement, Show} from 'solid-js';
import {omitProps} from 'solid-use';
import clsx from 'clsx';
import * as styles from './Dialog.css';
import {FadeInOutTransition} from '../Transition/Transition';
import {PropsWithChildren} from 'solid-js/types/render/component';
import {DialogTitle} from './DialogTitle';
import {DialogPanel, DialogPanelProps} from './DialogPanel';
import {Box} from '../Box/Box';

export type DialogProps = Omit<ShDialogProps, 'children'> & {
  title?: string;
  size: DialogPanelProps['size'];
};

export function Dialog(props: PropsWithChildren<DialogProps>): JSXElement {
  return (
    <ShDialog
      class={clsx(styles.host, props.class)}
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

        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
          as={Box}
          width={'100%'}
          display={'flex'}
          justifyContent={'center'}
        >
          <DialogPanel size={props.size}>
            <Show when={props.title}>
              <DialogTitle as={'h3'}>{props.title}</DialogTitle>
            </Show>
            {props.children}
          </DialogPanel>
        </TransitionChild>
      </div>
    </ShDialog>
  );
}
