import {defineEditorTheme} from '../../core';

const selection = '#1d3b54';
const foreground = '#d6b007';

const palette = {
  white: '#FFFFFF',
  greenDark: '#446e69',
  yellow: '#d6b007',
  red: '#e60067',
  orange: '#ec8e01',
  cyan: '#78f3e9',
  green: '#0fe468',
  blue: '#49c6ec',
};

export const holi = defineEditorTheme({
  highlight: {
    boolean: palette.yellow,
    numbers: palette.yellow,
    tag: palette.yellow,
    propertyName: palette.blue,
    attrValue: palette.red,
    operators: palette.orange,
    keywords: palette.green,
    function: palette.cyan,
    base: palette.white,
    delimiters: palette.yellow,
    variableName: palette.white,
    comments: palette.greenDark,
    annotation: palette.greenDark,
    strings: palette.blue,
    regexp: palette.yellow,
  },
  cursor: {
    color: foreground,
  },
  selection: {
    backgroundColor: selection,
    color: palette.white,
  },
  autocomplete: {
    background: '#122f6d',
    selectedBackground: '#1a1a82',
    selectedColor: '#d6b007',
  },
  darkMode: true,
});
