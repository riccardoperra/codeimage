import {snippetThemeValues} from '../snippet-theme';
import styles from './SnippetControls.module.css';

export function SnippetControls() {
  return (
    <div class={styles.headerIconRow}>
      <div
        class={styles.headerIconRowCircle}
        style={{'--background-color': snippetThemeValues.controls.red}}
      />
      <div
        class={styles.headerIconRowCircle}
        style={{'--background-color': snippetThemeValues.controls.yellow}}
      />
      <div
        class={styles.headerIconRowCircle}
        style={{'--background-color': snippetThemeValues.controls.green}}
      />
    </div>
  );
}
