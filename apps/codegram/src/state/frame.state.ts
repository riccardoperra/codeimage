import {createState, select, Store, withProps} from '@ngneat/elf';
import {themeVars} from '../theme/global.css';
import {toPng} from 'html-to-image';
import download from 'downloadjs';
import {finalize, from} from 'rxjs';
import {CustomTheme} from '@codegram/theme';
import {Extension} from '@codemirror/state';

type BackgroundState = undefined | null | string;

interface EditorState {
  extensions: Extension;
}

export interface TerminalState {
  accentVisible: boolean;
  shadow: string;
  terminalBackground: string;
  terminalTextColor: string;
  darkMode: boolean;
}

interface FrameState {
  background: BackgroundState;
  // Frame
  padding: number;
  radius: number;
  autoWidth: boolean;
  // Background
  visible: boolean;
  opacity: number;

  exportLoading: boolean;
}

const {state, config} = createState(
  withProps<FrameState>({
    background: themeVars.backgroundColor.gray['300'],
    padding: 128,
    radius: 24,
    autoWidth: true,
    exportLoading: false,
    visible: true,
    opacity: 100,
  }),
  withProps<EditorState>({
    extensions: [],
  }),
  withProps<TerminalState>({
    shadow: '',
    accentVisible: true,
    terminalBackground: '#ffffff',
    terminalTextColor: '#000000',
    darkMode: false,
  }),
);

const store = new Store({name: 'frame', state, config});

export const frameState = store.asObservable();

export const extensions$ = frameState.pipe(
  select(({extensions}) => extensions),
);

export function updateBackground(backgroundState: BackgroundState) {
  store.update(state => ({...state, background: backgroundState}));
}

export function updateTheme(theme: CustomTheme): void {
  store.update(state => ({
    ...state,
    background: theme.properties.previewBackground,
    extensions: theme.editorTheme,
    terminalBackground: theme.properties.terminal.main,
    terminalTextColor: theme.properties.terminal.text,
    darkMode: theme.properties.darkMode,
  }));
}

export function updateRadius(radius: number | string): void {
  const computedRadius =
    typeof radius === 'string' ? parseInt(radius, 10) : radius;

  store.update(state => ({...state, radius: computedRadius}));
}

export function updateOpacity(radius: number | string): void {
  const computedOpacity =
    typeof radius === 'string' ? parseInt(radius, 10) : radius;

  store.update(state => ({...state, opacity: computedOpacity}));
}

export function updateVisibility(visible: boolean): void {
  store.update(state => ({...state, visible}));
}

export function updatePadding(padding: number) {
  store.update(state => ({...state, padding}));
}

export function updateAutoWidth(autoWidth: boolean) {
  store.update(state => ({...state, autoWidth}));
}

export function updateBoxShadow(shadow: string) {
  store.update(state => ({...state, shadow}));
}

export function updateAccentVisibility(accent: boolean) {
  store.update(state => ({...state, accentVisible: accent}));
}

export function exportImage(node: HTMLElement) {
  store.update(state => ({...state, exportLoading: true}));
  from(toPng(node))
    .pipe(finalize(() => console.log('test')))
    .subscribe(result => {
      download(result, 'file.png');
      store.update(state => ({...state, exportLoading: false}));
    });
}
