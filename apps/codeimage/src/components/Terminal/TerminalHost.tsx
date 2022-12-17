import {LanguageIconDefinition} from '@codeimage/config';
import {TerminalState} from '@codeimage/store/editor/model';
import {FadeInOutTransition} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import clsx from 'clsx';
import {WithRef} from 'solid-headless/dist/types/utils/dynamic-prop';
import {FlowComponent} from 'solid-js';
import {TerminalGlassReflection} from './GlassReflection/TerminalGlassReflection';
import {createTabTheme} from './Tabs/createTabTheme';
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
  const tabTheme = createTabTheme(() => props.themeId);
  const darkMode = () => tabTheme().darkMode;

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

  return (
    <div
      class={clsx(styles.wrapper, props.themeClass)}
      data-theme-mode={darkMode() ? 'dark' : 'light'}
      data-fallback-inactive-tab={tabTheme()?.shouldFallbackInactiveColor}
      style={assignInlineVars({
        [styles.terminalVars.headerBackgroundColor]:
          tabTheme()?.background ?? '',
        [styles.terminalVars.backgroundColor]: background(),
        [styles.terminalVars.textColor]: props.textColor,
        [styles.terminalVars.boxShadow]: props.shadow ?? 'unset',
        [styles.terminalVars.tabTextColor]: tabTheme()?.textColor ?? '',
        [styles.terminalVars.tabAccentActiveBackground]:
          tabTheme().activeTabBackground ?? '',
        [styles.terminalVars.tabAccentInactiveBackground]:
          tabTheme().inactiveTabBackground ?? '',
      })}
    >
      <FadeInOutTransition show={props.showGlassReflection}>
        <TerminalGlassReflection />
      </FadeInOutTransition>

      {props.children}
    </div>
  );
};
