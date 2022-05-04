import {defineEditorTheme} from '../../core';

const selection = '#8da1b950';
const foreground = '#66cccc';

export const palette = {
  white: '#FFFFFF',
  gray: '#e3eaf2',
  gray2: '#8da1b9',
  cyan: '#66cccc',
  yellow: '#e6d37a',
  blue: '#005a8e',
  green: '#116b00',
  pink: '#af00af',
  pink2: '#7c00aa',
  orange: '#a04900',
  black: '#111b27',
  greenDark: '#006d6d',
  brown: '#755f00',
};

export const coldarkCold = defineEditorTheme({
  darkMode: false,
  highlight: {
    comments: palette.gray2,
    punctuation: palette.greenDark,
    tag: palette.greenDark,
    attrName: palette.brown,
    boolean: palette.brown,
    numbers: palette.brown,
    className: palette.blue,
    propertyName: palette.black,
    variableName: palette.blue,
    strings: palette.green,
    attrValue: palette.green,
    regexp: palette.pink,
    function: palette.pink,
    keywords: palette.orange,
    operators: palette.orange,
    self: palette.blue,
    base: palette.greenDark,
    delimiters: palette.greenDark,
    paren: palette.pink2,
    annotation: palette.greenDark,
    variableNameSpecial: palette.black,
  },
  autocomplete: {
    background: '#142231',
    selectedBackground: '#122335',
    selectedColor: '#e9ae7e',
  },
  selection: {
    backgroundColor: selection,
    color: palette.white,
  },
  cursor: {
    color: foreground,
  },
});
