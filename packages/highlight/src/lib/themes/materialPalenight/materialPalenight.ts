import {defineEditorTheme} from '../../core';

export const palette = {
  indigoDark: '#676e95',
  pink: '#bb80b3',
  indigo: '#82aaff',
  orange: '#f78c6c',
  yellow: '#ffcb6b',
  pink2: '#c792ea',
  green: '#c3e88d',
  cyan: '#89ddff',
  red: '#f07178',
  selection: '#7580B850',
  white: '#FFFFFF',
  gray: '#D6E9FF',
};

export const materialPalenight = defineEditorTheme({
  darkMode: true,
  highlight: {
    comments: palette.indigoDark,
    attrName: palette.pink,
    function: palette.indigo,
    boolean: palette.orange,
    numbers: palette.orange,
    className: palette.yellow,
    propertyName: palette.yellow,
    atom: palette.yellow,
    keywords: palette.pink2,
    variableName: palette.green,
    regexp: palette.green,
    attrValue: palette.green,
    strings: palette.green,
    operators: palette.cyan,
    punctuation: palette.cyan,
    tag: palette.red,
    base: palette.gray,
    delimiters: palette.cyan,
    annotation: palette.gray,
  },
  autocomplete: {
    background: '#1f212e',
    selectedBackground: '#181923',
    selectedColor: palette.yellow,
  },
  selection: {
    backgroundColor: palette.selection,
    color: palette.white,
  },
  lineNumbers: {
    color: palette.indigoDark,
  },
  cursor: {
    color: palette.yellow,
  },
});
