import {WithRef} from 'solid-headless/dist/types/utils/dynamic-prop';
import {ParentComponent} from 'solid-js';
import * as styles from './Canvas.css';

type CanvasProps = WithRef<'div'>;

export const Canvas: ParentComponent<CanvasProps> = props => {
  return <div class={styles.canvas}>{props.children}</div>;
};
