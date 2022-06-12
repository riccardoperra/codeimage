import {CustomTheme} from '@codeimage/highlight';

interface ThemeRegistryEntry {
  id: string;
  load: () => Promise<CustomTheme>;
}

export const THEME_REGISTRY: ReadonlyArray<ThemeRegistryEntry> = [
  {
    id: 'vsCodeDarkTheme',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.vsCodeDarkTheme),
  },
  {
    id: 'nightOwl',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.nightOwlTheme),
  },
  {
    id: 'dracula',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.draculaTheme),
  },
  {
    id: 'materialOcean',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.materialOceanTheme),
  },
  {
    id: 'synthwave84',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.synthwave84Theme),
  },
  {
    id: 'materialVolcano',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.materialVolcanoTheme),
  },
  {
    id: 'oneDark',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.oneDarkTheme),
  },
  {
    id: 'light',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.lightTheme),
  },
  {
    id: 'materialPalenight',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.materialPalenightTheme),
  },
  {
    id: 'duotoneSea',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.duotoneSeaTheme),
  },
  {
    id: 'duotoneDark',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.duotoneDarkTheme),
  },
  {
    id: 'coldarkCold',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.coldarkColdTheme),
  },
  {
    id: 'coldarkDark',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.coldarkDarkTheme),
  },
  {
    id: 'materialLight',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.materialLightTheme),
  },
];
