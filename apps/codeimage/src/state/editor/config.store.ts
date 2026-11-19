import {withIndexedDbPlugin} from '@codeimage/store/plugins/withIndexedDbPlugin';
import type {CustomFontConfiguration} from '@core/configuration/font';
import {SUPPORTED_FONTS} from '@core/configuration/font';
import type {RasterizerName} from '@core/rasterize';
import {fontWeightLabelMap} from '@core/modules/localFontAccessApi/font';
import {createEffect, createMemo} from 'solid-js';
import {defineStore} from 'statebuilder';
import type {LoadedFont} from '../../hooks/use-local-fonts';
import {withLocalFontManagementPlugin} from './config/localFont';

export interface ConfigState {
  ready: boolean;
  fonts: (CustomFontConfiguration & {type: 'web'})[];
  systemFonts: (CustomFontConfiguration & {type: 'system'})[];
  devMode: boolean;
  renderer: RasterizerName;
}

declare global {
  interface Window {
    toggleDevMode: () => void;
    setRenderer: (renderer: RasterizerName) => void;
  }
}

function getDefaultConfig(): ConfigState {
  return {
    ready: false,
    fonts: [...SUPPORTED_FONTS],
    systemFonts: [],
    devMode: false,
    renderer: 'dom-export',
  };
}

export const EditorConfigStore = defineStore(() => getDefaultConfig())
  .extend(withIndexedDbPlugin('editorConfig', getDefaultConfig()))
  .extend((store, context) => {
    let disposed = false;
    context.onDispose(() => {
      disposed = true;
    });
    context.onMount(async () => {
      if (typeof window === 'undefined') return;
      const value = await store.idb.get();
      if (disposed) return;
      const renderer = new URLSearchParams(window.location.search).get(
        'renderer',
      );
      const {fonts: _cachedFonts, ...cachedSettings} = value;
      store.set(draft => {
        Object.assign(draft, cachedSettings);
        if (renderer === 'takumi' || renderer === 'dom-export') {
          draft.renderer = renderer;
        }
        draft.ready = true;
      });
      context.onSet(state =>
        store.idb.set({
          ...state,
          systemFonts: state.systemFonts.map(font => ({
            ...font,
            fontData: {...font.fontData, sources: []},
          })),
        }),
      );
    });
  })
  .extend(withLocalFontManagementPlugin())
  .extend((_, context) => {
    const fonts = createMemo(() => _.localFontsApi.state().fonts);

    const toggleDevMode = () =>
      _.set(state => {
        state.devMode = !state.devMode;
      });
    const setRenderer = (renderer: RasterizerName) => {
      if (renderer === 'dom-export' || renderer === 'takumi')
        _.set(state => {
          state.renderer = renderer;
        });
    };
    context.onMount(() => {
      if (typeof window === 'undefined') return;
      window.setRenderer = setRenderer;
      window.toggleDevMode = toggleDevMode;
    });

    const buildSystemFontConfiguration = (font: LoadedFont) =>
      ({
        type: 'system',
        id: font.family,
        name: font.family,
        fontData: font,
        types: font.faces.map(face => {
          const weight = parseInt(face);
          return {name: fontWeightLabelMap[weight], weight};
        }),
        // TODO: remove when typescript > 5 to use satisfies
      }) as CustomFontConfiguration & {type: 'system'};

    createEffect(fonts, fonts => {
      const fontsConfiguration = fonts.map(buildSystemFontConfiguration);
      _.set(state => {
        state.systemFonts = fontsConfiguration;
      });
    });

    return {
      toggleDevMode,
      setRenderer,
    };
  });
