import {skeleton} from './FrameSkeleton.css';
import * as styles from './FrameSkeleton.css';

export function FrameSkeleton() {
  return (
    <div class={styles.wrapper}>
      <div class={styles.terminal.base}>
        <div class={styles.terminal.header} />

        <div class={styles.terminal.content}>
          <div class={styles.skeleton.line1} />
          <div class={styles.skeleton.divider} />
          <div class={styles.skeleton.line1} />
          <div class={styles.skeleton.divider} />
          <div class={styles.skeleton.line2} />
          <div class={styles.skeleton.divider2} />
          <div class={styles.skeleton.divider2} />
          <div class={styles.skeleton.line2} />
          <div class={styles.skeleton.divider} />
          <div class={styles.skeleton.line1} />
          <div class={styles.skeleton.divider2} />
          <div class={styles.skeleton.divider2} />
          <div class={styles.skeleton.line3} />
          <div class={styles.skeleton.divider} />
          <div class={styles.skeleton.line4} />
          <div class={styles.skeleton.divider} />
          <div class={styles.skeleton.line5} />
        </div>
      </div>
    </div>
  );
}
