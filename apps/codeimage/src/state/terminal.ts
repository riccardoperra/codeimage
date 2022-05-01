import {updateTabName} from '@codeimage/store/effects/onTabNameChange';
import {themeVars} from '@codeimage/ui';
import {
  appEnvironment,
  SUPPORTED_THEMES_DICTIONARY,
} from '../core/configuration';
import {createStore, select, setProp, withProps} from '@ngneat/elf';
import {localStorageStrategy, persistState} from '@ngneat/elf-persist-state';
import {distinctUntilChanged} from 'rxjs';
import shallow from '../core/helpers/shallow';
import {dispatch} from '@ngneat/effects';
import {persistQuery} from '../core/helpers/persistQuery';
import {elfAutoSettersFactory} from '../core/store/elf-auto-setters-factory';

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
}

const initialState: TerminalState = {
  showHeader: true,
  type: appEnvironment.terminalThemes.entries[
    appEnvironment.terminalThemes.keys[0]
  ].name,
  tabName: 'index.js',
  shadow: themeVars.boxShadow.lg,
  accentVisible: true,
  background:
    SUPPORTED_THEMES_DICTIONARY['prismjs-vsCodeDarkTheme'].properties.terminal
      .main,
  textColor:
    SUPPORTED_THEMES_DICTIONARY['prismjs-vsCodeDarkTheme'].properties.terminal
      .text,
  darkMode:
    SUPPORTED_THEMES_DICTIONARY['prismjs-vsCodeDarkTheme'].properties.darkMode,
  showWatermark: true,
  showGlassReflection: false,
};

const store = createStore(
  {name: 'terminal'},
  withProps<TerminalState>(initialState),
);

export const updateTerminalStore = store.update.bind(store);

persistState(store, {storage: localStorageStrategy, key: '@store/terminal'});
persistQuery(store, {
  key: 'terminal',
  keysToSync: [
    'showHeader',
    'type',
    'tabName',
    'accentVisible',
    'shadow',
    'background',
    'textColor',
    'darkMode',
    'showWatermark',
    'showReflection',
  ],
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
} = elfAutoSettersFactory(store);

export function toggleShowHeader() {
  store.update(setProp('showHeader', showHeader => !showHeader));
}

export function toggleWatermark() {
  store.update(setProp('showWatermark', showWatermark => !showWatermark));
}

export function setTabName(tabName: string) {
  store.update(setProp('tabName', tabName));
  if (!tabName) {
    return;
  }
  dispatch(updateTabName({tabName}));
}

export const terminal$ = store.pipe(distinctUntilChanged(shallow));

export const tabName$ = store.pipe(select(state => state.tabName));
