import {type FlowProps} from 'solid-js';
import * as styles from './Canvas.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type CanvasProps = {};

export function Canvas(props: FlowProps<CanvasProps>) {
  return (
    <div class={styles.wrapper}>
      <div class={styles.canvas}>{props.children}</div>
    </div>
  );
}
