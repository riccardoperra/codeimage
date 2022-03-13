import {
  DialogPanel as ShDialogPanel,
  DialogPanelProps as ShDialogPanelProps,
} from 'solid-headless';
import {JSXElement} from 'solid-js';
import {omitProps} from 'solid-use';
import clsx from 'clsx';
import * as styles from './Dialog.css';
import {DialogPanelVariants} from './Dialog.css';
import {PropsWithChildren} from 'solid-js/types/render/component';
import {Box} from '../Box/Box';

export type DialogPanelProps = ShDialogPanelProps & DialogPanelVariants;

export function DialogPanel(props: DialogPanelProps): JSXElement {
  return (
    <ShDialogPanel
      {...omitProps(props, ['children', 'class'])}
      class={clsx(
        styles.panel({
          size: props.size,
          fullScreen: props.fullScreen,
        }),
        props.class,
      )}
    >
      {props.children}
    </ShDialogPanel>
  );
}

export function DialogPanelContent(props: PropsWithChildren): JSXElement {
  return <Box class={styles.panelContent}>{props.children}</Box>;
}

export function DialogPanelFooter(props: PropsWithChildren): JSXElement {
  return <Box class={styles.panelFooter}>{props.children}</Box>;
}
