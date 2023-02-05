import {provideAppState} from '@codeimage/store/index';
import {withLocalStorage} from '@codeimage/store/plugins/local-storage';
import {createEffect, createSignal, on} from 'solid-js';
import {defineStore, makePlugin, Store} from 'statebuilder';

type Theme = 'light' | 'dark';

export interface GlobalUiState {
  themeMode: Theme | 'system';
  locale: string;
}

const initialState: GlobalUiState = {
  themeMode: 'dark',
  locale: 'en',
};

const withUiThemeModeListener = makePlugin(
  (store: Store<GlobalUiState>) => {
    const [theme, setTheme] = createSignal<Theme>();

    function getPreferredColorScheme(): Theme {
      if (window.matchMedia) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        } else {
          return 'light';
        }
      }
      return 'light';
    }

    function updateThemeMode(theme: GlobalUiState['themeMode']): void {
      if (theme === 'system') {
        setTheme(getPreferredColorScheme());
      } else {
        setTheme(theme);
      }
    }

    function updateColorScheme(): void {
      updateThemeMode(store.get.themeMode);
    }

    createEffect(
      on(
        () => store.get.themeMode,
        theme => {
          if ('matchMedia' in window) {
            if (theme === 'system') {
              window
                .matchMedia(`(prefers-color-scheme: dark)`)
                .addEventListener('change', updateColorScheme);
            } else {
              window
                .matchMedia(`(prefers-color-scheme: dark)`)
                .removeEventListener('change', updateColorScheme);
            }
          }
          updateThemeMode(theme);
        },
      ),
    );

    return {
      currentTheme: theme,
    };
  },
  {name: 'withUiThemeModeListener'},
);

export const $uiStore = defineStore(() => initialState)
  .extend(withLocalStorage('@store/ui'))
  .extend(withUiThemeModeListener)
  .extend(store => {
    return {
      setLocale(locale: string): void {
        store.set('locale', () => locale);
      },
      setThemeMode(themeMode: GlobalUiState['themeMode']): void {
        store.set('themeMode', themeMode);
      },
      toggleThemeMode(): void {
        store.set('themeMode', mode => (mode === 'light' ? 'dark' : 'light'));
      },
      invertedThemeMode() {
        return store.currentTheme() === 'light' ? 'dark' : 'light';
      },
    };
  });

export function getUiStore() {
  return provideAppState($uiStore);
}
