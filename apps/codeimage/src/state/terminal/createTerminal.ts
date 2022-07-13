import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import makeStore from '@core/store/makeStore';
import {debounceTime, from, map, Observable, shareReplay} from 'rxjs';
import {
  batch,
  createEffect,
  createRoot,
  createSignal,
  from as $from,
  observable,
  on,
} from 'solid-js';
import {produce, unwrap} from 'solid-js/store';
import {useIdb} from '../../hooks/use-indexed-db';
import {PersistedTerminalState, TerminalState} from './model';

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

export function $createTerminalState() {
  const [state, setState, signal] = makeStore(getInitialTerminalState());
  const idb = useIdb();
  const IDB_KEY = 'terminal';
  const [ready, setReady] = createSignal(false);
  const registry = getThemeStore();
  const [resource] = registry.getThemeResource('vsCodeDarkTheme');

  const state$ = from(observable(signal) as unknown as Observable<symbol>).pipe(
    map(() => unwrap(state)),
    shareReplay({refCount: true, bufferSize: 1}),
  );

  createEffect(
    on(resource, async resource => {
      if (resource) {
        batch(() => {
          setState('background', resource.properties.terminal.main);
          setState('textColor', resource.properties.terminal.text);
        });

        const idbState = await idb
          .get<PersistedTerminalState>(IDB_KEY)
          .catch(() => null);

        if (idbState) {
          const shadows = TERMINAL_SHADOWS;

          setState(state => {
            if (!Object.values<string>(shadows).includes(state.shadow)) {
              state.shadow = shadows.bottom;
            }
            return {...state, ...idbState};
          });
        }

        setReady(true);
      }
    }),
  );

  createEffect(
    on([$from(state$.pipe(debounceTime(0))), ready], ([state, ready]) => {
      if (!ready) return;
      const persistedFrameState: PersistedTerminalState = {
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
      idb.set(IDB_KEY, persistedFrameState);
    }),
  );

  return {
    state$,
    state,
    setState,
    ready,
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

const $terminalState = createRoot($createTerminalState);

export function getTerminalState() {
  return $terminalState;
}
