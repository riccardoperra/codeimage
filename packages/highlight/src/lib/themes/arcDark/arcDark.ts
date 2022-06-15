import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {tags as t} from '@lezer/highlight';
import {defineEditorTheme} from '../../core';

export const palette = {
  background: '#0a0b0e',
  gray: '#383c4a',
  grayLight: '#a2a2a2',
  pink: '#C586C0',
  magenta: '#c35f9b',
  green1: '#608b4e',
  green: '#61bc3b',
  greenLight: '#91ff58',
  orange: '#f3b43a',
  red: '#d64937',
  red2: '#d16969',
  indigo: '#569cd6',
  sea: '#4EC9B0',
  cyanLight: '#37c3d6',
  yellow1: '#DCDCAA',
  blue1: '#9CDCFE',
  cyan: '#37c3d6',
  cyanDark: '#288e9c',
  violet: '#a8b4de',
  gray2: '#d4d4d4',
  yellow2: '#d7ba7d',
  orange2: '#ce9178',
};

export const arcDark = [
  defineEditorTheme({
    highlight: {
      keywords: palette.indigo,
      strings: palette.orange2,
      numbers: palette.orange,
      boolean: palette.orange,
      operators: palette.gray2,
      brackets: palette.magenta,
      paren: palette.magenta,
      comments: palette.green1,
      className: palette.cyanDark,
      attrValue: palette.orange,
      attrName: palette.yellow1,
      function: palette.yellow1,
      typeName: palette.sea,
      propertyName: palette.green,
      variableName: palette.blue1,
      moduleKeyword: palette.magenta,
      tag: palette.green,
      base: palette.cyanLight,
      variableNameSpecial: palette.green1,
      delimiters: palette.indigo,
      regexp: palette.red2,
      self: palette.indigo,
    },
    darkMode: true,
    autocomplete: {
      background: palette.background,
      selectedBackground: `${palette.cyan}50`,
    },
    cursor: {
      color: palette.cyan,
    },
    selection: {
      backgroundColor: `${palette.cyan}25`,
    },
    lineNumbers: {
      color: palette.grayLight,
    },
  }),
  syntaxHighlighting(
    HighlightStyle.define([{tag: t.controlKeyword, color: palette.pink}]),
  ),
];
