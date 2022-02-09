import * as styles from './Canvas.css';
import {Component} from 'solid-js';

export const Canvas: Component = props => {
  return <div class={styles.canvas}>{props.children}</div>;
};
