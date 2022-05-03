import {defineEditorTheme} from '../../core';

const selection = '#3c526d';
const foreground = '#66cccc';

export const palette = {
  white: '#FFFFFF',
  gray: '#e3eaf2',
  gray2: '#8da1b9',
  cyan: '#66cccc',
  yellow: '#e6d37a',
  blue: '#6cb8e6',
  green: '#91d076',
  pink: '#f4adf4',
  pink2: '#c699e3',
  orange: '#e9ae7e',
};

export const coldarkDark = defineEditorTheme({
  autocomplete: {
    background: '#142231',
    selectedBackground: '#122335',
    selectedColor: palette.orange,
  },
  highlight: {
    comments: palette.gray2,
    punctuation: palette.cyan,
    tag: palette.cyan,
    attrName: palette.yellow,
    boolean: palette.yellow,
    numbers: palette.yellow,
    className: palette.blue,
    propertyName: palette.blue,
    variableName: palette.blue,
    strings: palette.green,
    attrValue: palette.green,
    regexp: palette.pink,
    function: palette.pink,
    keywords: palette.orange,
    operators: palette.orange,
    self: palette.blue,
    base: palette.gray,
    annotation: palette.gray,
    delimiters: palette.yellow,
  },
  darkMode: true,
  selection: {
    backgroundColor: selection,
    color: palette.white,
  },
  cursor: {
    color: foreground,
  },
});
