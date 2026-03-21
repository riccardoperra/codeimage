import type {Ref} from 'solid-js';
import styles from './CircularProgress.module.css';

interface CircularProgressProps {
  progress: number;
  ref: Ref<HTMLDivElement>;
}

export function CircularProgress(props: CircularProgressProps) {
  return (
    <div class={styles.container}>
      <div class={styles.progressBar} ref={props.ref} />
    </div>
  );
}
