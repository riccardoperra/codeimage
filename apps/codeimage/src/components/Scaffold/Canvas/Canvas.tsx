import type {FlowProps} from 'solid-js';
import * as styles from './Canvas.css';

// oxlint-disable-next-line typescript/no-empty-object-type
type CanvasProps = {};

export function Canvas(props: FlowProps<CanvasProps>) {
  return (
    <div class={styles.wrapper}>
      <div class={styles.canvas}>{props.children}</div>
    </div>
  );
}
