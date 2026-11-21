import type {AnimationHeader} from '@core/animation/model';
import type {LanguageIconDefinition} from '@codeimage/config';
import type {CustomTheme} from '@codeimage/highlight';
import type {TerminalState} from '@codeimage/store/editor/model';
import {FadeInOutTransition} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import clsx from 'clsx';
import type {FlowComponent, Ref} from 'solid-js';
import {TerminalGlassReflection} from './GlassReflection/TerminalGlassReflection';
import {createTabTheme} from './Tabs/createTabTheme';
import * as styles from './terminal.css';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {createMemo, Show} from 'solid-js';
import {createWindowPalette} from './windowPalette';
import {windowVars} from './windowPalette.css';
import {getFrameState} from '@codeimage/store/editor/frame';
import {useWatermarkPart} from '../../core/watermark/scope';

export interface BaseTerminalProps extends Omit<
  TerminalState,
  'type' | 'surface'
> {
  surface?: TerminalState['surface'];
  ref?: Ref<HTMLDivElement>;
  showTab: boolean;
  title?: string;
  headerMode?: AnimationHeader['mode'];
  readonlyTab: boolean;
  fixedTabs?: boolean;
  preview?: boolean;
  tabIcon?: LanguageIconDefinition['content'];
  onTabChange?: (tab: string) => void;
  lite?: boolean;
  showOnlyActiveTab?: boolean;
  activeTabId?: string;
  themeId: string;
  theme?: CustomTheme;
}

export interface TerminalHostProps extends BaseTerminalProps {
  themeClass: string;
  windowStyle?: 'card' | 'editor' | 'shell';
  themeId: string;
  // oxlint-disable-next-line typescript/no-explicit-any
  style?: Record<string, any>;
}

export const TerminalHost: FlowComponent<TerminalHostProps> = props => {
  const themes = getThemeStore();
  const theme = () =>
    props.theme ?? themes.getThemeResource(props.themeId)?.[0]();
  const tabTheme = createTabTheme(
    () => props.themeId,
    () => props.theme,
  );
  const palette = createMemo(() => {
    const terminal = theme()?.properties.terminal;
    return createWindowPalette({
      background: props.background,
      text: props.textColor,
      accent: terminal?.accent ?? terminal?.text ?? props.textColor,
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
  const windowRef = useWatermarkPart('window');

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
      ref={windowRef}
      class={clsx(styles.wrapper, props.themeClass)}
      data-lite={props.lite === undefined ? undefined : String(props.lite)}
      data-preview={props.preview ? 'true' : ''}
      data-codeimage-frame-mode={darkMode() ? 'dark' : 'light'}
      data-header-visible={String(props.showHeader)}
      data-accent-header={String(
        props.accentVisible && !props.alternativeTheme,
      )}
      data-fallback-inactive-tab={String(
        tabTheme().shouldFallbackInactiveColor,
      )}
      data-custom-border={
        props.borderType === 'glass' || props.borderType === 'hairline'
          ? props.borderType
          : null
      }
      data-window-style={props.windowStyle}
      data-surface={props.surface ?? 'solid'}
      style={assignInlineVars({
        ...paletteVars(),
        // A tab painting a translucent window's fill again would stack it
        // into a darker patch, so it lets the window show through instead.
        [windowVars.background]:
          background() === props.background ? background() : 'transparent',
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

      <Show when={props.surface === 'wash'}>
        <div class={styles.wash} />
      </Show>
    </div>
  );
};
