import {EditorView} from '@codemirror/view';

export interface StyledLineNumbersOptions {
  color: string;
}

export function styledLineNumbers(options: StyledLineNumbersOptions) {
  return EditorView.theme({
    '.cm-gutter .cm-gutterElement': {color: options.color},
  });
}
