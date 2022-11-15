import {Motion} from '@motionone/solid';
import * as styles from './CircularProgress.css';

interface CircularProgressProps {
  progress: number;
}

export function CircularProgress(props: CircularProgressProps) {
  return (
    <Motion.div class={styles.container}>
      <Motion.span
        animate={{
          opacity: props.progress > 0 ? 1 : 0,
        }}
        class={styles.progressText}
      >
        {Math.floor(props.progress)}
      </Motion.span>
      <svg
        width="75"
        height="75"
        viewBox="0 0 100 100"
        class={styles.circularProgress}
      >
        <circle
          cx="50"
          cy="50"
          r="30"
          pathLength="1"
          class={`${styles.circle} ${styles.bg}`}
        />
        <circle
          cx="50"
          cy="50"
          r="30"
          pathLength="1"
          class={`${styles.circle} ${styles.progress}`}
        />
      </svg>
    </Motion.div>
  );
}
