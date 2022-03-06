import * as styles from './EditorSidebar.css';
import {Component} from 'solid-js';

export const EditorForm: Component = props => (
  <div class={styles.sidebar}>{props.children}</div>
);
