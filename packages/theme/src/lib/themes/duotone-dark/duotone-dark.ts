import {defineEditorTheme} from '../../core';

const selection = '#5b5b7b';
const foreground = '#f8f8f2';

export const palette = {
  white: '#FFFFFF',
  violet: '#6c6783',
  orange: '#e09142',
  indigo: '#9a86fd',
  pink: '#c4b9fe',
  salmon: '#ffcc99',
};

export const duotoneDark = defineEditorTheme({
  darkMode: true,
  autocomplete: {
    background: '#211f2a',
    selectedBackground: '#1d1b28',
    selectedColor: '#9a86fd',
  },
  selection: {
    backgroundColor: selection,
    color: palette.white,
  },
  cursor: {
    color: foreground,
  },
  highlight: {
    comments: palette.violet,
    punctuation: palette.violet,
    tag: palette.orange,
    operators: palette.orange,
    numbers: palette.orange,
    propertyName: palette.indigo,
    function: palette.indigo,
    attrName: palette.pink,
    boolean: palette.salmon,
    strings: palette.salmon,
    attrValue: palette.salmon,
    regexp: palette.salmon,
    keywords: palette.salmon,
    variableName: palette.salmon,
    base: palette.white,
    delimiters: palette.violet,
    annotation: palette.violet,
  },
});
