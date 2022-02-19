import {combine, devtools} from 'zustand/middleware';
import create from 'solid-zustand';

export interface GlobalUiState {
  themeMode: 'light' | 'dark';
}

const initialState: GlobalUiState = {
  themeMode: 'dark',
};

const store = combine(initialState, set => ({
  setThemeMode: (themeMode: GlobalUiState['themeMode']) =>
    set(() => ({themeMode})),
  toggleThemeMode: () =>
    set(({themeMode}) => ({
      themeMode: themeMode === 'light' ? 'dark' : 'light',
    })),
}));

export const useUIState = create(devtools(store, {name: 'ui'}));
