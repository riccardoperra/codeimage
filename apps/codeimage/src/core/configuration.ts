import {
  createConfiguration,
  SUPPORTED_LANGUAGES,
  SUPPORTED_LOCALES,
  SUPPORTED_THEMES,
} from '@codeimage/config';
import {WindowsTerminal} from '../components/Terminal/windows/WindowsTerminal';
import {MacOsTerminal} from '../components/Terminal/macOS/MacOsTerminal';
import {version} from '../../package.json';

interface CustomFontType {
  name: string;
  weight: number;
}

interface CustomFonts {
  id: string;
  name: string;
  types: CustomFontType[];
}

export const [staticConfiguration, useStaticConfiguration] =
  createConfiguration({
    version,
    locales: SUPPORTED_LOCALES,
    themes: SUPPORTED_THEMES,
    languages: SUPPORTED_LANGUAGES,
    fonts: [
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
        id: 'jetbrains-mono',
        name: 'Jetbrains Mono',
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
    ] as readonly CustomFonts[],
    terminalThemes: {
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
    },
  });
