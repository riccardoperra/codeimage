import {
  checkLocalFontPermission$,
  isLocalFontsFeatureSupported,
} from '@core/modules/localFontAccessApi/api';
import {EMPTY, of, switchMap, tap} from 'rxjs';
import {createSignal, untrack} from 'solid-js';
import {makePlugin, Store} from 'statebuilder';
import {LoadedFont, useLocalFonts} from '../../../hooks/use-local-fonts';
import {ConfigState} from '../config.store';

export function withLocalFontManagementPlugin() {
  const plugin = makePlugin.typed<Store<ConfigState>>();
  return plugin(
    _ => {
      const [state, setState] = createSignal({
        permissionState: null as PermissionState | 'unsupported' | null,
        fonts: [] as LoadedFont[],
        loading: false,
        error: null as string | null,
      });

      async function loadFonts() {
        untrack(() => {
          if (!state().loading) {
            setState(state => ({
              ...state,
              loading: true,
            }));
          }
        });
        await new Promise(r => setTimeout(r, 100));
        return useLocalFonts().then(fonts => {
          setState(state => ({
            ...state,
            fonts: fonts,
            loading: false,
            error: null,
          }));
        });
      }

      function accessSystemFonts(useCache: boolean) {
        if (!isLocalFontsFeatureSupported()) {
          console.warn(
            '[CodeImage] System Local Fonts API not supported in this browser.',
          );
          setState(state => ({...state, permissionState: 'unsupported'}));
          return EMPTY;
        }

        setState(state => ({...state, loading: true}));
        return checkLocalFontPermission$.pipe(
          switchMap(permissionState => {
            setState(state => ({...state, permissionState}));
            if (permissionState === 'granted') {
              if (useCache && untrack(() => _.get.systemFonts.length > 0)) {
                return of(_.get.systemFonts).pipe(
                  tap(() => setState(state => ({...state, loading: false}))),
                );
              }
              setState(state => ({...state, loading: true}));
            }
            return loadFonts();
          }),
          tap({
            error: error => setState(state => ({...state, error})),
          }),
        );
      }

      const api = {
        state,
        loadFonts,
        accessSystemFonts,
        get supported() {
          return isLocalFontsFeatureSupported();
        },
      };

      return {localFontsApi: api};
    },
    {name: 'withLocalFontManagement'},
  );
}
