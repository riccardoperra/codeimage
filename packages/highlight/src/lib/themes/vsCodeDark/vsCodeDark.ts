import {EditorView} from '@codemirror/view';
import {defineEditorTheme} from '../../core';

export const background = '#262335';
const foreground = 'hsl(204, 3%, 98%)';
const identifier = 'hsl(204, 98%, 80%)';
const selection = 'hsl(210, 52%, 31%)';
const selectionMatch = 'hsl(210, 12%, 22%)';
const matchingBracket = 'hsla(204, 3%, 80%, 0.5)';
const lineNumber = 'hsl(204, 3%, 50%)';
const activeLine = 'hsla(204, 3%, 20%, 0.4)';
const keyword = 'hsl(207, 65%, 59%)';
const comment = 'hsl(101, 33%, 47%)';
const number = 'hsl(99, 28%, 73%)';
const string = 'hsl(17, 60%, 64%)';
const func = 'hsl(60,42%,76%)';
const regex = 'hsl(0, 60%, 62%)';
const tag = 'hsl(168, 60%, 55%)';
const purple = '#C586C0';
const yellow = '#DBD700';

export const vsCodeDark = [
  defineEditorTheme({
    selection: {
      backgroundColor: selection,
      activeLine: activeLine,
    },
    lineNumbers: {
      color: lineNumber,
    },
    cursor: {
      color: foreground,
    },
    highlight: {
      base: identifier,
      tag,
      keywords: keyword,
      comments: comment,
      numbers: number,
      strings: string,
      function: func,
      regexp: regex,
      boolean: number,
      propertyName: identifier,
      variableName: identifier,
      punctuation: foreground,
      attrValue: string,
      className: tag,
      delimiters: foreground,
      annotation: string,
      moduleKeyword: purple,
      brackets: yellow,
      paren: yellow,
      typeName: tag,
    },
    darkMode: true,
    autocomplete: {
      background: '#1E1E1E',
      selectedBackground: '#191818',
    },
  }),
  EditorView.theme({
    '.cm-matchingBracket': {
      backgroundColor: selectionMatch,
      outline: `1px solid ${matchingBracket}`,
    },
  }),
];
