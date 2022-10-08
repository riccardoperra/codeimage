import {defineEditorTheme} from '../../core';

export const palette = {
  constant: '#FFEE80',
  foreground: '#222244',
  numbers: '#c42f98',
  strings: '#92FC79',
  className: ' #59e366',
  lineNumbers: '#A599E9',
  punctuation: '#E1EFFF',
  function: '#FAD000',
  keywords: '#FF9D00',
  cursor: '#FAD000',
  comments: '#B362FF',
  base: '#59e3de',
  tag: '#9effff',
  property: '#FFEE80',
  selection: '#B362FF88',
  text: '#FAD000',
  white: '#FFFFFF',
};

export const shadeOfPurple = [
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
