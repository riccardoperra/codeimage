import type {Extension} from '@codemirror/state';

export interface TerminalTabsTheme {
  background?: string;
  activeTabBackground?: string;
  inactiveTabBackground?: string;
  textColor?: string;
}

export interface TerminalThemeProperties {
  /**
   * @description Main background color of terminal
   */
  main: string;
  /**
   * description Base text color of terminal frame
   */
  text: string;
  /**
   *
   */
  tabs?: TerminalTabsTheme;
}

export interface CustomThemeProperties {
  /**
   * @description Label of highlight box preview
   */
  label: string;
  /**
   * @description Background of highlight box preview
   */
  previewBackground: string;
  /**
   * @description Enable/disable dark mode highlight
   */
  darkMode: boolean;
  /**
   * @description MacOsTerminal highlight properties
   */
  terminal: TerminalThemeProperties;
}

export interface CustomTheme {
  /**
   * Custom highlight identifier
   */
  id: string;
  /**
   * Custom highlight editor base highlight extension
   */
  editorTheme: Extension;
  /**
   * Custom highlight properties
   */
  properties: CustomThemeProperties;
}
