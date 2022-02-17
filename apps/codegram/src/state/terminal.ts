import {combine, devtools} from 'zustand/middleware';
import create from 'solid-zustand';
import {themeVars} from '../theme/global.css';

export interface TerminalState {
  accentVisible: boolean;
  shadow: string;
  background: string;
  textColor: string;
  darkMode: boolean;
}

const initialState: TerminalState = {
  shadow: themeVars.boxShadow.lg,
  accentVisible: true,
  background: '#ffffff',
  textColor: '#000000',
  darkMode: false,
};

const store = combine(initialState, set => ({
  setShadow: (shadow: string) => set(() => ({shadow})),
  setAccentVisible: (accentVisible: boolean) => set(() => ({accentVisible})),
  setBackground: (background: string) => set(() => ({background})),
  setTextColor: (textColor: string) => set(() => ({textColor})),
  setDarkMode: (darkMode: boolean) => set(() => ({darkMode})),
}));

export const useTerminalState = create(devtools(store, {name: 'terminal'}));
