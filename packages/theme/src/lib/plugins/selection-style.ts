import {EditorView} from '@codemirror/view';

export interface StyledSelectionOptions {
  backgroundColor: string;
  color: string;
  activeLine?: string;
}

export function styledSelection(options: StyledSelectionOptions) {
  return EditorView.theme({
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {
        background: options.backgroundColor,
      },
    '.cm-activeLine': {
      backgroundColor: options.activeLine ?? 'unset',
    },
  });
}
