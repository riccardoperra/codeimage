import {createState, Store, withProps} from '@ngneat/elf';

type BackgroundState = null | string;

interface FrameState {
  background: BackgroundState;
}

const {state, config} = createState(
  withProps<FrameState>({background: '#0d6985'}),
);

const store = new Store({name: 'frame', state, config});

export const frameState = store.asObservable();

export function updateBackground(backgroundState: BackgroundState) {
  store.update(state => ({...state, background: backgroundState}));
}
