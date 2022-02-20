import {Component} from 'solid-js';
import * as styles from './Sidebar.css';

export const Sidebar: Component = props => {
  return <div class={styles.sidebar}>{props.children}</div>;
};
