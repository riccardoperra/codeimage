import {Component} from 'solid-js';
import * as styles from './Scaffold.css';

export const Scaffold: Component = props => {
  return <div class={styles.scaffold}>{props.children}</div>;
};
