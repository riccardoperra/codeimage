import {CustomTheme} from '@codeimage/theme';
import {Component} from 'solid-js';
import {BaseTerminalProps} from '../../components/Terminal/TerminalHost';
import {Extension} from '@codemirror/state';

interface TerminalDefinition<T> {
  name: T;
  component: Component<BaseTerminalProps>;
}

export interface LanguageDefinition {
  id: string;
  label: string;
  plugin: () => Promise<Extension>;
}

type TerminalDefinitionMap<T extends string> = {
  keys: readonly [...T[]];
  entries: Record<T, TerminalDefinition<string>>;
};

// TODO: create helper fn
export interface AppStaticConfiguration {
  readonly version: string;
  readonly themes: CustomTheme[];
  readonly locales: string[];
  readonly languages: readonly LanguageDefinition[];
  readonly terminalThemes: TerminalDefinitionMap<string>;
}
