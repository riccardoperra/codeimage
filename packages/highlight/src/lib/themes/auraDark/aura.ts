import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {tags as t} from '@lezer/highlight';
import {defineEditorTheme} from '../../core';

export const palette = {
  background: '#15141b',
  gray: '#6d6d6d',
  pink: '#f694ff',
  white: '#f8f8f2',
  green: '#61ffca	',
  yellow: '#f1fa8c',
  violet: '#6272A444',
  purple: '#a277ff',
  blue: '#82e2ff',
  red: '#FF5555',
  orange: '#ffca85',
} as const;

export const aura = [
  syntaxHighlighting(
    HighlightStyle.define([
      {tag: t.self, fontStyle: 'italic'},
      {tag: t.typeName, fontStyle: 'italic'},
      {tag: [t.bracket], color: palette.white},
      {tag: [t.meta], color: palette.pink},
      {tag: [t.punctuation], color: palette.pink},
      {
        // Needed for JSXStartTag / JSXEndTag
        tag: [t.angleBracket],
        color: palette.orange,
      },
      {
        tag: [t.standard(t.tagName)],
        color: palette.green,
      },
    ]),
  ),
  defineEditorTheme({
    highlight: {
      comments: palette.gray,
      strings: palette.green,
      numbers: palette.green,
      variableName: palette.white,
      variableNameSpecial: palette.green,
      operators: palette.purple,
      keywords: palette.purple,
      atom: palette.green,
      attrName: palette.white,
      attrValue: palette.white,
      propertyName: palette.pink,
      tag: palette.white,
      function: palette.orange,
      regexp: palette.green,
      base: palette.white,
      delimiters: palette.red,
      brackets: palette.white,
      self: palette.purple,
      annotation: palette.purple,
      className: palette.blue,
      moduleKeyword: palette.purple,
      typeName: palette.blue,
      boolean: palette.green,
      meta: palette.green,
      quote: palette.white,
    },
    cursor: {
      color: palette.gray,
    },
    autocomplete: {
      background: palette.background,
      border: palette.violet,
      selectedColor: palette.white,
      selectedBackground: `${palette.purple}50`,
    },
    lineNumbers: {
      color: palette.violet,
    },
    selection: {
      backgroundColor: `${palette.purple}25`,
      color: palette.white,
    },
    darkMode: true,
  }),
];
