import {Component, useContext} from 'solid-js';
import {StaticConfigurationContext} from './ConfigurationProvider';
import {CustomTheme} from '@codeimage/theme';
import {TerminalDefinitionMap} from '../types/terminal-def';
import {AppStaticConfiguration} from '../types/configuration';
import {LanguageDefinition} from '../types/language-def';

export function createConfiguration<
  V extends string,
  Themes extends readonly CustomTheme[],
  Locales extends readonly string[],
  Languages extends readonly LanguageDefinition[],
  TerminalThemes extends TerminalDefinitionMap<
    readonly string[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Component<any>
  >,
  Configuration extends AppStaticConfiguration<
    V,
    Themes,
    Locales,
    Languages,
    TerminalThemes
  > = AppStaticConfiguration<V, Themes, Locales, Languages, TerminalThemes>,
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
