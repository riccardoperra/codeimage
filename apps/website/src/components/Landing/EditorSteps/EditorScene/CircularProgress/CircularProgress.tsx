import {Ref} from 'solid-js';
import * as styles from './CircularProgress.css';

interface CircularProgressProps {
  progress: number;
  ref: Ref<HTMLDivElement>;
}

export function CircularProgress(props: CircularProgressProps) {
  return (
    <div class={styles.container}>
      <div class={styles.progressBar} ref={props.ref}></div>
    </div>
  );
}
