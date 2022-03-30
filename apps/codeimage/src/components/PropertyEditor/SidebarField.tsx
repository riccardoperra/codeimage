import {Component} from 'solid-js';
import * as styles from './SidebarField.css';

export const SidebarField: Component = props => {
  return <div class={styles.wrapper}>{props.children}</div>;
};
