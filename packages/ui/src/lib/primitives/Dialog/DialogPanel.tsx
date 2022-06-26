import {assignInlineVars} from '@vanilla-extract/dynamic';
import {JSXElement, ParentProps} from 'solid-js';
import {PropsWithChildren} from 'solid-js/types/render/component';
import {dynamicFullHeight} from '../../theme/variables.css';
import {Box} from '../Box';
import * as styles from './Dialog.css';
import {DialogPanelVariants} from './Dialog.css';

export type DialogPanelProps = DialogPanelVariants;

export function DialogPanel(props: ParentProps<DialogPanelProps>): JSXElement {
  return (
    <div
      class={styles.panel({
        size: props.size,
        fullScreen: props.fullScreen,
      })}
      style={assignInlineVars({
        [dynamicFullHeight]: `${window.innerHeight * 0.01}px`,
      })}
    >
      {props.children}
    </div>
  );
}

export function DialogPanelContent(props: PropsWithChildren): JSXElement {
  return <Box class={styles.panelContent}>{props.children}</Box>;
}

export function DialogPanelFooter(props: PropsWithChildren): JSXElement {
  return <Box class={styles.panelFooter}>{props.children}</Box>;
}
