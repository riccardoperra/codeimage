import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {elfAutoSettersFactory} from '@core/store/elf-auto-setters-factory';
import {createStore, setProp, withProps} from '@ngneat/elf';
import {localStorageStrategy, persistState} from '@ngneat/elf-persist-state';
import {distinctUntilChanged} from 'rxjs';
import {createEffect, createRoot, createSignal, on} from 'solid-js';
import shallow from '../core/helpers/shallow';

export interface TerminalState {
  readonly showHeader: boolean;
  readonly type: string;
  readonly tabName: string | null;
  readonly accentVisible: boolean;
  readonly shadow: string;
  readonly background: string;
  readonly textColor: string;
  // TODO: this state should be removed. This is a slice of selected highlight!!
  readonly darkMode: boolean;
  readonly showWatermark: boolean;
  readonly showGlassReflection: boolean;
  readonly opacity: number;
  readonly alternativeTheme: boolean;
}

const terminalName =
  AVAILABLE_TERMINAL_THEMES.entries[AVAILABLE_TERMINAL_THEMES.keys[0]].name;

// TODO move
export function getInitialTerminalState(): TerminalState {
  return {
    showHeader: true,
    type: terminalName,
    tabName: 'index.ts',
    shadow: TERMINAL_SHADOWS.bottom,
    accentVisible: true,
    // lazy initialization
    background: '',
    // lazy initialization
    textColor: '',
    darkMode: true,
    showWatermark: true,
    showGlassReflection: false,
    opacity: 100,
    alternativeTheme: false,
  };
}

const initialState: TerminalState = getInitialTerminalState();

const store = createStore(
  {name: 'terminal'},
  withProps<TerminalState>(initialState),
);

export const updateTerminalStore = store.update.bind(store);

export const [readyTerminalState, setReadyTerminalState] = createSignal(false);

createRoot(() => {
  const registry = getThemeStore();
  const [resource] = registry.getThemeResource('vsCodeDarkTheme');
  createEffect(
    on(resource, resource => {
      if (resource) {
        store.update(
          !store.state.background
            ? setProp('background', resource.properties.terminal.main)
            : s => s,
          !store.state.textColor
            ? setProp('textColor', resource.properties.terminal.text)
            : s => s,
        );
        setReadyTerminalState(true);
        persistState(store, {
          storage: localStorageStrategy,
          key: '@store/terminal',
          preStoreInit: store => {
            const shadows = TERMINAL_SHADOWS;
            if (!Object.values<string>(shadows).includes(store.shadow)) {
              return {...store, shadow: shadows.bottom};
            }
            return store;
          },
        });
      }
    }),
  );
});

export const {
  setShadow,
  setAccentVisible,
  setDarkMode,
  setShowHeader,
  setShowWatermark,
  setTextColor,
  setType,
  setBackground,
  setShowGlassReflection,
  setOpacity,
  setAlternativeTheme,
} = elfAutoSettersFactory(store);

export function toggleShowHeader() {
  store.update(setProp('showHeader', showHeader => !showHeader));
}

export function toggleWatermark() {
  store.update(setProp('showWatermark', showWatermark => !showWatermark));
}

export const terminal$ = store.pipe(distinctUntilChanged(shallow));
