import {defineEditorTheme} from '../../core';

export const palette = {
  constant: '#ffdf9b',
  foreground: '#222244',
  numbers: '#f3c1ff',
  strings: '#7af8ca',
  className: '#FFCB6B',
  lineNumbers: '#5b6395',
  punctuation: '#7fdaff',
  function: '#34d3fb',
  keywords: '#c5a0eb',
  cursor: '#70b0ff',
  comments: '#7e8eda',
  base: '#ffffff',
  tag: '#9effff',
  property: '#ffdb8e',
  selection: '#717CB450',
  text: '#FAD000',
  white: '#FFFFFF',
  self: '#ff757f',
  module: '#34d3fb',
  regexp: '#a6eefb',
};

export const moonlight = [
  defineEditorTheme({
    highlight: {
      punctuation: palette.punctuation,
      delimiters: palette.punctuation,
      numbers: palette.numbers,
      strings: palette.strings,
      variableName: palette.property,
      keywords: palette.keywords,
      base: palette.base,
      tag: palette.tag,
      boolean: palette.numbers,
      comments: palette.comments,
      propertyName: palette.property,
      function: palette.function,
      className: palette.className,
      self: palette.self,
      moduleKeyword: palette.module,
      regexp: palette.regexp,
    },
    selection: {
      backgroundColor: palette.selection,
      color: palette.white,
    },
    lineNumbers: {
      color: palette.lineNumbers,
    },
    cursor: {
      color: palette.cursor,
    },
    autocomplete: {
      background: '#212539',
      border: palette.property,
      selectedBackground: '#34d3fb',
    },
    darkMode: true,
  }),
];
