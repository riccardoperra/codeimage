import {themeVars} from '../theme/global.css';
import {staticConfiguration} from '../core/configuration';
import {createStore, select, setProp, withProps} from '@ngneat/elf';
import {localStorageStrategy, persistState} from '@ngneat/elf-persist-state';
import {distinctUntilChanged} from 'rxjs';
import shallow from './shallow';
import {dispatch} from '@ngneat/effects';
import {updateTabName} from './effect';

export interface TerminalState {
  readonly showHeader: boolean;
  readonly type: string;
  readonly tabName: string | null;
  readonly accentVisible: boolean;
  readonly shadow: string;
  readonly background: string;
  readonly textColor: string;
  readonly darkMode: boolean;
  readonly showWatermark: boolean;
}

const initialState: TerminalState = {
  showHeader: true,
  type: staticConfiguration.terminalThemes.entries[
    staticConfiguration.terminalThemes.keys[0]
  ].name,
  tabName: null,
  shadow: themeVars.boxShadow.lg,
  accentVisible: true,
  background: staticConfiguration.themes[0].properties.terminal.main,
  textColor: staticConfiguration.themes[0].properties.terminal.text,
  darkMode: staticConfiguration.themes[0].properties.darkMode,
  showWatermark: true,
};

const store = createStore(
  {name: 'terminal'},
  withProps<TerminalState>(initialState),
);

export const updateTerminalStore = store.update.bind(store);

persistState(store, {storage: localStorageStrategy, key: '@store/terminal'});

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
