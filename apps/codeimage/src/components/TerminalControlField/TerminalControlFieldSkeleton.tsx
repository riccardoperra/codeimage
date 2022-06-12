import * as styles from './TerminalControlFieldSkeleton.css';

export function TerminalControlSkeleton() {
  return (
    <div class={styles.wrapper}>
      <div class={styles.skeleton.rectangle2} />
    </div>
  );
}
