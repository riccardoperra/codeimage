import {createConfiguration, SUPPORTED_LOCALES} from '@codeimage/config';
import {version} from '../../package.json';
import {
  SUPPORTED_FONTS,
  SUPPORTED_FONTS_DICTIONARY,
} from './configuration/font';

export const MANY_THEMES = [
  import('@codeimage/theme/vscode-dark').then(m => m.vsCodeDarkTheme),
  import('@codeimage/theme/night-owl').then(m => m.nightOwlTheme),
  import('@codeimage/theme/dracula').then(m => m.draculaTheme),
  import('@codeimage/theme/material-ocean').then(m => m.materialOceanTheme),
  import('@codeimage/theme/synthwave84').then(m => m.synthwave84Theme),
  import('@codeimage/theme/material-volcano').then(m => m.materialVolcanoTheme),
  import('@codeimage/theme/one-dark').then(m => m.oneDarkTheme),
  import('@codeimage/theme/light').then(m => m.lightTheme),
  import('@codeimage/theme/material-palenight').then(
    m => m.materialPalenightTheme,
  ),
  import('@codeimage/theme/duotone-sea').then(m => m.duotoneSeaTheme),
  import('@codeimage/theme/duotone-dark').then(m => m.duotoneDarkTheme),
  import('@codeimage/theme/coldark').then(m => m),
  import('@codeimage/theme/material-light').then(m => m.materialLightTheme),
];

export let SUPPORTED_THEMES_DICTIONARY = {};
export let SUPPORTED_THEMES = [];

export const [appEnvironment] = createConfiguration({
  version,
  locales: SUPPORTED_LOCALES,
  themes: SUPPORTED_THEMES,
  languages: [],
  editorPadding: [16, 32, 64, 128],
  fonts: SUPPORTED_FONTS,
  defaultState: {
    editor: {
      code:
        'function Counter() {\n' +
        '  const [count, setCount] = createSignal(0);\n' +
        '  \n' +
        '  setInterval(\n' +
        '    () => setCount(count() + 1),\n' +
        '    1000\n' +
        '  );\n' +
        '\n' +
        '  return <div>The count is {count()}</div>\n' +
        '}' +
        '\n',
      // TODO: should be auto
      languageId: 'typescript',
      theme: '',
      font: SUPPORTED_FONTS_DICTIONARY['jetbrains-mono'],
    },
  } as const,
});
