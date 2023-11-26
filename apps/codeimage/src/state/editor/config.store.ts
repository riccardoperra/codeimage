import {withIndexedDbPlugin} from '@codeimage/store/plugins/withIndexedDbPlugin';
import {
  CustomFontConfiguration,
  SUPPORTED_FONTS,
} from '@core/configuration/font';
import {EMPTY, switchMap, tap} from 'rxjs';
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
import {
  checkLocalFontPermission$,
  isLocalFontsFeatureSupported,
  useLocalFonts,
} from '../../hooks/use-local-fonts';

interface ConfigState {
  ready: boolean;
  fonts: CustomFontConfiguration[];
  systemFonts: CustomFontConfiguration[];
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
    createEffect(
      on(fonts, fonts => {
        const fontsConfiguration = Object.entries(fonts).map(([name, data]) => {
          return {
            custom: true,
            id: name,
            name: data[0].family,
            types: [
              {name: 'Regular', weight: 400},
              {name: 'Medium', weight: 500},
              {name: 'Bold', weight: 700},
            ],
          } as CustomFontConfiguration;
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
        fonts: {} as Record<string, FontData[]>,
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

      function accessSystemFonts() {
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
