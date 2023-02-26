import {CustomTheme} from '@codeimage/highlight';
import {THEME_REGISTRY} from '@codeimage/store/theme/themeRegistry';
import {
  createMemo,
  createResource,
  createRoot,
  createSignal,
  mapArray,
  ResourceReturn,
} from 'solid-js';

function $getThemeStore() {
  const [loaded, setLoaded] = createSignal(false, {equals: false});

  const themes = Object.fromEntries(
    Object.values(THEME_REGISTRY).map(
      theme => [theme.id, createResource(loaded, theme.load)] as const,
    ),
  );

  const themeArray = mapArray(
    () => Object.values(themes),
    ([theme]) => theme,
  );

  const themeLoading = createMemo(() =>
    themeArray().some(theme => theme.loading),
  );

  const getThemeResource = (themeId: string): ResourceReturn<CustomTheme> =>
    themes[themeId];

  const getThemeDef = (id: string) =>
    THEME_REGISTRY.find(theme => theme.id === id);

  const loadThemes = () => setLoaded(true);

  return {
    themeResources: themes,
    themeArray,
    themeLoading,
    getThemeDef,
    getThemeResource,
    loadThemes,
  } as const;
}

export const themeStore = createRoot($getThemeStore);

export function getThemeStore() {
  return themeStore;
}
