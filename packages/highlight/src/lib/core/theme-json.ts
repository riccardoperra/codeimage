import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import type {tags as AvailableTags} from '@lezer/highlight';
import {Tag, tags as t} from '@lezer/highlight';

import {defineEditorTheme, ThemeOptions} from './define-editor-theme';

type TagKey = keyof typeof AvailableTags;
type TagKeyFn = {fn: TagKey; param: TagKey};

type AvailableTag = TagKey | TagKeyFn;

export type TagStyle = {
  tag: AvailableTag | AvailableTag[];
  class?: string;
  [styleProperty: string]: any;
};

export type ThemeJson =
  | {type: 'themeOption'; data: EditorThemeDefinition}
  | {type: 'customSyntax'; data: TagStyle[]};

export type ThemeJsonDefinition = ReadonlyArray<ThemeJson>;

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

type EditorThemeDefinition = ThemeOptions;
