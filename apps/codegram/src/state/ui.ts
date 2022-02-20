import {combine, devtools} from 'zustand/middleware';
import create from 'solid-zustand';

export interface GlobalUiState {
  themeMode: 'light' | 'dark';
  locale: string;
}

const initialState: GlobalUiState = {
  themeMode: 'dark',
  locale: 'en',
};

const store = combine(initialState, set => ({
  setLocale: (locale: string) => set(() => ({locale})),
  setThemeMode: (themeMode: GlobalUiState['themeMode']) =>
    set(() => ({themeMode})),
  toggleThemeMode: () =>
    set(({themeMode}) => ({
      themeMode: themeMode === 'light' ? 'dark' : 'light',
    })),
}));

export const useUIState = create(devtools(store, {name: 'ui'}));
