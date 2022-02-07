import {createState, Store, withProps} from '@ngneat/elf';
import {themeVars} from '../theme/global.css';

type BackgroundState = null | string;

interface FrameState {
  background: BackgroundState;
  padding: number;
}

const {state, config} = createState(
  withProps<FrameState>({
    background: themeVars.backgroundColor.gray['300'],
    padding: 128,
  }),
);

const store = new Store({name: 'frame', state, config});

export const frameState = store.asObservable();

export function updateBackground(backgroundState: BackgroundState) {
  store.update(state => ({...state, background: backgroundState}));
}

export function updatePadding(padding: number) {
  store.update(state => ({...state, padding}));
}
