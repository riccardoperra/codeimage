import {themeVars} from '../theme/global.css';
import {
  appEnvironment,
  SUPPORTED_THEMES_DICTIONARY,
} from '../core/configuration';
import {createStore, select, setProp, withProps} from '@ngneat/elf';
import {localStorageStrategy, persistState} from '@ngneat/elf-persist-state';
import {distinctUntilChanged} from 'rxjs';
import shallow from '../core/helpers/shallow';
import {dispatch} from '@ngneat/effects';
import {updateTabName} from './effect';
import {persistQuery} from '../core/helpers/persistQuery';

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
}

const initialState: TerminalState = {
  showHeader: true,
  type: appEnvironment.terminalThemes.entries[
    appEnvironment.terminalThemes.keys[0]
  ].name,
  tabName: null,
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
  ],
});

export function setShadow(shadow: string) {
  store.update(setProp('shadow', shadow));
}

export function setAccentVisible(accentVisible: boolean) {
  store.update(setProp('accentVisible', accentVisible));
}

export function setBackground(background: string) {
  store.update(setProp('background', background));
}

export function setTextColor(textColor: string) {
  store.update(setProp('textColor', textColor));
}

export function setDarkMode(darkMode: boolean) {
  store.update(setProp('darkMode', darkMode));
}

export function setShowHeader(showHeader: boolean) {
  store.update(setProp('showHeader', showHeader));
}

export function setType(type: string) {
  store.update(setProp('type', type));
}

export function setShowWatermark(showWatermark: boolean) {
  store.update(setProp('showWatermark', showWatermark));
}

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
