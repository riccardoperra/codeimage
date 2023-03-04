import {Extension} from '@codemirror/state';
import type {Plugin as PrettierPlugin, BuiltInParserName} from 'prettier';

interface PrettierPluginDefinition {
  parser: string | BuiltInParserName;
  plugin?: () => Promise<PrettierPlugin | PrettierPlugin[]>;
}

export interface LanguageIconDefinition {
  name: string;
  extension: string;
  content: string | (() => Promise<typeof import('*.svg')>);
  matcher: RegExp;
  extraLanguage?: () => Promise<Extension>;
  prettier?: PrettierPluginDefinition;
}

export interface LanguageDefinition {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  readonly featured?: boolean;
  readonly plugin: () => Promise<Extension>;
  readonly icons: LanguageIconDefinition[];
  readonly prettier?: PrettierPluginDefinition;
}
