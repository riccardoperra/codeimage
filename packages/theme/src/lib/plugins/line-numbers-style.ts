import {EditorView} from '@codemirror/view';

export interface StyledLineNumbersOptions {
  color: string;
}

export function styledLineNumbers(options: StyledLineNumbersOptions) {
  return EditorView.theme({
    '.cm-lineNumbers .cm-gutterElement': {color: options.color},
  });
}
