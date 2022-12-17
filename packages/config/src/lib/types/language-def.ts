import {Extension} from '@codemirror/state';

export interface LanguageIconDefinition {
  name: string;
  extension: string;
  content: string | (() => Promise<typeof import('*.svg')>);
  matcher: RegExp;
  extraLanguage?: () => Promise<Extension>;
}

export interface LanguageDefinition {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  readonly plugin: () => Promise<Extension>;
  readonly icons: LanguageIconDefinition[];
}
