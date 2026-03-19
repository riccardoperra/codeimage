import {EditorView} from '@codemirror/view';
import type {StyledAutoCompleteOptions} from '../plugins/autocomplete-style';
import {styledAutocomplete} from '../plugins/autocomplete-style';
import type {StyledCursorOptions} from '../plugins/cursor-style';
import {styledCursor} from '../plugins/cursor-style';
import type {StyledHighlightOptions} from '../plugins/highlight-style';
import {styledHighlight} from '../plugins/highlight-style';
import type {StyledLineNumbersOptions} from '../plugins/line-numbers-style';
import {styledLineNumbers} from '../plugins/line-numbers-style';
import type {StyledSelectionOptions} from '../plugins/selection-style';
import {styledSelection} from '../plugins/selection-style';

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
    styledSelection({
      backgroundColor: selection?.backgroundColor ?? `${highlight.keywords}50`,
      color: selection?.color ?? 'inherit',
    }),
    styledAutocomplete(autocomplete),
    styledHighlight(highlight),
  ];
};
