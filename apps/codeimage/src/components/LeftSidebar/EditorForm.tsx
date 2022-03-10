import * as styles from './EditorSidebar.css';
import {JSXElement} from 'solid-js';
import {PropsWithChildren} from 'solid-js/types/render/component';

export default function EditorForm(props: PropsWithChildren): JSXElement {
  return <div class={styles.sidebar}>{props.children}</div>;
}
