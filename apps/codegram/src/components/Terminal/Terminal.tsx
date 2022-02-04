import {Component} from 'solid-js';
import * as styles from './terminal.css';
import {sprinkles} from '../../theme/sprinkles.css';

export const Terminal: Component = props => {
  return (
    <div class={styles.wrapper}>
      <div class={styles.header}>
        <div class={styles.headerIconRow}>
          <div
            class={styles.headerIconRowCircle}
            style={{'--terminal-circle-color': '#ff5f57'}}
          />
          <div
            class={styles.headerIconRowCircle}
            style={{'--terminal-circle-color': '#febc2e'}}
          />
          <div
            class={styles.headerIconRowCircle}
            style={{'--terminal-circle-color': '#28c840'}}
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
