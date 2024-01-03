import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {EditorView} from '@codemirror/view';
import {tags} from '@lezer/highlight';

export const colors = {
  removeLine: 'hsla(339, 100%, 57%, 25%)',
  removeToken: 'hsla(339, 100%, 57%, 100%)',
  addLine: 'hsl(120, 81%, 38%, 25%)',
  addToken: 'hsl(120, 81%, 38%, 100%)',
};

export const diffTheme = [
  EditorView.theme({
    '.cm-remove-line': {
      backgroundColor: colors.removeLine,
    },
    '.cm-add-line': {
      backgroundColor: colors.addLine,
    },
  }),
  syntaxHighlighting(
    HighlightStyle.define([
      {tag: tags.inserted, color: colors.addToken},
      {tag: tags.deleted, color: colors.removeToken},
    ]),
  ),
];
