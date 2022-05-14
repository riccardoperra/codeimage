import {LanguageIconDefinition} from '@codeimage/config';
import {FadeInOutTransition, themeVars} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import clsx from 'clsx';
import {WithRef} from 'solid-headless/dist/types/utils/dynamic-prop';
import {ParentComponent} from 'solid-js';
import {TerminalState} from '../../state/terminal';
import * as styles from './terminal.css';
import {TerminalGlassReflection} from './TerminalGlassReflection';

export interface BaseTerminalProps
  extends Omit<TerminalState, 'type'>,
    WithRef<'div'> {
  showTab: boolean;
  readonlyTab: boolean;
  tabIcon?: LanguageIconDefinition['content'];
  onTabChange?: (tab: string) => void;
}

export interface TerminalHostProps extends BaseTerminalProps {
  theme: string;
}

export const TerminalHost: ParentComponent<TerminalHostProps> = props => {
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
      <FadeInOutTransition show={props.showGlassReflection}>
        <TerminalGlassReflection />
      </FadeInOutTransition>

      {props.children}
    </div>
  );
};
