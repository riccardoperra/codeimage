import {THEME_REGISTRY} from '@codeimage/store/theme/themeRegistry';
import {createMemo, createResource, createRoot, mapArray} from 'solid-js';

function $getThemeStore() {
  const themes = Object.fromEntries(
    Object.values(THEME_REGISTRY).map(
      theme => [theme.id, createResource(theme.load)] as const,
    ),
  );

  const themeArray = mapArray(
    () => Object.values(themes),
    ([theme]) => theme,
  );

  const themeLoading = createMemo(() =>
    themeArray().some(theme => theme.loading),
  );

  const getThemeResource = (themeId: string) => themes[themeId];

  const getThemeDef = (id: string) =>
    THEME_REGISTRY.find(theme => theme.id === id);

  return {
    themeResources: themes,
    themeArray,
    themeLoading,
    getThemeDef,
    getThemeResource,
  } as const;
}

export const themeStore = createRoot($getThemeStore);

export function getThemeStore() {
  return themeStore;
}
