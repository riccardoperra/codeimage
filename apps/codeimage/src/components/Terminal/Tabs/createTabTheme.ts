import {SUPPORTED_THEMES} from '@codeimage/config';
import {TerminalTabsTheme} from '@codeimage/theme';
import {CustomTheme} from '@codeimage/theme/src/lib/core';
import {Accessor, createMemo} from 'solid-js';

export interface TabThemeProps extends TerminalTabsTheme {
  readonly shouldFallbackInactiveColor: boolean;
}

export function createTabTheme(
  themeId: Accessor<string>,
): Accessor<TabThemeProps> {
  const themes = SUPPORTED_THEMES;

  const $theme = createMemo(() =>
    themeId() ? themes.find(({id}) => id === themeId()) : null,
  );

  return () => {
    const theme = $theme() as CustomTheme | null;
    if (!theme)
      return {
        shouldFallbackInactiveColor: true,
      };

    const {
      activeTabBackground = null,
      background = null,
      inactiveTabBackground = null,
      textColor = null,
    } = theme.properties?.terminal?.tabs || {};

    return {
      shouldFallbackInactiveColor: !inactiveTabBackground,
      background: background,
      textColor: textColor,
      activeTabBackground,
      inactiveTabBackground,
    };
  };
}
