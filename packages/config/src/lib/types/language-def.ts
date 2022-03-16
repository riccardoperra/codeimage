import {Extension} from '@codemirror/state';

interface LanguageIconDefinition {
  name: string;
  src: string;
  matcher: RegExp;
}

export interface LanguageDefinition {
  readonly id: string;
  readonly label: string;
  readonly plugin: () => Promise<Extension>;
  readonly icons: LanguageIconDefinition[];
}
