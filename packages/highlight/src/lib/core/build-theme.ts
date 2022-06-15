import {CustomTheme} from './custom-theme';

type CustomThemeFactoryResult<Type, FactoryResult> = Omit<
  CustomTheme,
  keyof FactoryResult | 'type'
> &
  FactoryResult & {
    type: Type;
  };

export function createThemeFactory<
  FactoryArgs extends unknown[],
  FactoryType extends string,
  ThemeFactoryResult extends CustomTheme,
>(
  type: FactoryType,
  themeFactory: (...args: [...FactoryArgs]) => ThemeFactoryResult,
): (
  ...args: [...FactoryArgs]
) => CustomThemeFactoryResult<FactoryType, ThemeFactoryResult> {
  return (
    ...args: [...FactoryArgs]
  ): CustomThemeFactoryResult<FactoryType, ThemeFactoryResult> => {
    const factoryResult = themeFactory(...args) as CustomThemeFactoryResult<
      FactoryType,
      ThemeFactoryResult
    >;
    factoryResult.type = type;
    return factoryResult;
  };
}

export const createTheme = createThemeFactory(
  '@codeimage/base-theme',
  <T extends CustomTheme>(_: T): T => _,
);
