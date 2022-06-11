import {CustomTheme} from '@codeimage/highlight';
import {useContext} from 'solid-js';
import {AppStaticConfiguration} from '../types/configuration';
import {LanguageDefinition} from '../types/language-def';
import {StaticConfigurationContext} from './ConfigurationProvider';

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
>(configuration: Configuration): [Configuration, () => Configuration] {
  if (!configuration.version) {
    throw new Error('No version specified');
  }

  const useConfiguration = () => {
    const context = useContext(StaticConfigurationContext);

    if (!context) {
      throw new Error('Static configuration missing');
    }

    return context as unknown as Configuration;
  };

  return [configuration as Configuration, useConfiguration];
}
