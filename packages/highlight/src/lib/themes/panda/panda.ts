import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {tags} from '@lezer/highlight';
import {defineEditorTheme} from '../../core';

export const palette = {
  background: '#292A2B',
  text: '#ffffff',
  text2: '#bebebe',
  punctuation: '#E6E6E6',
  orange: '#FFB86C',
  strings: '#19F9D8',
  property: '#E6E6E6',
  comments: '#676B79',
  className: '#E6E6E6',
  function: '#6FC1FF',
  brackets: '#E6E6E6',
  accent: '#FF75B5',
  self: '#FF9AC1',
};

export const panda = [
  syntaxHighlighting(
    HighlightStyle.define([
      {
        tag: tags.controlKeyword,
        color: palette.accent,
      },
    ]),
  ),
  defineEditorTheme({
    highlight: {
      base: palette.text,
      punctuation: palette.punctuation,
      delimiters: palette.punctuation,
      numbers: palette.orange,
      strings: palette.strings,
      regexp: palette.strings,
      variableName: palette.property,
      keywords: palette.orange,
      tag: palette.text,
      comments: palette.comments,
      propertyName: '#6FC1FF',
      className: palette.className,
      function: palette.function,
      brackets: palette.brackets,
      boolean: palette.orange,
      moduleKeyword: palette.accent,
      operators: palette.punctuation,
      self: palette.self,
      typeName: palette.punctuation,
    },
    selection: {},
    lineNumbers: {
      color: palette.text2,
    },
    cursor: {
      color: palette.text2,
    },
    autocomplete: {
      background: palette.text,
      border: palette.text2,
      selectedBackground: palette.strings,
    },
    darkMode: true,
  }),
];
