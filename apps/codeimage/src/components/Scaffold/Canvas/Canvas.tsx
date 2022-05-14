import * as styles from './Canvas.css';
import {Component, ParentComponent} from 'solid-js';
import {WithRef} from 'solid-headless/dist/types/utils/dynamic-prop';

export const Canvas: ParentComponent = props => {
  return <div class={styles.canvas}>{props.children}</div>;
};
