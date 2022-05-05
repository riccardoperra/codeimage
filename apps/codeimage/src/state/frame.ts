import {createStore, setProp, withProps} from '@ngneat/elf';
import {localStorageStrategy, persistState} from '@ngneat/elf-persist-state';
import {distinctUntilChanged} from 'rxjs';
import {
  appEnvironment,
  SUPPORTED_THEMES_DICTIONARY,
} from '../core/configuration';
import shallow from '../core/helpers/shallow';
import {elfAutoSettersFactory} from '../core/store/elf-auto-setters-factory';

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
  background:
    SUPPORTED_THEMES_DICTIONARY.vsCodeDarkTheme.properties.previewBackground,
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

export const {
  setBackground,
  setOpacity,
  setPadding,
  setRadius,
  setScale,
  setAutoWidth,
  setVisible: setVisibility,
} = elfAutoSettersFactory(store);

export const updateFrameStore = store.update.bind(store);

persistState(store, {key: '@store/frame', storage: localStorageStrategy});

export function toggleVisibility(): void {
  store.update(setProp('visible', visible => !visible));
}

export function setNextPadding(): void {
  const availablePadding = appEnvironment.editorPadding;

  store.update(
    setProp('padding', padding => {
      const currentIndex = appEnvironment.editorPadding.indexOf(padding);
      const next = (currentIndex + 1) % availablePadding.length;
      return availablePadding[next];
    }),
  );
}

export const frame$ = store.pipe(distinctUntilChanged(shallow));
