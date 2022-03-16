import {Component, Show} from 'solid-js';
import * as baseStyles from '../terminal.css';
import {sprinkles} from '../../../theme/sprinkles.css';
import {BaseTerminalProps, TerminalHost} from '../TerminalHost';
import * as styles from './WindowsTerminal.css';
import {Box} from '../../ui/Box/Box';
import {InlineTextField} from '../../ui/TextField/InlineTextField';
import {WindowsTerminalControls} from './WindowsTerminalControls';
import {TabIcon} from '../TabIcon';

export const WindowsTerminal: Component<BaseTerminalProps> = props => {
  return (
    <TerminalHost {...props} theme={styles.theme}>
      <Show when={props.showHeader}>
        <div
          class={baseStyles.header}
          data-theme-mode={props.darkMode ? 'dark' : 'light'}
          data-accent-visible={props.accentVisible}
        >
          <Show when={props.showTab}>
            <Box
              class={baseStyles.tab({accent: props.accentVisible})}
              marginLeft={'6'}
            >
              <Show when={props.tabIcon}>
                <TabIcon src={props.tabIcon} />
              </Show>

              <InlineTextField
                size={'sm'}
                readOnly={props.readonlyTab}
                placeholder={'Untitled'}
                value={props.tabName ?? ''}
                disabled={false}
                onChange={value => props.onTabChange?.(value)}
              />
            </Box>
          </Show>

          <WindowsTerminalControls />
        </div>
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
