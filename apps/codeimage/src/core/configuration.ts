import {
  createConfiguration,
  SUPPORTED_LANGUAGES,
  SUPPORTED_LOCALES,
  SUPPORTED_THEMES,
} from '@codeimage/config';
import {WindowsTerminal} from '../components/Terminal/windows/WindowsTerminal';
import {MacOsTerminal} from '../components/Terminal/macOS/MacOsTerminal';
import {version} from '../../package.json';
import {createProvider} from 'solid-use';

interface CustomFontType {
  name: string;
  weight: number;
}

interface CustomFonts {
  id: string;
  name: string;
  types: CustomFontType[];
}

export const AVAILABLE_FONTS: readonly CustomFonts[] = [
  {
    id: 'jetbrains-mono',
    name: 'Jetbrains Mono',
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'source-code-pro',
    name: 'Source Code pro',
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'overpass-mono',
    name: 'Overpass Mono',
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
];

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

export const [staticConfiguration] = createConfiguration({
  version,
  support: {
    shareApi: !!navigator.share,
  },
  locales: SUPPORTED_LOCALES,
  themes: SUPPORTED_THEMES,
  languages: SUPPORTED_LANGUAGES,
  editorPadding: [16, 32, 64, 128],
  fonts: AVAILABLE_FONTS,
  terminalThemes: AVAILABLE_TERMINAL_THEMES,
});

const EnvironmentProvider = createProvider({
  ...staticConfiguration,
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
      languageId: staticConfiguration.languages[0].id,
      themeId: staticConfiguration.themes[0].id,
      fontId: staticConfiguration.fonts[0].id,
      fontWeight: staticConfiguration.fonts[0].types[0].weight,
    },
  },
});

export {EnvironmentProvider};
