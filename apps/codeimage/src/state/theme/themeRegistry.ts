import {CustomTheme} from '@codeimage/highlight';

interface ThemeRegistryEntry {
  id: string;
  load: () => Promise<CustomTheme>;
}

export const THEME_REGISTRY: ReadonlyArray<ThemeRegistryEntry> = [
  {
    id: 'vsCodeDark',
    // prettier-ignore
    load: () => import('@codeimage/highlight/vsCodeDark').then(m => m.vsCodeDarkTheme),
  },
  {
    id: 'nightOwl',
    // prettier-ignore
    load: () => import('@codeimage/highlight/nightOwl').then(m => m.nightOwlTheme),
  },
  {
    id: 'dracula',
    // prettier-ignore
    load: () => import('@codeimage/highlight/dracula').then(m => m.draculaTheme),
  },
  {
    id: 'materialOcean',
    // prettier-ignore
    load: () => import('@codeimage/highlight/materialOcean').then(m => m.materialOceanTheme),
  },
  {
    id: 'synthwave84',
    // prettier-ignore
    load: () => import('@codeimage/highlight/synthwave84').then(m => m.synthwave84Theme),
  },
  {
    id: 'materialVolcano',
    // prettier-ignore
    load: () => import('@codeimage/highlight/materialVolcano').then(m => m.materialVolcanoTheme),
  },
  {
    id: 'oneDark',
    // prettier-ignore
    load: () => import('@codeimage/highlight/oneDark').then(m => m.oneDarkTheme),
  },
  {
    id: 'light',
    // prettier-ignore
    load: () => import('@codeimage/highlight/light').then(m => m.lightTheme),
  },
  {
    id: 'materialPalenight',
    // prettier-ignore
    load: () => import('@codeimage/highlight/materialPalenight').then(m => m.materialPalenightTheme),
  },
  {
    id: 'duotoneSea',
    // prettier-ignore
    load: () => import('@codeimage/highlight/duotoneSea').then(m => m.duotoneSeaTheme),
  },
  {
    id: 'duotoneDark',
    // prettier-ignore
    load: () => import('@codeimage/highlight/duotoneDark').then(m => m.duotoneDarkTheme),
  },
  {
    id: 'coldarkCold',
    // prettier-ignore
    load: () => import('@codeimage/highlight/coldarkCold').then(m => m.coldarkColdTheme),
  },
  {
    id: 'coldarkDark',
    // prettier-ignore
    load: () => import('@codeimage/highlight/coldarkDark').then(m => m.coldarkDarkTheme),
  },
  {
    id: 'materialLight',
    // prettier-ignore
    load: () => import('@codeimage/highlight/materialLight').then(m => m.materialLightTheme),
  },
];
