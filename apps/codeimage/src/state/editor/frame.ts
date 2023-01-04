import {experimental} from '@codeimage/atomic-state';
import {editorStore} from '@codeimage/store/editor/index';
import {FrameState, PersistedFrameState} from '@codeimage/store/frame/model';
import {appEnvironment} from '@core/configuration';
import {map} from 'rxjs';

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

type Commands = {
  setBackground: string;
  setOpacity: number;
  setPadding: number;
  setRadius: number;
  setScale: number;
  setAutoWidth: boolean;
  setVisibility: boolean;
  toggleVisibility: void;
  setNextPadding: void;
  setFromPersistedState: PersistedFrameState;
};

export function createFrameState() {
  const store = experimental
    .createExperimentalStore<FrameState>(getInitialFrameState())
    .extend(experimental.withProxyCommands<Commands>());

  store
    .hold(store.commands.setBackground, (background, state) => ({
      ...state,
      background,
    }))
    .hold(store.commands.setOpacity, (opacity, state) => ({
      ...state,
      opacity,
    }))
    .hold(store.commands.setPadding, (padding, state) => ({
      ...state,
      padding,
    }))
    .hold(store.commands.setRadius, (radius, state) => ({
      ...state,
      radius,
    }))
    .hold(store.commands.setScale, (scale, state) => ({
      ...state,
      scale,
    }))
    .hold(store.commands.setAutoWidth, (autoWidth, state) => ({
      ...state,
      autoWidth,
    }))
    .hold(store.commands.setVisibility, (visible, state) => ({
      ...state,
      visible,
    }))
    .hold(store.commands.toggleVisibility, (_, state) => ({
      ...state,
      visible: !state.visible,
    }))
    .hold(store.commands.setNextPadding, (_, state) => {
      const availablePadding = appEnvironment.editorPadding;
      const padding = state.padding;
      const currentIndex = appEnvironment.editorPadding.indexOf(padding);
      const next = (currentIndex + 1) % availablePadding.length;
      return {...state, padding: availablePadding[next]};
    })
    .hold(store.commands.setFromPersistedState, (_, state) => {
      return {...state, ..._};
    });

  const mapToStateToPersistState = (state: FrameState): PersistedFrameState => {
    return {
      background: state.background,
      opacity: state.opacity,
      padding: state.padding,
      visible: state.visible,
      radius: state.radius,
    } as PersistedFrameState;
  };

  const stateToPersist$ = store
    .watchCommand([
      store.commands.setBackground,
      store.commands.setOpacity,
      store.commands.setPadding,
      store.commands.setRadius,
      store.commands.setScale,
      store.commands.setAutoWidth,
      store.commands.setVisibility,
      store.commands.setNextPadding,
    ])
    .pipe(
      map(() => store.get()),
      map(mapToStateToPersistState),
    );

  return {
    get store() {
      return store.state;
    },
    setStore: store.set,
    stateToPersist$,
    stateToPersist() {
      const state = store.get();
      return mapToStateToPersistState(state);
    },
    ...store.actions,
  };
}

export function getFrameState() {
  return editorStore.frame;
}
