import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {tags} from '@lezer/highlight';
import {defineEditorTheme} from '../../core';

export const palette = {
  background: '#261f3e',
  white: '#ffffff',
  purple: '#848bbd',
  orange: '#ff8b39',
  pink: '#ff7edb',
  yellow: '#fede5d',
  coral: '#f97e72',
  cyan: '#36f9f6',
  red: '#fe4450',
  green: '#72f1b8',
  gray: '#34294f66',
};

export const synthwave84 = [
  syntaxHighlighting(
    HighlightStyle.define([
      {
        tag: [tags.operator],
        color: palette.cyan,
      },
    ]),
  ),
  defineEditorTheme({
    darkMode: true,
    selection: {
      backgroundColor: `${palette.purple}25`,
    },
    autocomplete: {
      border: 'none',
      background: palette.background,
      selectedBackground: `${palette.coral}50`,
    },
    lineNumbers: {
      color: `${palette.white}50`,
    },
    cursor: {
      color: palette.orange,
    },
    highlight: {
      strings: palette.orange,
      base: palette.pink,
      punctuation: palette.orange,
      tag: palette.red,
      annotation: palette.red,
      variableName: palette.pink,
      regexp: palette.orange,
      numbers: palette.orange,
      comments: palette.purple,
      brackets: palette.yellow,
      className: palette.red,
      function: palette.cyan,
      keywords: palette.yellow,
      background: palette.background,
      delimiters: palette.white,
      meta: palette.red,
      propertyName: palette.pink,
      attrName: palette.pink,
      attrValue: palette.orange,
      self: palette.red,
      typeName: palette.red,
      paren: palette.yellow,
      operators: palette.orange,
    },
  }),
];
