import * as styles from './Canvas.css';
import {Component} from 'solid-js';
import {WithRef} from 'solid-headless/dist/types/utils/dynamic-prop';

type CanvasProps = WithRef<'div'>;

export const Canvas: Component<CanvasProps> = props => {
  return <div class={styles.canvas}>{props.children}</div>;
};
