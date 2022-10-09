import {defineEditorTheme} from '../../core';

export const palette = {
  constant: '#FFEE80',
  foreground: '#2d2a2e',
  numbers: '#AE81FF',
  strings: '#E6DB74',
  className: ' #59e366',
  lineNumbers: '#535059',
  punctuation: '#E1EFFF',
  function: '#7be8b2',
  keywords: '#5acfed',
  cursor: '#f8f8f0',
  comments: '#535059',
  base: '#ffffff',
  tag: '#9effff',
  property: '#FFEE80',
  selection: '#878b9180',
  text: '#FAD000',
  white: '#FFFFFF',
  self:'#afb8ba',
  module: '#d358db',
  operator: '#fa0089',
  annotation: '#fa0089'
};

export const monokaiPro = [
  defineEditorTheme({
    highlight: {
      punctuation: palette.punctuation,
      delimiters: palette.punctuation,
      numbers: palette.numbers,
      strings: palette.strings,
      regexp: palette.strings,
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
      operators: palette.operator,
      annotation: palette.annotation
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
      background: palette.strings,
      border: palette.property,
      selectedBackground: palette.strings,
    },
    darkMode: true,
  }),
];
