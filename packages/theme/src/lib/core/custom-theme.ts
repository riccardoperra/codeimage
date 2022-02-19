import type {Extension} from '@codemirror/state';

export interface TerminalThemeProperties {
  /**
   * @description Main background color of terminal
   */
  main: string;
  /**
   * description Base text color of terminal frame
   */
  text: string;
}

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
  /**
   * @description MacOsTerminal theme properties
   */
  terminal: TerminalThemeProperties;
}

export interface CustomTheme {
  id: string;
  editorTheme: Extension;
  properties: CustomThemeProperties;
}
