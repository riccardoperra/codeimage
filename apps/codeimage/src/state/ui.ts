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

export function setLocale(locale: string): void {
  setUiStore('locale', () => locale);
}

export function toggleThemeMode(): void {
  setUiStore('themeMode', mode => (mode === 'light' ? 'dark' : 'light'));
}
