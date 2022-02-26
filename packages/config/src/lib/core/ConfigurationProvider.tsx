import {createContext, JSXElement, PropsWithChildren} from 'solid-js';
import {AppStaticConfiguration} from '../types/configuration';
import {TerminalDefinitionMap} from '../types/terminal-def';
import {CustomTheme} from '@codeimage/theme';
import {LanguageDefinition} from '../types/language-def';

type BaseAppStaticConfiguration = AppStaticConfiguration<
  string,
  readonly CustomTheme[],
  readonly string[],
  readonly LanguageDefinition[],
  TerminalDefinitionMap<string[], unknown>
>;

export const StaticConfigurationContext =
  createContext<BaseAppStaticConfiguration>();

export function StaticConfigurationProvider<
  T extends BaseAppStaticConfiguration,
>(props: PropsWithChildren<{config: T}>): JSXElement {
  return (
    <StaticConfigurationContext.Provider value={props.config}>
      {props.children}
    </StaticConfigurationContext.Provider>
  );
}
