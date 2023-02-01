import {backgroundColorVar} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import * as styles from './SnippetControls.css';
import * as parentStyles from '../Snippet.css';

export function SnippetControls() {
  return (
    <div class={styles.headerIconRow}>
      <div
        class={styles.headerIconRowCircle}
        style={assignInlineVars({
          [backgroundColorVar]: parentStyles.snippetThemeVars.controls.red,
        })}
      />
      <div
        class={styles.headerIconRowCircle}
        style={assignInlineVars({
          [backgroundColorVar]: parentStyles.snippetThemeVars.controls.yellow,
        })}
      />
      <div
        class={styles.headerIconRowCircle}
        style={assignInlineVars({
          [backgroundColorVar]: parentStyles.snippetThemeVars.controls.green,
        })}
      />
    </div>
  );
}
