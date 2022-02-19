import {Component, Show} from 'solid-js';
import * as baseStyles from '../terminal.css';
import {sprinkles} from '../../../theme/sprinkles.css';
import {WindowsTerminalHeader} from './WindowsTerminalHeader';
import {BaseTerminalProps, TerminalHost} from '../TerminalHost';
import * as styles from './WindowsTerminal.css';

export const WindowsTerminal: Component<BaseTerminalProps> = props => {
  return (
    <TerminalHost {...props} theme={styles.theme}>
      <Show when={props.showHeader}>
        <WindowsTerminalHeader
          showTab={props.showTab}
          accentVisible={props.accentVisible}
          darkMode={props.darkMode}
        />
      </Show>

      <Show when={props.children}>
        <div class={baseStyles.content}>
          <div class={sprinkles({position: 'relative'})}>
            <div>{props.children}</div>
          </div>
        </div>
      </Show>
    </TerminalHost>
  );
};
