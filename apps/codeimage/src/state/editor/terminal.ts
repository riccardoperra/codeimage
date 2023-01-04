import {storeV2} from '@codeimage/atomic-state';
import {getInitialFrameState} from '@codeimage/store/editor/frame';
import {editorStore} from '@codeimage/store/editor/index';
import {
  PersistedTerminalState,
  TerminalState,
} from '@codeimage/store/editor/model';
import {FrameState} from '@codeimage/store/frame/model';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {map} from 'rxjs';

export function getInitialTerminalState(): TerminalState {
  const terminalName =
    AVAILABLE_TERMINAL_THEMES.entries[AVAILABLE_TERMINAL_THEMES.keys[0]].name;

  return {
    showHeader: true,
    type: terminalName,
    shadow: TERMINAL_SHADOWS.bottom,
    accentVisible: true,
    // lazy initialization
    background: '',
    // lazy initialization
    textColor: '',
    showWatermark: true,
    showGlassReflection: false,
    opacity: 100,
    alternativeTheme: false,
  };
}

export function createTerminalState() {
  const store = storeV2
    .createExperimentalStore<TerminalState>(getInitialTerminalState())
    .with(storeV2.makeCommands())
    .on(
      storeV2
        .createCommand('setShadow')
        .withPayload<string>()
        .withPayload<null>(),
      (shadow, state) => ({...state, shadow}),
    )
    .on(
      storeV2.createCommand('setType').withPayload<string>(),
      (type, state) => ({...state, type}),
    )
    .on(
      storeV2.createCommand('setAccentVisible').withPayload<boolean>(),
      (accentVisible, state) => ({...state, accentVisible}),
    )
    .on(
      storeV2.createCommand('setShowHeader').withPayload<boolean>(),
      (showHeader, state) => ({...state, showHeader}),
    )
    .on(
      storeV2.createCommand('setShowGlassReflection').withPayload<boolean>(),
      (showGlassReflection, state) => ({...state, showGlassReflection}),
    )
    .on(
      storeV2.createCommand('setShowWatermark').withPayload<boolean>(),
      (showWatermark, state) => ({
        ...state,
        showWatermark,
      }),
    )
    .on(
      storeV2.createCommand('setOpacity').withPayload<number>(),
      (opacity, state) => ({
        ...state,
        opacity,
      }),
    )
    .on(
      storeV2.createCommand('setAlternativeTheme').withPayload<boolean>(),
      (alternativeTheme, state) => ({
        ...state,
        alternativeTheme,
      }),
    )
    .on(
      storeV2.createCommand('toggleShowHeader').withPayload<void>(),
      (_, state) => ({
        ...state,
        showHeader: !state.showHeader,
      }),
    )
    .on(
      storeV2.createCommand('toggleWatermark').withPayload<boolean>(),
      (_, state) => ({
        ...state,
        showWatermark: !state.showWatermark,
      }),
    )
    .on(
      storeV2
        .createCommand('setFromPersistedState')
        .withPayload<PersistedTerminalState>(),
      (persistedState, state) => {
        const shadows = TERMINAL_SHADOWS;
        if (!Object.values<string | null>(shadows).includes(state.shadow)) {
          state.shadow = shadows.bottom;
        }
        return {...state, ...persistedState};
      },
    );

  const mapToStateToPersistState = (
    state: TerminalState,
  ): PersistedTerminalState => {
    return {
      alternativeTheme: state.alternativeTheme,
      showGlassReflection: state.showGlassReflection,
      showWatermark: state.showWatermark,
      textColor: state.textColor,
      background: state.background,
      opacity: state.opacity,
      shadow: state.shadow,
      showHeader: state.showHeader,
      type: state.type,
      accentVisible: state.accentVisible,
    };
  };

  const stateToPersist$ = store
    .watchCommand([
      store.commands.setAccentVisible,
      store.commands.setOpacity,
      store.commands.setAlternativeTheme,
      store.commands.setShadow,
      store.commands.setType,
      store.commands.setShowGlassReflection,
      store.commands.setShowHeader,
      store.commands.setShowWatermark,
      store.commands.toggleShowHeader,
      store.commands.toggleWatermark,
    ])
    .pipe(
      map(() => store.get()),
      map(mapToStateToPersistState),
    );

  return {
    get state() {
      return store.state;
    },
    setState: store.set,
    stateToPersist$,
    stateToPersist() {
      const state = store.get();
      return mapToStateToPersistState(state);
    },
    ...store.actions,
  };
}

export function getTerminalState() {
  return editorStore.terminal;
}
