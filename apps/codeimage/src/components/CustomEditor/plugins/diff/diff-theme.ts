import {EditorView} from '@codemirror/view';

export const colors = {
  removeLine: 'hsla(339, 100%, 57%, 25%)',
  addLine: 'hsl(120, 81%, 38%, 25%)',
};

export const diffTheme = EditorView.theme({
  '.cm-remove-line': {
    backgroundColor: colors.removeLine,
  },
  '.cm-add-line': {
    backgroundColor: colors.addLine,
  },
});
