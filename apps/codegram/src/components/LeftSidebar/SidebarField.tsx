import {Component} from 'solid-js';
import * as styles from './SidebarField.css';

interface SidebarFieldProps {}

export const SidebarField: Component<SidebarFieldProps> = props => {
  return <div class={styles.wrapper}>{props.children}</div>;
};
