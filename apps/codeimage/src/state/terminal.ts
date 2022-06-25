import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {createStore, setProp, withProps} from '@ngneat/elf';
import {localStorageStrategy, persistState} from '@ngneat/elf-persist-state';
import {distinctUntilChanged} from 'rxjs';
import {createEffect, createRoot, createSignal, on} from 'solid-js';
import {windowsShadows} from '../components/Terminal/WindowsTerminal/WindowsShadows';
import {AVAILABLE_TERMINAL_THEMES} from '../core/configuration/terminal-themes';
import shallow from '../core/helpers/shallow';
import {elfAutoSettersFactory} from '../core/store/elf-auto-setters-factory';

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

const initialState: TerminalState = {
  showHeader: true,
  type: terminalName,
  tabName: 'index.ts',
  shadow: windowsShadows.bottom,
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
