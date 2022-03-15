import type {Extension} from '@codemirror/state';
import {ExternalStylesheetTheme} from './build-external-stylesheet';

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
  /**
   * Custom theme identifier
   */
  id: string;
  /**
   * Custom theme editor base theme extension
   */
  editorTheme: Extension;
  /**
   * Custom theme properties
   */
  properties: CustomThemeProperties;
  /**
   *
   */
  externalStylesheet?: ExternalStylesheetTheme;
}
