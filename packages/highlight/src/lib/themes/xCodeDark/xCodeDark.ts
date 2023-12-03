import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {tags} from '@lezer/highlight';
import {defineEditorTheme} from '../../core';

const colors = {
  pink: '#FF79B2',
  violetLight: '#E5CFFF',
  violet: '#D9BBFF',
  purple: '#BB81FE',
  cyan: '#5FBCDC',
  orange: '#FE6465',
  gray3: '#727377',
  gray2: '#7F8C98',
  green: '#8AD1C2',
  green3: '#ACF2E4',
  blue: '#4FB0CB',
  yellow: '#FEE98B',
};

export const palette = {
  foreground: '#1F1F24',
  text: '#CECFD0',
  text2: '#bebebe',
  punctuation: '#fff',
  numbers: colors.yellow,
  strings: colors.orange,
  property: colors.green,
  keywords: colors.pink,
  comments: colors.gray2,
  className: colors.cyan,
  function: colors.violet,
};

export const xCodeDark = [
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
      typeName: colors.violetLight,
      attrName: colors.purple,
    },
    selection: {
      color: '#0000000f',
      backgroundColor: '#0000000f',
      activeLine: '#0000000f',
    },
    lineNumbers: {
      color: palette.text2,
    },
    cursor: {
      color: palette.text2,
    },
    autocomplete: {
      background: '#202020',
      border: '#3c3c3c',
      selectedBackground: colors.purple,
      selectedColor: '#fff',
    },
    darkMode: true,
  }),
];
