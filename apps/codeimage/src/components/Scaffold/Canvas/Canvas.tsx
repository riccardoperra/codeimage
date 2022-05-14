import {ParentComponent} from 'solid-js';
import * as styles from './Canvas.css';

export const Canvas: ParentComponent = props => {
  return <div class={styles.canvas}>{props.children}</div>;
};
