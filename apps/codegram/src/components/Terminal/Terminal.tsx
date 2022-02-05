import {Component} from 'solid-js';
import * as styles from './terminal.css';
import {sprinkles} from '../../theme/sprinkles.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {backgroundColorVar} from '../../theme/variables.css';

export const Terminal: Component = props => {
  return (
    <div class={styles.wrapper}>
      <div class={styles.header}>
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
      </div>
      <div class={styles.content}>
        <div
          class={sprinkles({
            position: 'relative',
          })}
        >
          <div>{props.children}</div>
        </div>
      </div>
    </div>
  );
};
