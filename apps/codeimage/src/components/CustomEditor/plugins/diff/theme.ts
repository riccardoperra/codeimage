import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {EditorView} from '@codemirror/view';
import {tags} from '@lezer/highlight';
import {diffExtensionConstants} from './state';

export const colors = {
  removeLine: 'hsla(339, 100%, 57%, 25%)',
  removeToken: 'hsla(339, 100%, 57%, 100%)',
  addLine: 'hsl(120, 81%, 38%, 25%)',
  addToken: 'hsl(120, 81%, 38%, 100%)',
};

const dataAttrRemoved = `${diffExtensionConstants.decoratedLineDataAttribute}=${diffExtensionConstants.lineDeleted}`;
const dataAttrAdded = `${diffExtensionConstants.decoratedLineDataAttribute}=${diffExtensionConstants.lineInserted}`;
export const theme = [
  EditorView.theme({
    [`.cm-line[${dataAttrRemoved}]`]: {
      backgroundColor: colors.removeLine,
    },
    [`.cm-line[${dataAttrAdded}]`]: {
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
