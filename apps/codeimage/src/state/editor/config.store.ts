import {withIndexedDbPlugin} from '@codeimage/store/plugins/withIndexedDbPlugin';
import {
  CustomFontConfiguration,
  SUPPORTED_FONTS,
} from '@core/configuration/font';
import {fontWeightLabelMap} from '@core/modules/localFontAccessApi/font';
import {
  createEffect,
  createMemo,
  getOwner,
  on,
  onMount,
  runWithOwner,
} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {defineStore} from 'statebuilder';
import {LoadedFont} from '../../hooks/use-local-fonts';
import {withLocalFontManagementPlugin} from './config/localFont';

export interface ConfigState {
  ready: boolean;
  fonts: (CustomFontConfiguration & {type: 'web'})[];
  systemFonts: (CustomFontConfiguration & {type: 'system'})[];
  devMode: boolean;
}

declare global {
  interface Window {
    toggleDevMode: () => void;
  }
}

function getDefaultConfig(): ConfigState {
  return {
    ready: false,
    fonts: [...SUPPORTED_FONTS],
    systemFonts: [],
    devMode: false,
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
          _.set('fonts', [...SUPPORTED_FONTS]);
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
    const toggleDevMode = () => _.set('devMode', debug => !debug);
    onMount(() => {
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
      } as CustomFontConfiguration & {type: 'system'});

    createEffect(
      on(fonts, fonts => {
        const fontsConfiguration = fonts.map(buildSystemFontConfiguration);
        _.set('systemFonts', fontsConfiguration);
      }),
    );

    return {
      toggleDevMode,
    };
  });
