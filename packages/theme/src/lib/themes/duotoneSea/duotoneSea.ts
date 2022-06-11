import {defineEditorTheme} from '../../core';

const palette = {
  green: '#0aa370',
  gray: '#4a5f78',
  white: '#d6e9ff',
  silver: '#88B4E7',
  yellow: '#FFC91E',
  green2: '#47ebb4',
  green3: '#32AE85',
};

export const duotoneSea = defineEditorTheme({
  darkMode: true,
  cursor: {
    color: palette.green,
  },
  selection: {
    backgroundColor: palette.gray,
    color: palette.white,
  },
  autocomplete: {
    background: palette.green,
    selectedColor: palette.white,
    selectedBackground: palette.green2,
  },
  highlight: {
    punctuation: palette.white,
    comments: palette.gray,
    numbers: palette.green,
    function: palette.white,
    propertyName: palette.silver,
    strings: palette.green2,
    regexp: palette.green2,
    typeName: palette.green,
    className: palette.white,
    boolean: palette.green,
    self: palette.silver,
    variableName: palette.green3,
    tag: palette.white,
    base: palette.silver,
    keywords: palette.green3,
    delimiters: palette.white,
    annotation: palette.white,
    paren: palette.yellow,
    attrName: palette.green,
    attrValue: palette.silver,
  },
});
