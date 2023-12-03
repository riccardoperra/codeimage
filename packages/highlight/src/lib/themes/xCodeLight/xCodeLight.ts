import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {tags} from '@lezer/highlight';
import {defineEditorTheme} from '../../core';

const colors = {
  pink: '#c541ad',
  violetDark: '#573E93',
  violet: '#9157ea',
  purple: '#59458B',
  orange: '#D23423',
  gray3: '#727377',
  gray2: '#7F8C98',
  blue: '#326C81',
  darkBlue: '#322397',
  darkGreen: '#1E566A',
};

export const palette = {
  foreground: '#FFF',
  text: '#191919',
  text2: '#CACACA',
  punctuation: '#1F1F24',
  numbers: colors.darkBlue,
  strings: colors.orange,
  property: colors.darkGreen,
  keywords: colors.pink,
  comments: colors.gray2,
  className: colors.darkGreen,
  function: colors.violet,
};

export const xCodeLight = [
  syntaxHighlighting(
    HighlightStyle.define([
      {
        tag: [tags.angleBracket],
        color: colors.purple,
      },
      {
        tag: [tags.definition(tags.variableName)],
        color: colors.blue,
      },
    ]),
  ),
  defineEditorTheme({
    highlight: {
      punctuation: palette.punctuation,
      delimiters: palette.punctuation,
      numbers: palette.numbers,
      strings: palette.strings,
      regexp: palette.strings,
      meta: colors.violet,
      variableName: palette.property,
      keywords: palette.keywords,
      base: palette.text,
      tag: colors.violet,
      comments: palette.comments,
      propertyName: palette.property,
      className: palette.className,
      function: palette.function,
      typeName: colors.darkGreen,
      attrName: colors.purple,
    },
    selection: {
      color: colors.gray3,
      activeLine: '#ffffff0f',
    },
    lineNumbers: {
      color: palette.text2,
    },
    cursor: {
      color: palette.text2,
    },
    autocomplete: {
      background: '#fff',
      border: '#c5c5c5',
      selectedBackground: colors.violetDark,
      selectedColor: '#fff',
    },
    darkMode: true,
  }),
];
