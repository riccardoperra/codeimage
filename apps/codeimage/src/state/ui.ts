import {createPluggableStore} from '../core/store/create-pluggable-store';
import {withLocalStorage} from '../core/store/persist-plugin';

export interface GlobalUiState {
  themeMode: 'light' | 'dark';
  locale: string;
}

const initialState: GlobalUiState = {
  themeMode: 'dark',
  locale: 'en',
};

export const [uiStore, setUiStore] = createPluggableStore(
  initialState,
  withLocalStorage({name: '@store/ui'}),
);

export function getInvertedThemeMode() {
  return uiStore.themeMode === 'light' ? 'dark' : 'light';
}

export function setLocale(locale: string): void {
  setUiStore('locale', () => locale);
}

export function setThemeMode(themeMode: 'light' | 'dark'): void {
  setUiStore('themeMode', () => themeMode);
}

export function toggleThemeMode(): void {
  setUiStore('themeMode', mode => (mode === 'light' ? 'dark' : 'light'));
}
