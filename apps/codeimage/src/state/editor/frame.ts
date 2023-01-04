import {storeV2} from '@codeimage/atomic-state';
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
  const store = storeV2
    .createStoreContainer<FrameState>(getInitialFrameState())
    .on(
      storeV2.createCommand('setBackground').withPayload<string>(),
      (background, state) => ({...state, background}),
    )
    .on(
      storeV2.createCommand('setOpacity').withPayload<number>(),
      (opacity, state) => ({...state, opacity}),
    )
    .on(
      storeV2.createCommand('setPadding').withPayload<number>(),
      (padding, state) => ({...state, padding}),
    )
    .on(
      storeV2.createCommand('setRadius').withPayload<number>(),
      (radius, state) => ({...state, radius}),
    )
    .on(
      storeV2.createCommand('setScale').withPayload<number>(),
      (scale, state) => ({...state, scale}),
    )
    .on(
      storeV2.createCommand('setAutoWidth').withPayload<boolean>(),
      (autoWidth, state) => ({...state, autoWidth}),
    )
    .on(
      storeV2.createCommand('setVisibility').withPayload<boolean>(),
      (visible, state) => ({...state, visible}),
    )
    .on(
      storeV2.createCommand('toggleVisibility').withPayload<void>(),
      (_, state) => ({...state, visible: !state.visible}),
    )
    .on(
      storeV2.createCommand('setNextPadding').withPayload<void>(),
      (_, state) => {
        const availablePadding = appEnvironment.editorPadding;
        const padding = state.padding;
        const currentIndex = appEnvironment.editorPadding.indexOf(padding);
        const next = (currentIndex + 1) % availablePadding.length;
        return {...state, padding: availablePadding[next]};
      },
    )
    .on(
      storeV2
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
      return store.get();
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
