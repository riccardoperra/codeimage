import {CustomTheme} from '@codeimage/highlight';
import {defineEditorTheme, ThemeJsonDefinition} from '@codeimage/highlight';
import {THEME_REGISTRY} from '@codeimage/store/theme/themeRegistry';
import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {Tag, tags as AvailableTags, tags as t} from '@lezer/highlight';
import {
  createMemo,
  createResource,
  createRoot,
  createSignal,
  mapArray,
  ResourceReturn,
} from 'solid-js';
import {makeFetch} from '../../data-access/client';

type TagKey = keyof typeof AvailableTags;
type TagKeyFn = {fn: TagKey; param: TagKey};

type AvailableTag = TagKey | TagKeyFn;

export const parseThemeJson = (definitions: ThemeJsonDefinition) => {
  return definitions.map(definition => {
    switch (definition.type) {
      case 'themeOption':
        return defineEditorTheme(definition.data);
      case 'customSyntax':
        return syntaxHighlighting(
          HighlightStyle.define(
            definition.data.map(tagDefinition => {
              const {tag} = tagDefinition;

              const mapTag = (availableTag: AvailableTag) => {
                if (typeof availableTag === 'string') {
                  return t[availableTag];
                }
                if ('fn' in availableTag) {
                  console.log('fn', availableTag.param, availableTag.fn);
                  const fn = t[availableTag.fn] as (tag: Tag) => Tag;
                  const param = t[availableTag.param] as {} as Tag;
                  console.log('is fn', fn, 'is param', param);
                  return fn(param);
                }
              };

              const mappedTags = Array.isArray(tag)
                ? tag.map(item => mapTag(item))
                : mapTag(tag);

              console.log(mappedTags);

              return {...tagDefinition, tag: mappedTags as Tag[]};
            }),
          ),
        );
    }
  });
};

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

  const env = import.meta.env;
  const BASE_URL = env.VITE_API_BASE_URL ?? '';

  const [themeArray2] = createResource(
    () =>
      makeFetch(`${BASE_URL}/api/v1/preset/themes`, {
        method: 'GET',
      })
        .then(res => res.json())
        .then(res => {
          return res.map(item =>
            Object.assign(item, {
              editorTheme: parseThemeJson(item.editorTheme),
            }),
          );
        })
        .then(res => {
          console.log(res);
          return res;
        }),
    {initialValue: []},
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
    themeArray2,
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
