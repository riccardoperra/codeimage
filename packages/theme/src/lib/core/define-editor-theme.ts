import {EditorView} from '@codemirror/view';
import {
  styledAutocomplete,
  StyledAutoCompleteOptions,
} from '../plugins/autocomplete-style';
import {styledCursor, StyledCursorOptions} from '../plugins/cursor-style';
import {
  styledHighlight,
  StyledHighlightOptions,
} from '../plugins/highlight-style';
import {
  styledLineNumbers,
  StyledLineNumbersOptions,
} from '../plugins/line-numbers-style';
import {
  styledSelection,
  StyledSelectionOptions,
} from '../plugins/selection-style';

export interface ThemeOptions {
  darkMode: boolean;
  selection?: Partial<StyledSelectionOptions>;
  cursor?: StyledCursorOptions;
  lineNumbers?: StyledLineNumbersOptions;
  autocomplete: StyledAutoCompleteOptions;
  highlight: StyledHighlightOptions;
}

export const defineEditorTheme = (theme: ThemeOptions) => {
  const {darkMode, highlight, selection, autocomplete, cursor, lineNumbers} =
    theme;

  const base = EditorView.theme({
    '&': {
      color: highlight.base,
      background: highlight.background ?? '#000000bf',
    },
  });

  return [
    base,
    styledCursor({
      color: cursor?.color ?? (darkMode ? '#FFF' : '#000'),
    }),
    lineNumbers?.color
      ? styledLineNumbers({
          color: lineNumbers?.color ?? (darkMode ? '#FFF' : '#000'),
        })
      : [],
    styledHighlight(highlight),
    styledSelection({
      backgroundColor: selection?.backgroundColor ?? `${highlight.keywords}50`,
      color: selection?.color ?? 'inherit',
    }),
    styledAutocomplete(autocomplete),
  ];
};
