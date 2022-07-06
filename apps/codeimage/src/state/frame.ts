import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {createStore, setProp, withProps} from '@ngneat/elf';
import {localStorageStrategy, persistState} from '@ngneat/elf-persist-state';
import {distinctUntilChanged} from 'rxjs';
import {createEffect, createRoot, on} from 'solid-js';
import {appEnvironment} from '../core/configuration';
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
  // lazy initialization
  background: null,
  padding: 64,
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

createRoot(() => {
  const registry = getThemeStore();
  const [resource] = registry.getThemeResource('vsCodeDarkTheme');
  createEffect(
    on(resource, resource => {
      if (resource) {
        if (store.state.background === null) {
          store.update(
            setProp('background', resource.properties.previewBackground),
          );
        }
        persistState(store, {
          key: '@store/frame',
          storage: localStorageStrategy,
        });
      }
    }),
  );
});

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
