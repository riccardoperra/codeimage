import * as styles from './Sidebar.css';
import {PropsWithChildren} from 'solid-js/types/render/component';
import {JSXElement} from 'solid-js';

export default function Sidebar(props: PropsWithChildren): JSXElement {
  return <div class={styles.sidebar}>{props.children}</div>;
}
