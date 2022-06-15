import {EditorView} from '@codemirror/view';

export interface StyledAutoCompleteOptions {
  background: string;
  border?: string;
  selectedBackground: string;
  selectedColor?: string;
}

export function styledAutocomplete(options: StyledAutoCompleteOptions) {
  return EditorView.theme({
    '.cm-tooltip': {
      border: options.border ? `1px solid ${options.border}` : 'none',
      backgroundColor: options.background,
      borderRadius: '6px',
    },

    '.cm-tooltip .cm-tooltip-arrow:before': {
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
      borderTopColor: options.background,
      borderBottomColor: options.background,
    },

    '.cm-tooltip-autocomplete': {
      '& > ul > li': {
        padding: '6px !important',
      },
      '& > ul > li[aria-selected]': {
        backgroundColor: options.selectedBackground,
        color: options.selectedColor ?? 'inherit',
      },
    },
  });
}
