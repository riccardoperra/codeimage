import {LanguageDefinition} from './language-def';
import {TerminalDefinitionMap} from './terminal-def';
import {CustomTheme} from '@codeimage/theme';

export interface AppStaticConfiguration {
  readonly version: string;
  readonly themes: readonly CustomTheme[];
  readonly locales: readonly string[];
  readonly languages: readonly LanguageDefinition[];
  readonly terminalThemes: TerminalDefinitionMap<string, unknown>;
}
