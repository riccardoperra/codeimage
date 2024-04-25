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
import {getFrameState} from '@codeimage/store/editor/frame';

export interface BaseTerminalProps
  extends Omit<TerminalState, 'type'>,
    WithRef<'div'> {
  showTab: boolean;
  readonlyTab: boolean;
  preview?: boolean;
  tabIcon?: LanguageIconDefinition['content'];
  onTabChange?: (tab: string) => void;
  lite?: boolean;
  themeId: string;
}

export interface TerminalHostProps extends BaseTerminalProps {
  themeClass: string;
  themeId: string;
  style?: Record<string, any>;
}

export const TerminalHost: FlowComponent<TerminalHostProps> = props => {
  const tabTheme = createTabTheme(() => props.themeId);
  const darkMode = () => tabTheme().darkMode;
  const frameState = getFrameState().store;

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
      data-lite={props.lite}
      data-preview={props.preview || ''}
      data-theme-mode={darkMode() ? 'dark' : 'light'}
      data-header-visible={props.showHeader}
      data-accent-header={props.accentVisible && !props.alternativeTheme}
      data-fallback-inactive-tab={tabTheme()?.shouldFallbackInactiveColor}
      data-custom-border={props.borderType === 'glass' ? 'glass' : null}
      style={assignInlineVars({
        [styles.terminalVars.headerBackgroundColor]:
          tabTheme()?.background ?? '',
        [styles.terminalVars.backgroundColor]: background(),
        [styles.terminalVars.textColor]: props.textColor,
        [styles.terminalVars.boxShadow]:
          props.shadow && props.shadow !== 'unset'
            ? props.shadow
            : '0 0 0 0 rgb(0, 0, 0, 0)',
        [styles.terminalVars.tabTextColor]: tabTheme()?.textColor ?? '',
        [styles.terminalVars.tabAccentActiveBackground]:
          tabTheme().activeTabBackground ?? '',
        [styles.terminalVars.tabAccentInactiveBackground]:
          tabTheme().inactiveTabBackground ?? '',
        [styles.terminalVars.radius]: frameState.padding === 0 ? 0 : undefined,
        ...(props.style ?? {}),
      })}
    >
      <FadeInOutTransition show={props.showGlassReflection}>
        <TerminalGlassReflection />
      </FadeInOutTransition>

      {props.children}
    </div>
  );
};
