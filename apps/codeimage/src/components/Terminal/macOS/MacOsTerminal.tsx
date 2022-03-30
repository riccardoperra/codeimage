import {Component, Show} from 'solid-js';
import * as styles from './MacOsTerminal.css';
import * as baseStyles from '../terminal.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {BaseTerminalProps, TerminalHost} from '../TerminalHost';
import {backgroundColorVar} from '../../../theme/variables.css';
import {Box} from '../../../ui/Box/Box';
import {TabIcon} from '../TabIcon';
import {TabName} from '../TabName';
import {Text} from '../../../ui/Text/Text';

export const MacOsTerminal: Component<BaseTerminalProps> = props => {
  return (
    <TerminalHost {...props} theme={styles.theme}>
      <Show when={props.showHeader}>
        <div
          class={baseStyles.header}
          data-accent-visible={props.accentVisible}
        >
          <div class={styles.headerIconRow}>
            <div
              class={styles.headerIconRowCircle}
              style={assignInlineVars({
                [backgroundColorVar]: styles.vars.controls.red,
              })}
            />
            <div
              class={styles.headerIconRowCircle}
              style={assignInlineVars({
                [backgroundColorVar]: styles.vars.controls.yellow,
              })}
            />
            <div
              class={styles.headerIconRowCircle}
              style={assignInlineVars({
                [backgroundColorVar]: styles.vars.controls.green,
              })}
            />
          </div>

          <Show when={props.showTab}>
            <div class={baseStyles.tab({accent: props.accentVisible})}>
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
