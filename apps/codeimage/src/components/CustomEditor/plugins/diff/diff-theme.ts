import {EditorView} from '@codemirror/view';

export const colors = {
  remove: '#ff226e',
  add: '#12af12',
};

export const diffTheme = EditorView.theme({
  '.cm-remove-line': {
    backgroundColor: `${colors.remove}25`,
  },
  '.cm-add-line': {
    backgroundColor: `${colors.add}25`,
  },
});
