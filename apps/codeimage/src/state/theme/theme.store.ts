import type {CustomTheme} from '@codeimage/highlight';
import {
  createResource,
  type ResourceReturn,
} from '@codeimage/store/plugins/create-resource';
import {provideAppState} from '@codeimage/store/index';
import {THEME_REGISTRY} from '@codeimage/store/theme/themeRegistry';
import {createMemo} from 'solid-js';
import {defineSignal} from 'statebuilder';

const ThemeStore = defineSignal(() => false).extend(loaded => {
  const themes = Object.fromEntries(
    Object.values(THEME_REGISTRY).map(
      theme => [theme.id, createResource(loaded, theme.load)] as const,
    ),
  );

  const resources = Object.values(themes).map(([theme]) => theme);
  const themeArray = () => resources;

  const themeLoading = createMemo(() =>
    themeArray().some(theme => theme.loading),
  );

  const getThemeResource = (
    themeId: string,
  ): ResourceReturn<CustomTheme | undefined> => themes[themeId];

  const getThemeDef = (id: string) =>
    THEME_REGISTRY.find(theme => theme.id === id);

  const loadThemes = () => loaded.set(true);

  return {
    themeResources: themes,
    themeArray,
    themeLoading,
    getThemeDef,
    getThemeResource,
    loadThemes,
  } as const;
});

export function getThemeStore() {
  return provideAppState(ThemeStore);
}
