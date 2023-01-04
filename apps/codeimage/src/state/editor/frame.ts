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

export function createFrameState() {
  const store = experimental
    .createExperimentalStore<FrameState>(getInitialFrameState())
    .extend(experimental.withCommands())
    .on(
      experimental.createCommand('setBackground').withPayload<string>(),
      (background, state) => ({...state, background}),
    )
    .on(
      experimental.createCommand('setOpacity').withPayload<number>(),
      (opacity, state) => ({...state, opacity}),
    )
    .on(
      experimental.createCommand('setPadding').withPayload<number>(),
      (padding, state) => ({...state, padding}),
    )
    .on(
      experimental.createCommand('setRadius').withPayload<number>(),
      (radius, state) => ({...state, radius}),
    )
    .on(
      experimental.createCommand('setScale').withPayload<number>(),
      (scale, state) => ({...state, scale}),
    )
    .on(
      experimental.createCommand('setAutoWidth').withPayload<boolean>(),
      (autoWidth, state) => ({...state, autoWidth}),
    )
    .on(
      experimental.createCommand('setVisibility').withPayload<boolean>(),
      (visible, state) => ({...state, visible}),
    )
    .on(
      experimental.createCommand('toggleVisibility').withPayload<void>(),
      (_, state) => ({...state, visible: !state.visible}),
    )
    .on(
      experimental.createCommand('setNextPadding').withPayload<void>(),
      (_, state) => {
        const availablePadding = appEnvironment.editorPadding;
        const padding = state.padding;
        const currentIndex = appEnvironment.editorPadding.indexOf(padding);
        const next = (currentIndex + 1) % availablePadding.length;
        return {...state, padding: availablePadding[next]};
      },
    )
    .on(
      experimental
        .createCommand('setFromPersistedState')
        .withPayload<PersistedFrameState>(),
      (_, state) => {
        return {...state, ..._};
      },
    );

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
