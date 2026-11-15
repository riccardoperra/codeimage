// Colors from microsoft/vscode fde6187a0, MIT, Copyright Microsoft Corporation.
import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {EditorView} from '@codemirror/view';
import {tags as t} from '@lezer/highlight';
import {defineEditorTheme} from '../../core';

export const background = '#FFFFFF';
export const foreground = '#202020';

export const vsCodeLight2026 = [
  // Tags the shared keys can't tell apart from plain keywords or punctuation. First in the list so it outranks defineEditorTheme.
  syntaxHighlighting(
    HighlightStyle.define([
      {tag: [t.controlKeyword, t.operatorKeyword], color: '#AF00DB'},
      {tag: [t.modifier, t.null, t.special(t.brace)], color: '#0000ff'},
      {tag: t.function(t.punctuation), color: '#cf222e'},
    ]),
  ),
  EditorView.theme({
    '&': {backgroundColor: background},
    '.cm-activeLine': {backgroundColor: '#EAEAEA40'},
    '.cm-matchingBracket': {
      backgroundColor: '#0069CC40',
      outline: '1px solid #F0F1F2',
    },
  }),
  defineEditorTheme({
    darkMode: false,
    selection: {
      backgroundColor: '#0069CC40',
    },
    cursor: {
      color: '#202020',
    },
    lineNumbers: {
      color: '#606060',
    },
    autocomplete: {
      background: '#FAFAFD',
      border: '#E4E5E6',
      selectedBackground: '#00000025',
      selectedColor: '#202020',
    },
    highlight: {
      base: '#202020',
      background: '#FFFFFF',
      keywords: '#cf222e',
      strings: '#0a3069',
      comments: '#6e7781',
      numbers: '#098658',
      function: '#8250df',
      tag: '#116329',
      typeName: '#267f99',
      className: '#267f99',
      propertyName: '#1f2328',
      variableName: '#1f2328',
      variableNameSpecial: '#0550ae',
      regexp: '#0a3069',
      boolean: '#0000ff',
      attrName: '#e50000',
      attrValue: '#0a3069',
      moduleKeyword: '#AF00DB',
      self: '#0550ae',
      operators: '#000000',
      punctuation: '#202020',
      delimiters: '#202020',
      brackets: '#202020',
      paren: '#202020',
      annotation: '#8250df',
      meta: '#0000ff',
      atom: '#0000ff',
      quote: '#116329',
    },
  }),
];
