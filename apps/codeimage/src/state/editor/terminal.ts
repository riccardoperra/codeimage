import {createDerivedObservable, createStore} from '@codeimage/atomic-state';
import {editorStore} from '@codeimage/store/editor/index';
import {
  PersistedTerminalState,
  TerminalState,
} from '@codeimage/store/editor/model';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';

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
  const [state, setState] = createStore(getInitialTerminalState());

  const [stateToPersist$, stateToPersist] =
    createDerivedObservable<TerminalState>(() => {
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
    });

  return {
    state,
    setState,
    stateToPersist,
    stateToPersist$,
    setFromPersistedState(persistedState: PersistedTerminalState) {
      const shadows = TERMINAL_SHADOWS;
      setState(state => {
        if (!Object.values<string | null>(shadows).includes(state.shadow)) {
          state.shadow = shadows.bottom;
        }
        return {...state, ...persistedState};
      });
    },
    setShadow: (shadow: string) => setState('shadow', shadow),
    setType: (type: string) => setState('type', type),
    setAccentVisible: (accentVisible: boolean) =>
      setState('accentVisible', accentVisible),
    setShowHeader: (showHeader: boolean) => setState('showHeader', showHeader),
    setShowGlassReflection: (showGlassReflection: boolean) =>
      setState('showGlassReflection', showGlassReflection),
    setShowWatermark: (showWatermark: boolean) =>
      setState('showWatermark', showWatermark),
    setOpacity: (opacity: number) => setState('opacity', opacity),
    setAlternativeTheme: (alternativeTheme: boolean) =>
      setState('alternativeTheme', alternativeTheme),
    toggleShowHeader: () => setState('showHeader', showHeader => !showHeader),
    toggleWatermark: () =>
      setState('showWatermark', showWatermark => !showWatermark),
  };
}

export function getTerminalState() {
  return editorStore.terminal;
}
