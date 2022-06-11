import {CustomTheme} from '@codeimage/highlight';

export const THEME_REGISTRY: Record<string, () => Promise<CustomTheme>> = {
  // prettier-ignore
  coldarkCold: () => import('@codeimage/highlight/coldarkCold').then(m => m.coldarkColdTheme),
  // prettier-ignore
  coldarkDark: () => import('@codeimage/highlight/coldarkDark').then(m => m.coldarkDarkTheme),
  // prettier-ignore
  dracula: () => import('@codeimage/highlight/dracula').then(m => m.draculaTheme),
  // prettier-ignore
  duotoneDark: () => import('@codeimage/highlight/duotoneDark').then(m => m.duotoneDarkTheme),
  // prettier-ignore
  duotoneSea: () => import('@codeimage/highlight/duotoneSea').then(m => m.duotoneSeaTheme),
  // prettier-ignore
  light: () => import('@codeimage/highlight/light').then(m => m.lightTheme),
  // prettier-ignore
  materialLight: () => import('@codeimage/highlight/materialLight').then(m => m.materialLightTheme),
  // prettier-ignore
  materialOcean: () => import('@codeimage/highlight/materialOcean').then(m => m.materialOceanTheme),
  // prettier-ignore
  materialPalenight: () => import('@codeimage/highlight/materialPalenight').then(m => m.materialPalenightTheme),
  // prettier-ignore
  materialVolcano: () => import('@codeimage/highlight/materialVolcano').then(m => m.materialVolcanoTheme),
  // prettier-ignore
  nightOwl: () => import('@codeimage/highlight/nightOwl').then(m => m.nightOwlTheme),
  // prettier-ignore
  oneDark: () => import('@codeimage/highlight/oneDark').then(m => m.oneDarkTheme),
  // prettier-ignore
  synthwave84: () => import('@codeimage/highlight/synthwave84').then(m => m.synthwave84Theme),
  // prettier-ignore
  vsCodeDark: () => import('@codeimage/highlight/vsCodeDark').then(m => m.vsCodeDarkTheme),
};
