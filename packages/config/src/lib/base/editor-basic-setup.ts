import {Extension} from '@codemirror/state';
import {
  drawSelection,
  dropCursor,
  highlightSpecialChars,
  keymap,
} from '@codemirror/view';
import {historyKeymap} from '@codemirror/history';
import {defaultKeymap} from '@codemirror/commands';
import {closeBrackets, closeBracketsKeymap} from '@codemirror/closebrackets';
import {autocompletion, completionKeymap} from '@codemirror/autocomplete';
import {commentKeymap} from '@codemirror/comment';
import {bracketMatching} from '@codemirror/matchbrackets';
import {defaultHighlightStyle} from '@codemirror/highlight';
import {indentOnInput} from '@codemirror/language';
import {rectangularSelection} from '@codemirror/rectangular-selection';

export const EDITOR_BASE_SETUP: Extension = [
  highlightSpecialChars(),
  drawSelection(),
  dropCursor(),
  indentOnInput(),
  defaultHighlightStyle.fallback,
  bracketMatching(),
  closeBrackets(),
  rectangularSelection(),
  autocompletion({icons: true, activateOnTyping: false, aboveCursor: true}),
  // TODO: fix history plugin
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...historyKeymap,
    ...commentKeymap,
    ...completionKeymap,
  ]),
];
