import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {tags as t} from '@lezer/highlight';
import {defineEditorTheme} from '../../core';

export const palette = {
  red: '#e53935',
  orange: '#f76d47',
  yellow: '#FFB62C',
  purple: '#7c4dff',
  silver: '#6182b8',
  sea: '#39adb5',
  blue: '#0066ff',
  pink: '#c754d5',
  violet: '#6218cc',
  gray: '#aabfc9',
  gray2: '#cceae7',
  green: '#91B87D',

  darkGray: '#263238',
};

export const materialLight = [
  defineEditorTheme({
    darkMode: false,
    selection: {
      backgroundColor: palette.gray2,
      color: palette.darkGray,
    },
    cursor: {color: palette.purple},
    lineNumbers: {color: palette.gray},
    autocomplete: {
      background: '#fff',
      selectedBackground: '#a971ff',
      selectedColor: '#fff',
      border: '#a971ff',
    },
    highlight: {
      typeName: palette.yellow,
      base: palette.gray,
      tag: palette.red,
      strings: palette.green,
      annotation: palette.purple,
      delimiters: palette.sea,
      regexp: palette.silver,
      boolean: palette.orange,
      className: palette.yellow,
      variableName: palette.pink,
      keywords: palette.purple,
      function: palette.blue,
      comments: palette.gray,
      numbers: palette.red,
      punctuation: palette.sea,
      moduleKeyword: palette.sea,
      paren: palette.purple,
      brackets: palette.silver,
      propertyName: palette.pink,
    },
  }),
  syntaxHighlighting(
    HighlightStyle.define([
      {
        tag: t.variableName,
        color: palette.violet,
      },
      {
        tag: t.name,
        color: palette.pink,
      },
    ]),
  ),
];
