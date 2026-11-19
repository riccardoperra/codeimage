import {
  checkLocalFontPermission,
  isLocalFontsFeatureSupported,
} from '@core/modules/localFontAccessApi/api';
import {createSignal, untrack} from 'solid-js';
import type {Store} from 'statebuilder';
import {createPlugin} from 'statebuilder';
import type {LoadedFont} from '../../../hooks/use-local-fonts';
import {useLocalFonts} from '../../../hooks/use-local-fonts';
import type {ConfigState} from '../config.store';

export function withLocalFontManagementPlugin() {
  const plugin = createPlugin.typed<Store<ConfigState>>();
  return plugin(
    () => {
      const [state, setState] = createSignal({
        permissionState: null as PermissionState | 'unsupported' | null,
        fonts: [] as LoadedFont[],
        loading: false,
        error: null as string | null,
      });
      let request = 0;
      const fail = (error: unknown) =>
        setState(state => ({...state, loading: false, error: String(error)}));

      async function loadFonts() {
        const id = ++request;
        setState(state => ({...state, loading: true}));
        try {
          const fonts = await useLocalFonts();
          if (id === request)
            setState(state => ({...state, fonts, loading: false, error: null}));
        } catch (error) {
          if (id === request) fail(error);
        }
      }

      function observeSystemFonts() {
        if (!isLocalFontsFeatureSupported()) {
          setState(state => ({...state, permissionState: 'unsupported'}));
          return;
        }

        const observer = new AbortController();
        setState(state => ({...state, loading: true}));
        void checkLocalFontPermission().then(
          permission => {
            if (observer.signal.aborted) return;
            function refresh() {
              const permissionState = permission.state;
              setState(state => ({...state, permissionState}));
              if (
                permissionState === 'prompt' ||
                (permissionState === 'granted' && !untrack(state).fonts.length)
              ) {
                void loadFonts();
              } else {
                request++;
                setState(state => ({...state, loading: false}));
              }
            }
            permission.addEventListener('change', refresh, {
              signal: observer.signal,
            });
            refresh();
          },
          error => {
            if (!observer.signal.aborted) fail(error);
          },
        );
        return () => {
          if (observer.signal.aborted) return;
          request++;
          observer.abort();
        };
      }

      return {
        localFontsApi: {
          state,
          loadFonts,
          observeSystemFonts,
          get supported() {
            return isLocalFontsFeatureSupported();
          },
        },
      };
    },
    {name: 'withLocalFontManagement'},
  );
}
