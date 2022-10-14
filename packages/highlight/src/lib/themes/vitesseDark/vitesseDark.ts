import {defineEditorTheme} from '../../core';

export const palette = {
  foreground: '#121212',
  comment: '#758575',
  string: '#d48372',
  literal: '#429988',
  keyword: '#4d9375',
  boolean: '#1c6b48',
  number: '#6394bf',
  variable: '#c2b36e',
  function: '#a1b567',
  deleted: '#a14f55',
  class: '#54b1bf',
  builtin: '#e0a569',
  property: '#dd8e6e',
  namespace: '#db889a',
  punctuation: '#858585',
  decorator: '#bd8f8f',
  regex: '#ab5e3f',
  lineNumber: '#888888',
  selectionBackground: '#444444',
};

export const vitesseDark = [
  defineEditorTheme({
    highlight: {
      punctuation: palette.punctuation,
      delimiters: palette.punctuation,
      numbers: palette.number,
      strings: palette.string,
      boolean: palette.boolean,
      regexp: palette.regex,
      variableName: palette.property,
      keywords: palette.keyword,
      base: palette.string,
      tag: palette.punctuation,
      comments: palette.comment,
      propertyName: palette.property,
      className: palette.class,
      function: palette.function,
    },
    selection: {},
    lineNumbers: {
      color: palette.lineNumber,
    },
    cursor: {
      color: palette.punctuation,
    },
    autocomplete: {
      background: palette.string,
      border: palette.punctuation,
      selectedBackground: palette.selectionBackground,
    },
    darkMode: true,
  }),
];
