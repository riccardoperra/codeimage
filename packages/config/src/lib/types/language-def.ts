import {Extension} from '@codemirror/state';

export interface LanguageDefinition {
  id: string;
  label: string;
  plugin: () => Promise<Extension>;
}
