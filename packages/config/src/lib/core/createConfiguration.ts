import {type CustomTheme} from '@codeimage/highlight';
import {AppStaticConfiguration} from '../types/configuration';
import {LanguageDefinition} from '../types/language-def';

export function createConfiguration<
  V extends string,
  Themes extends readonly CustomTheme[],
  Locales extends readonly string[],
  Languages extends readonly LanguageDefinition[],
  Configuration extends AppStaticConfiguration<
    V,
    Themes,
    Locales,
    Languages
  > = AppStaticConfiguration<V, Themes, Locales, Languages>,
>(configuration: Configuration): [Configuration] {
  if (!configuration.version) {
    throw new Error('No version specified');
  }

  return [configuration as Configuration];
}
