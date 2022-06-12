import * as styles from './ThemeBoxSkeleton.css';

export function ThemeBoxSkeleton() {
  return (
    <div class={styles.wrapper}>
      <div class={styles.content}>
        <div class={styles.skeleton.rectangle} />
        <div class={styles.skeleton.divider2} />
        <div class={styles.skeleton.line1} />
        <div class={styles.skeleton.divider} />
        <div class={styles.skeleton.line1} />
        <div class={styles.skeleton.divider} />
        <div class={styles.skeleton.line2} />
      </div>
    </div>
  );
}
