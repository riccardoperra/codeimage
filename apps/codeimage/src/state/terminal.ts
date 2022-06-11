import {themeVars} from '@codeimage/ui';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {elfAutoSettersFactory} from '@core/store/elf-auto-setters-factory';
import {createStore, setProp, withProps} from '@ngneat/elf';
import {localStorageStrategy, persistState} from '@ngneat/elf-persist-state';
import {distinctUntilChanged} from 'rxjs';
import shallow from '../core/helpers/shallow';

export interface TerminalState {
  readonly showHeader: boolean;
  readonly type: string;
  readonly tabName: string | null;
  readonly accentVisible: boolean;
  readonly shadow: string;
  readonly background: string;
  readonly textColor: string;
  // TODO: this state should be removed. This is a slice of selected theme!!
  readonly darkMode: boolean;
  readonly showWatermark: boolean;
  readonly showGlassReflection: boolean;
  readonly opacity: number;
  readonly alternativeTheme: boolean;
}

const initialState: TerminalState = {
  showHeader: true,
  type: AVAILABLE_TERMINAL_THEMES.entries[AVAILABLE_TERMINAL_THEMES.keys[0]]
    .name,
  tabName: 'index.ts',
  shadow: themeVars.boxShadow.lg,
  accentVisible: true,
  background: '',
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

persistState(store, {storage: localStorageStrategy, key: '@store/terminal'});

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
