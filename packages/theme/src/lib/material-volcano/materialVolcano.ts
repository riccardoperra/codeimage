import {HighlightStyle, tags as t} from '@codemirror/highlight';
import {EditorView} from '@codemirror/view';

export const palette = {
  background: '#200000',
  cyan: '#89DDFF',
  sand: '#7F6451',
  indigo: '#82AAFF',
  purple: '#C792EA',
  orange: '#F78C6C',
  white: '#C3CEE3',
  green: '#C3E88D',
  yellow: '#FFCB6B',
  red: '#FF5370',
  brown: '#7F3C3C',
};

const highlightStyle = HighlightStyle.define([
  {tag: [t.keyword], color: palette.purple},
  {tag: [t.string], color: palette.green},
  {tag: [t.number], color: palette.orange},
  {tag: [t.operator], color: palette.cyan},
  {tag: [t.brace, t.paren], color: palette.cyan},
  {tag: [t.comment], color: palette.sand},
  {tag: [t.special], color: palette.indigo},
  {tag: [t.constant], color: palette.orange},
  {tag: [t.className], color: palette.yellow},
  {tag: [t.deleted], color: palette.red},
  {tag: [t.comment, t.deleted], color: palette.purple},
  {tag: [t.attributeName], color: palette.yellow},
  {tag: [t.attributeValue], color: palette.green},
  {
    tag: [t.function],
    color: palette.indigo,
  },
  {tag: [t.function(t.variableName)], color: palette.orange},
  {tag: [t.propertyName], color: palette.indigo},
  {tag: [t.variableName], color: palette.orange},
]);

const theme = EditorView.theme(
  {
    '&': {
      color: palette.white,
      backgroundColor: palette.background,
    },

    '.cm-content': {
      caretColor: palette.purple,
    },

    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: palette.purple,
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {backgroundColor: `${palette.purple}25`},
    '.cm-panels': {
      backgroundColor: palette.background,
      color: palette.white,
    },
    '.cm-panels.cm-panels-top': {borderBottom: '2px solid black'},
    '.cm-panels.cm-panels-bottom': {borderTop: '2px solid black'},

    '.cm-searchMatch': {
      backgroundColor: '#72a1ff59',
      outline: '1px solid #457dff',
    },

    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#6199ff2f',
    },

    '.cm-activeLine': {backgroundColor: palette.background},
    '.cm-selectionMatch': {backgroundColor: palette.background},

    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: `${palette.background}50`,
      outline: `1px solid ${palette.purple}50`,
    },

    '.cm-gutters': {
      backgroundColor: `${palette.brown}60`,
      color: palette.brown,
      border: 'none',
    },

    '.cm-activeLineGutter': {
      backgroundColor: palette.brown,
    },

    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#ddd',
    },

    '.cm-tooltip': {
      border: 'none',
      backgroundColor: palette.background,
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
      borderTopColor: palette.background,
      borderBottomColor: palette.background,
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: `${palette.brown}50`,
      },
    },
  },
  {
    dark: true,
  },
);
export const materialVolcano = [highlightStyle, theme];
