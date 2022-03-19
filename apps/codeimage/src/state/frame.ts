import {staticConfiguration} from '../core/configuration';
import {createStore, setProp, withProps} from '@ngneat/elf';
import {localStorageStrategy, persistState} from '@ngneat/elf-persist-state';
import {distinctUntilChanged} from 'rxjs';
import shallow from '../core/helpers/shallow';
import {persistQuery} from '../core/helpers/persistQuery';

export interface FrameStateSlice {
  background: string | null | undefined;
  padding: number;
  radius: number;
  visible: boolean;
  opacity: number;
  autoWidth: boolean;
  scale: number;
}

const initialState: FrameStateSlice = {
  background: staticConfiguration.themes[0].properties.previewBackground,
  padding: 128,
  radius: 24,
  visible: true,
  opacity: 100,
  autoWidth: false,
  scale: 1,
};

const store = createStore(
  {name: 'frame'},
  withProps<FrameStateSlice>(initialState),
);

export const updateFrameStore = store.update.bind(store);

persistState(store, {key: '@store/frame', storage: localStorageStrategy});
persistQuery(store, {
  key: 'frame',
  keysToSync: ['background', 'padding', 'radius', 'visible', 'opacity'],
});

export function setPadding(padding: number): void {
  store.update(setProp('padding', padding));
}

export function setRadius(radius: number): void {
  store.update(setProp('radius', radius));
}

export function setOpacity(opacity: number): void {
  store.update(setProp('opacity', opacity));
}

export function setVisibility(visibility: boolean): void {
  store.update(setProp('visible', visibility));
}

export function setAutoWidth(autoWidth: boolean): void {
  store.update(setProp('autoWidth', autoWidth));
}

export function setBackground(background: string): void {
  store.update(setProp('background', background));
}

export function setScale(scale: number): void {
  store.update(setProp('scale', scale));
}

export function toggleVisibility(): void {
  store.update(setProp('visible', visible => !visible));
}

export function setNextPadding(): void {
  const availablePadding = staticConfiguration.editorPadding;

  store.update(
    setProp('padding', padding => {
      const currentIndex = staticConfiguration.editorPadding.indexOf(padding);
      const next = (currentIndex + 1) % availablePadding.length;
      return availablePadding[next];
    }),
  );
}

export const frame$ = store.pipe(distinctUntilChanged(shallow));
