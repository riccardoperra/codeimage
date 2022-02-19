import {Component, Show} from 'solid-js';
import * as styles from './terminal.css';
import {sprinkles} from '../../theme/sprinkles.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {backgroundColorVar} from '../../theme/variables.css';
import {themeVars} from '../../theme/global.css';
import {TerminalState} from '../../state/terminal';
import {InlineTextField} from '../ui/TextField/InlineTextField';

export interface TerminalProps extends Omit<TerminalState, 'type'> {
  showTab: boolean;
  onTabChange?: (tab: string) => void;
}

export const Terminal: Component<TerminalProps> = props => {
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
        <div class={styles.header} data-accent-visible={props.accentVisible}>
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

          <Show when={props.showTab}>
            <div class={styles.tab}>
              <InlineTextField
                size={'sm'}
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
        <div class={styles.content}>
          <div class={sprinkles({position: 'relative'})}>
            <div>{props.children}</div>
          </div>
        </div>
      </Show>
    </div>
  );
};
