import {THEME_REGISTRY} from '@codeimage/store/theme/themeRegistry';
import {createMemo, createResource, createRoot, mapArray} from 'solid-js';

function $getThemeRegistry() {
  const themes = Object.values(THEME_REGISTRY).map(theme =>
    createResource(theme),
  );

  const themeArray = mapArray(
    () => themes,
    ([theme]) => theme,
  );

  const themeLoading = createMemo(() =>
    themeArray().some(theme => theme.loading),
  );

  return {
    themeResources: themes,
    themeArray,
    themeLoading,
  };
}

export const themeStore = createRoot($getThemeRegistry);

export function getThemeStore() {
  return themeStore;
}
