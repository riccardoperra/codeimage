import {StyleRule} from '@vanilla-extract/css';

type Selectors = StyleRule['selectors'] & Record<string, string>;

export type TypedThemeMode = Record<string, any>;

export function withThemeMode(
  themes: Record<string, Selectors>,
  nestedSelector?: string,
): TypedThemeMode {
  const suffix = nestedSelector ? `${nestedSelector}` : '&';

  return Object.entries(themes).reduce<Record<string, Selectors>>(
    (acc, [themeKey, themeValue]) => {
      acc[`[data-codeimage-theme=${themeKey}] ${suffix}`] = themeValue;
      return acc;
    },
    {},
  );
}
