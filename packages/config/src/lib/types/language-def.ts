import {Extension} from '@codemirror/state';
import type {Plugin as PrettierPlugin, BuiltInParserName} from 'prettier';

export interface PrettierPluginDefinition {
  name: string;
  parser: string | BuiltInParserName;
  plugin?: () => Promise<PrettierPlugin | PrettierPlugin[]>;
}

export interface ExtraLanguageDefinition {
  extension: () => Promise<Extension>;
  overrideParent: boolean;
}

export interface LanguageIconDefinition {
  name: string;
  extension: string;
  content: string | (() => Promise<typeof import('*.svg')>);
  matcher: RegExp;
  extraLanguage?: ExtraLanguageDefinition;
  prettier?: PrettierPluginDefinition;
}

export interface LanguageDefinition {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  readonly featured?: boolean;
  readonly plugin: () => Promise<Extension>;
  readonly icons: LanguageIconDefinition[];
  readonly prettier?: PrettierPluginDefinition | PrettierPluginDefinition[];
}
