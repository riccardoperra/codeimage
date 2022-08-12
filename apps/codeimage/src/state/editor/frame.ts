import {createDerivedObservable, createStore} from '@codeimage/atomic-state';
import {editorStore} from '@codeimage/store/editor/index';
import {FrameState, PersistedFrameState} from '@codeimage/store/frame/model';
import {appEnvironment} from '@core/configuration';

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

export function createFrameState() {
  const [store, setStore] = createStore<FrameState>(getInitialFrameState());

  const [stateToPersist$, stateToPersist] =
    createDerivedObservable<PersistedFrameState>(() => {
      return {
        background: store.background,
        opacity: store.opacity,
        padding: store.padding,
        radius: store.radius,
        visible: store.visible,
      };
    });

  return {
    store,
    setStore,
    stateToPersist,
    stateToPersist$,
    setFromPersistedState(persistedState: PersistedFrameState) {
      setStore(state => ({...state, ...persistedState}));
    },
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

export function getFrameState() {
  return editorStore.frame;
}
