import {combine, devtools} from 'zustand/middleware';
import create from 'solid-zustand';
import {themeVars} from '../theme/global.css';
import {staticConfiguration} from '../core/configuration';

export interface TerminalState {
  readonly showHeader: boolean;
  readonly type: string;
  readonly tabName: string | null;
  readonly accentVisible: boolean;
  readonly shadow: string;
  readonly background: string;
  readonly textColor: string;
  readonly darkMode: boolean;
}

const initialState: TerminalState = {
  showHeader: true,
  type: staticConfiguration.terminalThemes.entries[
    staticConfiguration.terminalThemes.keys[0]
  ].name,
  tabName: null,
  shadow: themeVars.boxShadow.lg,
  accentVisible: true,
  background: staticConfiguration.themes[0].properties.terminal.main,
  textColor: staticConfiguration.themes[0].properties.terminal.text,
  darkMode: staticConfiguration.themes[0].properties.darkMode,
};

const store = combine(initialState, set => ({
  setShadow: (shadow: string) => set(() => ({shadow})),
  setAccentVisible: (accentVisible: boolean) => set(() => ({accentVisible})),
  setBackground: (background: string) => set(() => ({background})),
  setTextColor: (textColor: string) => set(() => ({textColor})),
  setDarkMode: (darkMode: boolean) => set(() => ({darkMode})),
  setTabName: (tabName: string) => set(() => ({tabName})),
  setShowHeader: (showHeader: boolean) => set(() => ({showHeader})),
  setType: (type: string) => set(() => ({type})),
}));

export const useTerminalState = create(devtools(store, {name: 'terminal'}));
