import {Component, Show} from 'solid-js';
import * as styles from './MacOsTerminal.css';
import * as baseStyles from '../terminal.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {BaseTerminalProps, TerminalHost} from '../TerminalHost';
import {backgroundColorVar} from '../../../theme/variables.css';
import {InlineTextField} from '../../ui/TextField/InlineTextField';
import {Box} from '../../ui/Box/Box';
import {TabIcon} from '../TabIcon';

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
              <InlineTextField
                size={'sm'}
                readOnly={props.readonlyTab}
                placeholder={'Untitled'}
                value={props.tabName ?? ''}
                disabled={false}
                onChange={value => props.onTabChange?.(value)}
              />
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
