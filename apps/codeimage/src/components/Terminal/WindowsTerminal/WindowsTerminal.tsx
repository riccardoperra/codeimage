import {Box} from '@codeimage/ui';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import {ParentComponent, Show} from 'solid-js';
import {TerminalWindowTabList} from '../Tabs/TerminalWindowTabList';
import * as baseStyles from '../terminal.css';
import {BaseTerminalProps, TerminalHost} from '../TerminalHost';
import * as styles from './WindowsTerminal.css';
import {WindowsTerminalControls} from './WindowsTerminalControls';

export const exportExclude = _exportExclude;

export const WindowsTerminal: ParentComponent<BaseTerminalProps> = props => {
  const showTab = () => props.accentVisible && !props.alternativeTheme;
  return (
    <TerminalHost {...props} themeClass={styles.theme}>
      <Show when={props.showHeader}>
        <div class={baseStyles.header} data-accent-visible={showTab()}>
          <Show when={props.showTab}>
            <TerminalWindowTabList
              readOnly={props.readonlyTab}
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
