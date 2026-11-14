// Colors from microsoft/vscode fde6187a0, MIT, Copyright Microsoft Corporation.
import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {EditorView} from '@codemirror/view';
import {tags as t} from '@lezer/highlight';
import {defineEditorTheme} from '../../core';

export const background = '#121314';
export const foreground = '#BBBEBF';

export const vsCodeDark2026 = [
  // Tags the shared keys can't tell apart from plain keywords or punctuation. First in the list so it outranks defineEditorTheme.
  syntaxHighlighting(
    HighlightStyle.define([
      {tag: [t.controlKeyword, t.operatorKeyword], color: '#C586C0'},
      {tag: [t.modifier, t.null, t.special(t.brace)], color: '#569cd6'},
      {tag: t.function(t.punctuation), color: '#ff7b72'},
    ]),
  ),
  EditorView.theme({
    '&': {backgroundColor: background},
    '.cm-activeLine': {backgroundColor: '#242526'},
    '.cm-matchingBracket': {
      backgroundColor: '#3994BC55',
      outline: '1px solid #2A2B2C',
    },
  }),
  defineEditorTheme({
    darkMode: true,
    selection: {
      backgroundColor: '#276782dd',
    },
    cursor: {
      color: '#BBBEBF',
    },
    lineNumbers: {
      color: '#858889',
    },
    autocomplete: {
      background: '#202122',
      border: '#2A2B2C',
      selectedBackground: '#FFFFFF26',
      selectedColor: '#bfbfbf',
    },
    highlight: {
      base: '#BBBEBF',
      background: '#121314',
      keywords: '#ff7b72',
      strings: '#a5d6ff',
      comments: '#8b949e',
      numbers: '#b5cea8',
      function: '#d2a8ff',
      tag: '#7ee787',
      typeName: '#4EC9B0',
      className: '#4EC9B0',
      propertyName: '#c9d1d9',
      variableName: '#c9d1d9',
      variableNameSpecial: '#79c0ff',
      regexp: '#a5d6ff',
      boolean: '#569cd6',
      attrName: '#9cdcfe',
      attrValue: '#a5d6ff',
      moduleKeyword: '#C586C0',
      self: '#79c0ff',
      operators: '#d4d4d4',
      punctuation: '#BBBEBF',
      delimiters: '#BBBEBF',
      brackets: '#BBBEBF',
      paren: '#BBBEBF',
      annotation: '#d2a8ff',
      meta: '#569cd6',
      atom: '#569cd6',
      quote: '#7ee787',
    },
  }),
];
