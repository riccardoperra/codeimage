import {CustomTheme, TerminalTabsTheme} from '@codeimage/highlight';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {Accessor, createMemo} from 'solid-js';

export interface TabThemeProps extends TerminalTabsTheme {
  shouldFallbackInactiveColor: boolean;
  darkMode: boolean;
}

export function createTabTheme(
  themeId: Accessor<string>,
): Accessor<TabThemeProps> {
  const {themeArray: themes} = getThemeStore();

  const $theme = createMemo(() =>
    themeId()
      ? themes().find(resource => resource()?.id === themeId())?.()
      : null,
  );

  // eslint-disable-next-line solid/reactivity
  return () => {
    const theme = $theme() as CustomTheme | null;
    if (!theme)
      return {
        shouldFallbackInactiveColor: true,
        darkMode: true,
      };

    const {activeTabBackground, background, inactiveTabBackground, textColor} =
      theme.properties?.terminal?.tabs || {};

    return {
      shouldFallbackInactiveColor: !inactiveTabBackground,
      background: background,
      textColor: textColor,
      activeTabBackground,
      inactiveTabBackground,
      darkMode: theme.properties.darkMode,
    };
  };
}
