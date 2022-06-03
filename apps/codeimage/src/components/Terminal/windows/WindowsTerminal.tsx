import {Box} from '@codeimage/ui';
import {ParentComponent, Show} from 'solid-js';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import {WindowTabListManager} from '../tabs/WindowTabListManager';
import * as baseStyles from '../terminal.css';
import {BaseTerminalProps, TerminalHost} from '../TerminalHost';
import * as styles from './WindowsTerminal.css';
import {WindowsTerminalControls} from './WindowsTerminalControls';

export const exportExclude = _exportExclude;

export const WindowsTerminal: ParentComponent<BaseTerminalProps> = props => {
  const showTab = () => props.accentVisible && !props.alternativeTheme;
  return (
    <TerminalHost {...props} theme={styles.theme}>
      <Show when={props.showHeader}>
        <div
          class={baseStyles.header}
          data-theme-mode={props.darkMode ? 'dark' : 'light'}
          data-accent-visible={showTab()}
        >
          <Show when={props.showTab}>
            <WindowTabListManager
              accent={props.accentVisible && !props.alternativeTheme}
            />
          </Show>

          <WindowsTerminalControls />
        </div>
      </Show>

      <Show when={props.children}>
        <div class={baseStyles.content}>
          <Box position={'relative'}>
            <div>{props.children}</div>
          </Box>
        </div>
      </Show>
    </TerminalHost>
  );
};
