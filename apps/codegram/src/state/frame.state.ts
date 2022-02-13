import {createState, Store, withProps} from '@ngneat/elf';
import {themeVars} from '../theme/global.css';
import {toPng} from 'html-to-image';
import download from 'downloadjs';
import {finalize, from} from 'rxjs';

type BackgroundState = null | string;

interface FrameState {
  background: BackgroundState;
  // Frame
  padding: number;
  radius: number;
  autoWidth: boolean;

  // Background
  visible: boolean;
  opacity: number;

  // Terminal
  accentVisible: boolean;

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

    accentVisible: false,
  }),
);

const store = new Store({name: 'frame', state, config});

export const frameState = store.asObservable();

export function updateBackground(backgroundState: BackgroundState) {
  store.update(state => ({...state, background: backgroundState}));
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
