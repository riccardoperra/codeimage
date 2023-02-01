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
    id: 'githubDark',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.githubDarkTheme),
  },
  {
    id: 'githubDarkDimmed',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.githubDarkDimmedTheme),
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
    id: 'poimandres',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.poimandresTheme),
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
    id: 'panda',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.pandaTheme),
  },
  {
    id: 'aura',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.auraTheme),
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
    id: 'githubLight',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.githubLightTheme),
  },
  {
    id: 'moonlight',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.moonlightTheme),
  },
  {
    id: 'vitesseDark',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.vitesseDarkTheme),
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
    id: 'shadeOfPurple',
    // prettier-ignore
    load: () => import('@codeimage/highlight/themes').then(m => m.shadeOfPurpleTheme),
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
