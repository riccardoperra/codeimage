import type {StyleRule} from '@vanilla-extract/css';

type ThemeModeAttr<
  T extends string,
  NS extends string = never,
> = never extends NS
  ? `[data-codeimage-theme=${T}] &`
  : `[data-codeimage-theme=${T}] ${NS}`;

export type TypedThemeMode<
  T extends NonNullable<StyleRule['selectors']>,
  NS extends string = never,
> = {
  [K in keyof T & string as ThemeModeAttr<K, NS>]: T[K];
};

export function withThemeMode<
  T extends NonNullable<StyleRule['selectors']>,
  NS extends string = never,
>(themes: T, nestedSelector?: NS): TypedThemeMode<T, NS> {
  const suffix = nestedSelector ? `${nestedSelector}` : '&';

  return Object.entries(themes).reduce<NonNullable<StyleRule['selectors']>>(
    (acc, [themeKey, themeValue]) => {
      acc[`[data-codeimage-theme=${themeKey}] ${suffix}`] = themeValue;
      return acc;
    },
    {},
  ) as TypedThemeMode<T, NS>;
}
