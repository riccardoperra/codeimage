import {Component, Show} from 'solid-js';
import * as styles from './WindowsTerminal.css';
import {sprinkles} from '../../../theme/sprinkles.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {themeVars} from '../../../theme/global.css';
import {WindowsTerminalHeader} from './WindowsTerminalHeader';
import {TerminalProps} from '../Terminal';

interface WindowsTerminalProps extends TerminalProps {}

export const WindowsTerminal: Component<WindowsTerminalProps> = props => {
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
      <Show when={props.showHeader}>
        <WindowsTerminalHeader
          showTab={props.showTab}
          accentVisible={props.accentVisible}
          darkMode={props.darkMode}
        />
      </Show>

      <Show when={props.children}>
        <div class={styles.content}>
          <div class={sprinkles({position: 'relative'})}>
            <div>{props.children}</div>
          </div>
        </div>
      </Show>
    </div>
  );
};
