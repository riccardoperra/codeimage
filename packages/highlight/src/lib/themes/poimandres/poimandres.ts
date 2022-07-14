import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {tags as t} from '@lezer/highlight';
import {defineEditorTheme} from '../../core';

export const palette = {
  brightYellow: '#fffac2',
  brightMint: '#5DE4c7',
  lowerMint: '#5fb3a1',
  blueishGreen: '#42675A',
  lowerBlue: '#89ddff',
  lightBlue: '#ADD7FF',
  desaturatedBlue: '#91B4D5',
  bluishGrayBrighter: '#7390AA',
  hotRed: '#d0679d',
  pink: '#f087bd',
  gray: '#a6accd',
  lighterGray: '#c0cad5',
  darkerGray: '#767c9d',
  bluishGray: '#506477',
  focus: '#303340',
  bg: '#1b1e28',
  offWhite: '#e4f0fb',
  selection: '#717cb4',
  white: '#ffffff',
  black: '#000000',
};

export const poimandres = [
  syntaxHighlighting(
    HighlightStyle.define([
      {tag: t.definitionKeyword, color: palette.desaturatedBlue},
      {tag: t.controlKeyword, color: palette.lowerMint},
      {
        tag: t.comment,
        fontStyle: 'italic',
      },
      {tag: t.processingInstruction, color: palette.lighterGray},
      {
        tag: [t.definition(t.function(t.variableName))],
        color: palette.lightBlue,
      },
      {
        tag: [t.literal],
        color: palette.brightMint,
      },
    ]),
  ),
  defineEditorTheme({
    highlight: {
      keywords: palette.brightMint,
      strings: palette.brightMint,
      numbers: palette.brightMint,
      boolean: palette.hotRed,
      operators: palette.desaturatedBlue,
      brackets: palette.gray,
      paren: palette.gray,
      comments: palette.darkerGray,
      attrValue: palette.desaturatedBlue,
      function: palette.lighterGray,
      attrName: palette.desaturatedBlue,
      typeName: palette.darkerGray,
      propertyName: palette.lightBlue,
      variableName: palette.brightMint,
      moduleKeyword: palette.brightMint,
      tag: palette.brightMint,
      base: palette.offWhite,
      delimiters: palette.gray,
      regexp: palette.brightMint,
      self: palette.brightMint,
      punctuation: palette.gray,
      className: palette.lightBlue,
      meta: palette.brightMint,
    },
    darkMode: true,
    autocomplete: {
      background: palette.bg,
      selectedBackground: `${palette.selection}50`,
    },
    cursor: {
      color: palette.gray,
    },
    selection: {
      backgroundColor: `${palette.selection}25`,
    },
    lineNumbers: {
      color: palette.darkerGray,
    },
  }),
];
