import {
  createConfiguration,
  SUPPORTED_LANGUAGES,
  SUPPORTED_LOCALES,
  SUPPORTED_THEMES,
} from '@codeimage/config';
import {WindowsTerminal} from '../components/Terminal/windows/WindowsTerminal';
import {MacOsTerminal} from '../components/Terminal/macOS/MacOsTerminal';
import {version} from '../../package.json';
import {
  SUPPORTED_FONTS,
  SUPPORTED_FONTS_DICTIONARY,
} from './configuration/font';
import {mapToDictionary} from './helpers/mapToDictionary';

export const AVAILABLE_TERMINAL_THEMES = {
  keys: ['macOs', 'windows'] as const,
  entries: {
    windows: {
      name: 'windows',
      component: WindowsTerminal,
    },
    macOs: {
      name: 'macOs',
      component: MacOsTerminal,
    },
  },
};

export const SUPPORTED_THEMES_DICTIONARY = mapToDictionary(
  SUPPORTED_THEMES,
  'id',
);

export const [appEnvironment] = createConfiguration({
  version,
  locales: SUPPORTED_LOCALES,
  themes: SUPPORTED_THEMES,
  languages: SUPPORTED_LANGUAGES,
  editorPadding: [16, 32, 64, 128],
  fonts: SUPPORTED_FONTS,
  terminalThemes: AVAILABLE_TERMINAL_THEMES,
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
      theme: SUPPORTED_THEMES_DICTIONARY['prismjs-vsCodeDarkTheme'],
      font: SUPPORTED_FONTS_DICTIONARY['jetbrains-mono'],
    },
  },
});
