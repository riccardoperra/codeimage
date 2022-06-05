import {LanguageIconDefinition} from '@codeimage/config';
import {FadeInOutTransition, themeVars} from '@codeimage/ui';
import {SUPPORTED_THEMES_DICTIONARY} from '@core/configuration';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import clsx from 'clsx';
import {WithRef} from 'solid-headless/dist/types/utils/dynamic-prop';
import {FlowComponent} from 'solid-js';
import {TerminalState} from '../../state/terminal';
import {TerminalGlassReflection} from './GlassReflection/TerminalGlassReflection';
import * as styles from './terminal.css';

export interface BaseTerminalProps
  extends Omit<TerminalState, 'type'>,
    WithRef<'div'> {
  showTab: boolean;
  readonlyTab: boolean;
  tabIcon?: LanguageIconDefinition['content'];
  onTabChange?: (tab: string) => void;
  themeId: string;
}

export interface TerminalHostProps extends BaseTerminalProps {
  themeClass: string;
  themeId: string;
}

export const TerminalHost: FlowComponent<TerminalHostProps> = props => {
  const background = () => {
    if (props.alternativeTheme) {
      return `rgba(${styles.terminalVars.headerColor}, .70)`;
    }
    const opacity = (props.opacity ?? 100) / 100;
    if (props.opacity !== 100) {
      return `rgba(0,0,0, ${opacity})`;
    }
    return props.background;
  };

  const themeConfiguration = () => {
    return SUPPORTED_THEMES_DICTIONARY[props.themeId];
  };

  return (
    <div
      class={clsx(styles.wrapper, props.themeClass)}
      data-theme-mode={props.darkMode ? 'dark' : 'light'}
      style={assignInlineVars({
        [styles.terminalVars.headerBackgroundColor]:
          themeConfiguration()?.properties?.terminal.tabs?.background ?? null,
        [styles.terminalVars.backgroundColor]: background(),
        [styles.terminalVars.textColor]: props.textColor,
        [styles.terminalVars.boxShadow]: props.shadow ?? themeVars.boxShadow.lg,
        [styles.terminalVars.tabAccentActiveBackground]:
          themeConfiguration()?.properties?.terminal?.tabs
            ?.activeTabBackground ?? null,
        [styles.terminalVars.tabAccentInactiveBackground]:
          themeConfiguration()?.properties?.terminal?.tabs
            ?.inactiveTabBackground ?? null,
      })}
    >
      <FadeInOutTransition show={props.showGlassReflection}>
        <TerminalGlassReflection />
      </FadeInOutTransition>

      {props.children}
    </div>
  );
};
