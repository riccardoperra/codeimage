import * as styles from './terminal.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {themeVars} from '../../theme/global.css';
import {TerminalState} from '../../state/terminal';
import clsx from 'clsx';
import {PropsWithChildren} from 'solid-js/types/render/component';
import {JSXElement} from 'solid-js';

export interface BaseTerminalProps
  extends PropsWithChildren,
    Omit<TerminalState, 'type'> {
  showTab: boolean;
  readonlyTab: boolean;
  onTabChange?: (tab: string) => void;
}

export interface TerminalHostProps extends BaseTerminalProps {
  theme: string;
}

export default function TerminalHost(props: TerminalHostProps): JSXElement {
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
}
