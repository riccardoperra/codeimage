import {CustomTheme} from '@codeimage/theme';
import {Component} from 'solid-js';
import {BaseTerminalProps} from '../../components/Terminal/TerminalHost';

interface TerminalDefinition<T> {
  name: T;
  component: Component<BaseTerminalProps>;
}

type TerminalDefinitionMap<T extends string> = {
  keys: readonly [...T[]];
  entries: Record<T, TerminalDefinition<string>>;
};

// TODO: create helper fn
export interface AppStaticConfiguration {
  version: string;
  themes: CustomTheme[];
  locales: string[];
  terminalThemes: TerminalDefinitionMap<string>;
}
