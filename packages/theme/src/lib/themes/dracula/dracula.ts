import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {tags as t} from '@lezer/highlight';
import {defineEditorTheme} from '../../core';

export const palette = {
  background: '#282a36',
  gray: '#f8f8f0',
  cyan: '#8BE9FD',
  pink: '#FF79C6',
  white: '#f8f8f2',
  green: '#50FA7B',
  yellow: '#f1fa8c',
  violet: '#6272A4',
  purple: '#BD93F9',
  blue: '#66d9ef',
  red: '#FF5555',
  orange: '#FFB86C',
};

export const dracula = [
  syntaxHighlighting(
    HighlightStyle.define([
      {tag: t.self, fontStyle: 'italic'},
      {tag: t.definition(t.variableName), color: palette.orange},
    ]),
  ),
  defineEditorTheme({
    highlight: {
      comments: palette.purple,
      strings: palette.yellow,
      numbers: palette.purple,
      variableName: palette.green,
      variableNameSpecial: palette.white,
      operators: palette.pink,
      keywords: palette.pink,
      atom: palette.purple,
      attrName: palette.cyan,
      attrValue: palette.white,
      propertyName: palette.blue,
      tag: palette.green,
      function: palette.green,
      regexp: palette.yellow,
      base: palette.white,
      delimiters: palette.red,
      brackets: palette.cyan,
      self: palette.purple,
      annotation: palette.pink,
      punctuation: palette.cyan,
      className: palette.cyan,
      moduleKeyword: palette.pink,
      typeName: palette.cyan,
      boolean: palette.purple,
      meta: palette.green,
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
