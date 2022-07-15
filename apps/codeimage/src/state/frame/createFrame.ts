import {FrameState, PersistedFrameState} from '@codeimage/store/frame/model';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {appEnvironment} from '@core/configuration';
import makeStore from '@core/store/makeStore';
import {debounceTime} from 'rxjs';
import {
  createEffect,
  createRoot,
  createSignal,
  from as $from,
  on,
} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {useIdb} from '../../hooks/use-indexed-db';

export function getInitialFrameState(): FrameState {
  return {
    // lazy initialization
    background: null,
    padding: 64,
    radius: 24,
    visible: true,
    opacity: 100,
    autoWidth: false,
    scale: 1,
  };
}

export function $createFrameState() {
  const [store, setStore, {state$}] = makeStore<FrameState>(
    getInitialFrameState(),
  );

  const [initialized, setInitialized] = createSignal(false);
  const IDB_KEY = 'frame';
  const idb = useIdb();
  const registry = getThemeStore();
  const [resource] = registry.getThemeResource('vsCodeDarkTheme');

  // Initialization
  createEffect(
    on(resource, async resource => {
      if (resource) {
        if (store.background === null) {
          setStore('background', resource.properties.previewBackground);
        }
      }

      const idbState = await idb
        .get<PersistedFrameState>(IDB_KEY)
        .catch(() => null);

      if (idbState) {
        setStore(state => ({...state, ...idbState}));
      }

      setInitialized(true);
    }),
  );

  return {
    store,
    setStore,
    state$,
    get stateToPersist(): PersistedFrameState {
      const state = unwrap(store);
      return {
        background: state.background,
        opacity: state.opacity,
        padding: state.padding,
        radius: state.radius,
        visible: state.visible,
      };
    },
    initialized,
    setBackground: (background: string) => setStore('background', background),
    setOpacity: (opacity: number) => setStore('opacity', opacity),
    setPadding: (padding: number) => setStore('padding', padding),
    setRadius: (radius: number) => setStore('radius', radius),
    setScale: (scale: number) => setStore('scale', scale),
    setAutoWidth: (autoWidth: boolean) => setStore('autoWidth', autoWidth),
    setVisibility: (visibility: boolean) => setStore('visible', visibility),
    toggleVisibility: () => setStore('visible', visible => !visible),
    setNextPadding() {
      const availablePadding = appEnvironment.editorPadding;
      setStore('padding', padding => {
        const currentIndex = appEnvironment.editorPadding.indexOf(padding);
        const next = (currentIndex + 1) % availablePadding.length;
        return availablePadding[next];
      });
    },
  };
}

const $frameState = createRoot($createFrameState);

export function getFrameState() {
  return $frameState;
}
