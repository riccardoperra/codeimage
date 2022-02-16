import {Extension} from '@codemirror/state';

export interface CustomThemeProperties {
  /**
   * @description Label of theme box preview
   */
  label: string;
  /**
   * @description Background of theme box preview
   */
  previewBackground: string;
  /**
   * @description Enable/disable dark mode theme
   */
  darkMode: boolean;
}

export interface CustomTheme {
  id: string;
  editorTheme: Extension;
  properties: CustomThemeProperties;
}
