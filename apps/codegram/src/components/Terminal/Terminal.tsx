import {Component, from} from 'solid-js';
import * as styles from './terminal.css';
import {sprinkles} from '../../theme/sprinkles.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {backgroundColorVar} from '../../theme/variables.css';
import {frameState} from '../../state/frame.state';
import {themeVars} from '../../theme/global.css';

export const Terminal: Component = props => {
  const state = from(frameState);

  return (
    <div
      class={styles.wrapper}
      style={assignInlineVars({
        [styles.terminalVars.boxShadow]:
          state().shadow ?? themeVars.boxShadow.lg,
      })}
    >
      <div class={styles.header} data-accent-visible={state().accentVisible}>
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
