import {LanguageDefinition} from './language-def';
import {TerminalDefinitionMap} from './terminal-def';
import {CustomTheme} from '@codeimage/theme';

export interface AppStaticConfiguration<
  V extends string,
  Themes extends readonly CustomTheme[],
  Locales extends readonly string[],
  Languages extends readonly LanguageDefinition[],
  TerminalThemes extends TerminalDefinitionMap<readonly string[], unknown>,
> {
  readonly version: V;
  readonly themes: Themes;
  readonly locales: Locales;
  readonly languages: Languages;
  readonly terminalThemes: TerminalThemes;
}
