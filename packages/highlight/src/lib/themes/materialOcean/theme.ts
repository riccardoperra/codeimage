import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {tags as t} from '@lezer/highlight';
import {defineEditorTheme} from '../../core';

export const palette = {
  white: '#ffffff',
  black: '#000000',
  red: '#f07178',
  orange: '#F78C6C',
  yellow: '#FFCB6B',
  green: '#C3E88D',
  cyan: '#89DDFF',
  blue: '#82AAFF',
  paleblue: '#B2CCD6',
  purple: '#C792EA',
  brown: '#916b53',
  pink: '#ff9cac',
  violet: '#bb80b3',
  backgroundAlt: '#212d33',
  defaultAccent: '#80CBC4',
  background: '#263238',
  comments: '#546E7A',
  caret: '#FFCC00',
  lineHighlight: '#000000',
  foreground: '#EEFFFF',
  selection: '#80CBC420',
  lineNumbers: '#37474F',
};

export const materialOcean = [
  syntaxHighlighting(
    HighlightStyle.define([
      {tag: [t.escape], color: palette.foreground},
      {
        tag: [t.url, t.escape, t.regexp, t.operatorKeyword, t.operator],
        color: palette.cyan,
      },
      {tag: [t.squareBracket], color: palette.yellow},
      {tag: [t.angleBracket], color: palette.cyan},
      {tag: [t.bracket], color: palette.purple},
      {tag: [t.brace], color: palette.cyan},
      {tag: [t.definition(t.variableName)], color: palette.paleblue},
    ]),
  ),

  defineEditorTheme({
    darkMode: true,
    selection: {
      backgroundColor: `${palette.purple}25`,
    },
    autocomplete: {
      background: palette.background,
      selectedBackground: `${palette.lineHighlight}50`,
      border: palette.defaultAccent,
    },
    cursor: {
      color: palette.caret,
    },
    lineNumbers: {
      color: palette.lineNumbers,
    },
    highlight: {
      tag: palette.green,
      base: palette.white,
      comments: palette.comments,
      punctuation: palette.cyan,
      variableNameSpecial: palette.purple,
      paren: palette.cyan,
      operators: palette.cyan,
      attrName: palette.purple,
      attrValue: palette.green,
      function: palette.blue,
      keywords: palette.purple,
      quote: palette.blue,
      className: palette.yellow,
      strings: palette.green,
      numbers: palette.orange,
      variableName: palette.white,
      regexp: palette.yellow,
      propertyName: palette.blue,
      annotation: palette.cyan,
      boolean: palette.pink,
      delimiters: palette.white,
      moduleKeyword: palette.blue,
      typeName: palette.red,
      self: palette.red,
      brackets: palette.yellow,
    },
  }),
];
