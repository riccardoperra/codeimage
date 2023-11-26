import {withIndexedDbPlugin} from '@codeimage/store/plugins/withIndexedDbPlugin';
import {
  CustomFontConfiguration,
  SUPPORTED_FONTS,
} from '@core/configuration/font';
import {
  checkLocalFontPermission$,
  isLocalFontsFeatureSupported,
} from '@core/modules/localFontAccessApi/api';
import {EMPTY, of, switchMap, tap} from 'rxjs';
import {
  createEffect,
  createMemo,
  createSignal,
  getOwner,
  on,
  onMount,
  runWithOwner,
  untrack,
} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {defineStore, makePlugin, Store} from 'statebuilder';
import {LoadedFont, useLocalFonts} from '../../hooks/use-local-fonts';

interface ConfigState {
  ready: boolean;
  fonts: (CustomFontConfiguration & {type: 'web'})[];
  systemFonts: (CustomFontConfiguration & {type: 'system'})[];
}

function getDefaultConfig(): ConfigState {
  return {
    ready: false,
    fonts: [...SUPPORTED_FONTS],
    systemFonts: [],
  };
}

export const EditorConfigStore = defineStore(() => getDefaultConfig())
  .extend(withIndexedDbPlugin('editorConfig', getDefaultConfig()))
  .extend(_ => {
    onMount(() => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const owner = getOwner()!;
      _.idb.hydrateOnInit().then(() => {
        runWithOwner(owner, () => {
          _.set('ready', true);
          createEffect(
            on(
              _,
              state => {
                _.idb.set(unwrap(state));
              },
              {defer: true},
            ),
          );
        });
      });
    });
  })
  .extend(withLocalFontManagementPlugin())
  .extend(_ => {
    const fonts = createMemo(() => _.localFontsApi.state().fonts);

    const fontWeightMap: Record<number, string> = {
      100: 'Thin',
      200: 'Extra Light',
      300: 'Light',
      400: 'Regular',
      500: 'Medium',
      600: 'Semi Bold',
      700: 'Bold',
      800: 'Extra Bold',
      900: 'Black',
    };

    createEffect(
      on(fonts, fonts => {
        const fontsConfiguration = fonts.map(font => {
          return {
            type: 'system',
            id: font.family,
            name: font.family,
            fontData: font,
            types: font.faces.map(face => {
              const weight = parseInt(face);
              return {name: fontWeightMap[weight], weight};
            }),
            // TODO: remove when typescript > 5 to use satisfies
          } as CustomFontConfiguration & {type: 'system'};
        });
        _.set('systemFonts', fontsConfiguration);
      }),
    );
  });

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
