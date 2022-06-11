import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {tags as t} from '@lezer/highlight';
import {defineEditorTheme} from '../../core';

export const palette = {
  background: '#2a0303',
  cyan: '#89DDFF',
  sand: '#7F6451',
  indigo: '#82AAFF',
  purple: '#C792EA',
  orange: '#F78C6C',
  white: '#C3CEE3',
  coral: '#FF9CAC',
  green: '#C3E88D',
  yellow: '#FFCB6B',
  red: '#FF5370',
  brown: '#7F3C3C',
  gray: '#B2CCD6',
};

export const materialVolcano = [
  defineEditorTheme({
    darkMode: true,
    selection: {
      backgroundColor: `${palette.purple}25`,
    },
    autocomplete: {
      selectedColor: palette.gray,
      background: palette.background,
      selectedBackground: `${palette.brown}50`,
    },
    cursor: {
      color: palette.purple,
    },
    lineNumbers: {
      color: palette.brown,
    },
    highlight: {
      base: palette.white,
      comments: palette.sand,
      paren: palette.cyan,
      punctuation: palette.cyan,
      operators: palette.cyan,
      attrName: palette.yellow,
      attrValue: palette.green,
      function: palette.indigo,
      keywords: palette.purple,
      className: palette.yellow,
      strings: palette.green,
      numbers: palette.orange,
      variableName: palette.indigo,
      regexp: palette.yellow,
      propertyName: palette.indigo,
      annotation: palette.cyan,
      boolean: palette.coral,
      delimiters: palette.white,
      tag: palette.red,
      atom: palette.purple,
      meta: palette.purple,
      moduleKeyword: palette.indigo,
      typeName: palette.yellow,
      self: palette.red,
      brackets: palette.cyan,
    },
  }),
  syntaxHighlighting(
    HighlightStyle.define([
      {tag: t.null, color: palette.orange},
      {tag: t.typeOperator, color: palette.purple},
      {tag: t.labelName, color: palette.red},
      {tag: t.variableName, color: palette.orange},
      {tag: [t.function(t.variableName)], color: palette.yellow},
    ]),
  ),
];

// export const materialVolcano = [highlightStyle, highlight];
