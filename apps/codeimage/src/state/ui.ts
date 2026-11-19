import {provideAppState} from '@codeimage/store/index';
import {
  readLocalState,
  withLocalStorage,
} from '@codeimage/store/plugins/local-storage';
import {createPrefersDark} from '@solid-primitives/media';
import {createMemo} from 'solid-js';
import type {Store} from 'statebuilder';
import {defineStore, createPlugin} from 'statebuilder';

type Theme = 'light' | 'dark';

export interface GlobalUiState {
  themeMode: Theme | 'system';
  locale: string;
}

const initialState: GlobalUiState = {
  themeMode: 'dark',
  locale: 'en',
};

const withUiThemeModeListener = createPlugin.typed<Store<GlobalUiState>>()(
  store => {
    const dark = createPrefersDark();

    return {
      currentTheme: createMemo<Theme>(() => {
        if (store.get.themeMode !== 'system') return store.get.themeMode;
        return dark() ? 'dark' : 'light';
      }),
    };
  },
  {name: 'withUiThemeModeListener'},
);

export const $uiStore = defineStore(() =>
  readLocalState('@store/ui', initialState),
)
  .extend(withLocalStorage<GlobalUiState>('@store/ui'))
  .extend(withUiThemeModeListener)
  .extend(store => ({
    setLocale(locale: string): void {
      store.set(state => {
        state.locale = locale;
      });
    },
    setThemeMode(themeMode: GlobalUiState['themeMode']): void {
      store.set(state => {
        state.themeMode = themeMode;
      });
    },
    toggleThemeMode(): void {
      store.set(state => {
        state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
      });
    },
    invertedThemeMode() {
      return store.currentTheme() === 'light' ? 'dark' : 'light';
    },
  }));

function createUiStore() {
  return provideAppState($uiStore);
}

let uiStore: ReturnType<typeof createUiStore> | undefined;

export function getUiStore() {
  return (uiStore ??= createUiStore());
}
