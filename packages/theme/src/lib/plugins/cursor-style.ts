import {EditorView} from '@codemirror/view';

export interface StyledCursorOptions {
  color: string;
}

export function styledCursor(options: StyledCursorOptions) {
  return EditorView.theme({
    '.cm-cursor, .cm-dropCursor': {borderLeftColor: options.color},
  });
}
