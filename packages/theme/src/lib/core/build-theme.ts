import {CustomTheme} from './custom-theme';

type CustomThemeFactoryResult<Type, FactoryResult> = CustomTheme &
  FactoryResult & {
    type: Type;
  };

export function createThemeFactory<
  ThemeFactoryResult extends CustomTheme,
  FactoryType extends string = string,
>(
  type: FactoryType,
  themeFactory: (theme: CustomTheme) => ThemeFactoryResult,
): (
  theme: ThemeFactoryResult,
) => Readonly<CustomThemeFactoryResult<FactoryType, ThemeFactoryResult>> {
  return theme => {
    const factoryResult = themeFactory(theme) as CustomThemeFactoryResult<
      FactoryType,
      ThemeFactoryResult
    >;
    factoryResult.type = type;

    return factoryResult as CustomThemeFactoryResult<
      FactoryType,
      ThemeFactoryResult
    >;
  };
}

export const createTheme = createThemeFactory('@codeimage/base-theme', _ => _);
