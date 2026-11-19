import type {CustomTheme, TerminalTabsTheme} from '@codeimage/highlight';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import type {Accessor} from 'solid-js';
import {createMemo} from 'solid-js';

export interface TabThemeProps extends TerminalTabsTheme {
  shouldFallbackInactiveColor: boolean;
  darkMode: boolean;
}

export function createTabTheme(
  themeId: Accessor<string>,
  preloadedTheme?: Accessor<CustomTheme | undefined>,
): Accessor<TabThemeProps> {
  const {getThemeResource} = getThemeStore();

  return createMemo(() => {
    const theme = preloadedTheme?.() ?? getThemeResource(themeId())?.[0]();
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
  });
}
