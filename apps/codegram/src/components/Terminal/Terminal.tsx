import {Component} from 'solid-js';
import * as styles from './terminal.css';
import {sprinkles} from '../../theme/sprinkles.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {backgroundColorVar} from '../../theme/variables.css';
import {themeVars} from '../../theme/global.css';
import {TerminalState} from '../../state/terminal';

export const Terminal: Component<TerminalState> = props => {
  return (
    <div
      class={styles.wrapper}
      data-theme-mode={props.darkMode ? 'dark' : 'light'}
      style={assignInlineVars({
        [styles.terminalVars.backgroundColor]: props.background,
        [styles.terminalVars.textColor]: props.textColor,
        [styles.terminalVars.boxShadow]: props.shadow ?? themeVars.boxShadow.lg,
      })}
    >
      <div class={styles.header} data-accent-visible={props.accentVisible}>
        <div class={styles.headerIconRow}>
          <div
            class={styles.headerIconRowCircle}
            style={assignInlineVars({
              [backgroundColorVar]: styles.terminalVars.controls.red,
            })}
          />
          <div
            class={styles.headerIconRowCircle}
            style={assignInlineVars({
              [backgroundColorVar]: styles.terminalVars.controls.yellow,
            })}
          />
          <div
            class={styles.headerIconRowCircle}
            style={assignInlineVars({
              [backgroundColorVar]: styles.terminalVars.controls.green,
            })}
          />
        </div>

        <div class={styles.tab}>Untitled.tsx</div>
      </div>
      <div class={styles.content}>
        <div class={sprinkles({position: 'relative'})}>
          <div>{props.children}</div>
        </div>
      </div>
    </div>
  );
};
