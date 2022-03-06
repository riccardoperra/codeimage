import {
  drawSelection,
  dropCursor,
  highlightSpecialChars,
  keymap,
} from '@codemirror/view';
import {EditorState, Extension} from '@codemirror/state';
import {indentOnInput} from '@codemirror/language';
import {defaultKeymap} from '@codemirror/commands';
import {bracketMatching} from '@codemirror/matchbrackets';
import {closeBrackets, closeBracketsKeymap} from '@codemirror/closebrackets';
import {searchKeymap} from '@codemirror/search';
import {autocompletion, completionKeymap} from '@codemirror/autocomplete';
import {commentKeymap} from '@codemirror/comment';
import {rectangularSelection} from '@codemirror/rectangular-selection';
import {defaultHighlightStyle} from '@codemirror/highlight';
import {lintKeymap} from '@codemirror/lint';

export const EDITOR_BASE_SETUP: Extension = [
  highlightSpecialChars(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  defaultHighlightStyle.fallback,
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...commentKeymap,
    ...completionKeymap,
    ...lintKeymap,
  ]),
];
