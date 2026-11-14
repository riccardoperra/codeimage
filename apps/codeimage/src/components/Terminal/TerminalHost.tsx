import type {LanguageIconDefinition} from '@codeimage/config';
import type {TerminalState} from '@codeimage/store/editor/model';
import {FadeInOutTransition} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import clsx from 'clsx';
import type {FlowComponent, Ref} from 'solid-js';
import {TerminalGlassReflection} from './GlassReflection/TerminalGlassReflection';
import {createTabTheme} from './Tabs/createTabTheme';
import * as styles from './terminal.css';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {createMemo} from 'solid-js';
import {createWindowPalette} from './windowPalette';
import {windowVars} from './windowPalette.css';
import {getFrameState} from '@codeimage/store/editor/frame';

export interface BaseTerminalProps extends Omit<
  TerminalState,
  'type' | 'surface'
> {
  surface?: TerminalState['surface'];
  ref?: Ref<HTMLDivElement>;
  showTab: boolean;
  readonlyTab: boolean;
  preview?: boolean;
  tabIcon?: LanguageIconDefinition['content'];
  onTabChange?: (tab: string) => void;
  lite?: boolean;
  showOnlyActiveTab?: boolean;
  activeTabId?: string;
  themeId: string;
}

export interface TerminalHostProps extends BaseTerminalProps {
  themeClass: string;
  windowStyle?: 'card' | 'editor' | 'shell';
  themeId: string;
  // oxlint-disable-next-line typescript/no-explicit-any
  style?: Record<string, any>;
}

export const TerminalHost: FlowComponent<TerminalHostProps> = props => {
  const tabTheme = createTabTheme(() => props.themeId);
  const themes = getThemeStore();
  const palette = createMemo(() => {
    const theme = themes
      .themeArray()
      .find(resource => resource()?.id === props.themeId)?.();
    return createWindowPalette({
      background: props.background,
      text: props.textColor,
      accent:
        theme?.properties.terminal.accent ??
        theme?.properties.terminal.text ??
        props.textColor,
    });
  });
  const paletteVars = () =>
    Object.fromEntries(
      Object.entries(windowVars).map(([key, variable]) => [
        variable,
        palette()[key as keyof typeof windowVars],
      ]),
    );
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
      data-custom-border={
        props.borderType === 'glass' || props.borderType === 'hairline'
          ? props.borderType
          : null
      }
      data-window-style={props.windowStyle}
      data-surface={props.surface ?? 'solid'}
      style={assignInlineVars({
        ...paletteVars(),
        [windowVars.background]: background(),
        [styles.terminalVars.headerBackgroundColor]: tabTheme()?.background,
        [styles.terminalVars.backgroundColor]: background(),
        [styles.terminalVars.textColor]: props.textColor,
        [styles.terminalVars.boxShadow]:
          props.shadow && props.shadow !== 'unset'
            ? props.shadow
            : '0 0 0 0 rgb(0, 0, 0, 0)',
        [styles.terminalVars.tabTextColor]: tabTheme()?.textColor,
        [styles.terminalVars.tabAccentActiveBackground]:
          tabTheme().activeTabBackground,
        [styles.terminalVars.tabAccentInactiveBackground]:
          tabTheme().inactiveTabBackground,
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
