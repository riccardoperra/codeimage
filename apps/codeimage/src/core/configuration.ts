import {
  createConfiguration,
  SUPPORTED_LANGUAGES,
  SUPPORTED_LOCALES,
  SUPPORTED_THEMES,
} from '@codeimage/config';
import {version} from '../../package.json';
import {lazy} from 'solid-js';

interface CustomFontType {
  name: string;
  weight: number;
}

interface CustomFonts {
  id: string;
  name: string;
  types: CustomFontType[];
}

const LazyMacOsTerminal = lazy(
  () => import('../components/Terminal/macOS/MacOsTerminal'),
);

const LazyWindowsTerminal = lazy(
  () => import('../components/Terminal/windows/WindowsTerminal'),
);

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
      {
        id: 'overpass-mono',
        name: 'Overpass Mono',
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
          component: LazyWindowsTerminal,
        },
        macOs: {
          name: 'macOs',
          component: LazyMacOsTerminal,
        },
      },
    },
  });
