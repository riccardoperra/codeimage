import * as styles from './terminal.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {themeVars} from '../../theme/global.css';
import {Component} from 'solid-js';
import {TerminalState} from '../../state/terminal';
import clsx from 'clsx';

export interface BaseTerminalProps extends Omit<TerminalState, 'type'> {
  theme: string;
  showTab: boolean;
  onTabChange?: (tab: string) => void;
}

export const TerminalHost: Component<BaseTerminalProps> = props => {
  return (
    <div
      class={clsx(styles.wrapper, props.theme)}
      data-theme-mode={props.darkMode ? 'dark' : 'light'}
      style={assignInlineVars({
        [styles.terminalVars.backgroundColor]: props.background,
        [styles.terminalVars.textColor]: props.textColor,
        [styles.terminalVars.boxShadow]: props.shadow ?? themeVars.boxShadow.lg,
      })}
    >
      {props.children}
    </div>
  );
};
