import {Box, sprinkles, Text} from '@codeimage/ui';
import clsx from 'clsx';
import {ParentComponent, Show} from 'solid-js';
import {exportExclude as _exportExclude} from '../../../core/directives/exportExclude';
import {TabIcon} from '../TabIcon';
import {TabName} from '../TabName';
import * as baseStyles from '../terminal.css';
import {BaseTerminalProps, TerminalHost} from '../TerminalHost';
import * as styles from './WindowsTerminal.css';
import {WindowsTerminalControls} from './WindowsTerminalControls';

export const exportExclude = _exportExclude;

export const WindowsTerminal: ParentComponent<BaseTerminalProps> = props => {
  return (
    <TerminalHost {...props} theme={styles.theme}>
      <Show when={props.showHeader}>
        <div
          class={baseStyles.header}
          data-theme-mode={props.darkMode ? 'dark' : 'light'}
          data-accent-visible={props.accentVisible}
        >
          <Show when={props.showTab}>
            <div
              use:exportExclude={!props.tabName?.length}
              class={clsx(
                baseStyles.tab({accent: props.accentVisible}),
                sprinkles({marginLeft: 6}),
              )}
            >
              <Show when={props.tabIcon}>
                {icon => <TabIcon content={icon} />}
              </Show>

              <Show
                fallback={
                  <Text size={'sm'}>{props.tabName ?? 'Untitled'}</Text>
                }
                when={!props.readonlyTab}
              >
                <TabName
                  readonly={false}
                  value={props.tabName ?? ''}
                  onValueChange={value => props.onTabChange?.(value)}
                />
              </Show>
            </div>
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
