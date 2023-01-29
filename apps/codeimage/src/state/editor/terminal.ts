import {getEditorStore} from '@codeimage/store/editor';
import {
  PersistedTerminalState,
  TerminalState,
} from '@codeimage/store/editor/model';
import {provideAppState} from '@codeimage/store/index';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {map} from 'rxjs';
import {defineStore} from 'statebuilder';
import {withProxyCommands} from 'statebuilder/commands';

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
  const config = defineStore(() => getInitialTerminalState()).extend(
    withProxyCommands<{
      setShadow: string | null;
      setType: string;
      setAccentVisible: boolean;
      setShowHeader: boolean;
      setShowGlassReflection: boolean;
      setShowWatermark: boolean;
      setOpacity: number;
      setAlternativeTheme: boolean;
      toggleShowHeader: void;
      toggleWatermark: void;
      setFromPersistedState: PersistedTerminalState;
    }>(),
  );
  const store = provideAppState(config);
  store
    .hold(store.commands.setShadow, (shadow, {state}) => ({...state, shadow}))
    .hold(store.commands.setType, (type, {state}) => ({...state, type}))
    .hold(store.commands.setAccentVisible, (accentVisible, {state}) => ({
      ...state,
      accentVisible,
    }))
    .hold(store.commands.setShowHeader, (showHeader, {state}) => ({
      ...state,
      showHeader,
    }))
    .hold(
      store.commands.setShowGlassReflection,
      (showGlassReflection, {state}) => ({...state, showGlassReflection}),
    )
    .hold(store.commands.setShowWatermark, (showWatermark, {state}) => ({
      ...state,
      showWatermark,
    }))
    .hold(store.commands.setOpacity, (opacity, {state}) => ({
      ...state,
      opacity,
    }))
    .hold(store.commands.setAlternativeTheme, (alternativeTheme, {state}) => ({
      ...state,
      alternativeTheme,
    }))
    .hold(store.commands.toggleShowHeader, (_, {state}) => {
      return {
        ...state,
        showHeader: !state.showHeader,
      };
    })
    .hold(store.commands.toggleWatermark, (_, {state}) => ({
      ...state,
      showWatermark: !state.showWatermark,
    }))
    .hold(store.commands.setFromPersistedState, (persistedState, {state}) => {
      const shadows = TERMINAL_SHADOWS;
      if (!Object.values<string | null>(shadows).includes(state.shadow)) {
        state.shadow = shadows.bottom;
      }
      return {...state, ...persistedState};
    });

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
      map(() => store()),
      map(mapToStateToPersistState),
    );

  return {
    state: store.get,
    setState: store.set,
    stateToPersist$,
    stateToPersist() {
      const state = store();
      return mapToStateToPersistState(state);
    },
    ...store.actions,
  };
}

export function getTerminalState() {
  return getEditorStore().terminal;
}
