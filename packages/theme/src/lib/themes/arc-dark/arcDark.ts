import {HighlightStyle, tags as t} from '@codemirror/highlight';
import {EditorView} from '@codemirror/view';

export const palette = {
  background: '#1C1F26',
  gray: '#383c4a',
  grayLight: '#a2a2a2',
  magenta: '#c35f9b',
  green: '#61bc3b',
  greenLight: '#91ff58',
  orange: '#f3b43a',
  red: '#d64937',
  indigo: '#5294e2',
  cyanLight: '#37c3d6',
  cyan: '#37c3d6',
  cyanDark: '#288e9c',
  violet: '#a8b4de',
};

const highlightStyle = HighlightStyle.define([
  {tag: [t.keyword, t.constant], color: palette.indigo},
  {tag: [t.string], color: palette.orange},
  {tag: [t.escape], color: palette.greenLight},
  {tag: [t.number, t.bool], color: palette.orange},
  {tag: [t.operator], color: palette.cyan},
  {tag: [t.brace, t.paren], color: palette.magenta},
  {tag: [t.comment], color: palette.violet, fontStyle: 'italic'},
  {tag: [t.special], color: palette.indigo},
  {tag: [t.className], color: palette.cyanDark},
  {tag: [t.attributeName], color: palette.red},
  {tag: [t.attributeValue], color: palette.orange},
  {
    tag: [t.function],
    color: palette.cyanDark,
  },
  {tag: [t.function(t.variableName)], color: palette.cyan},
  {tag: [t.propertyName], color: palette.indigo},
  {tag: [t.variableName], color: palette.cyan},
  {tag: [t.moduleKeyword], color: palette.magenta},
]);

const theme = EditorView.theme(
  {
    '&': {
      color: palette.grayLight,
      backgroundColor: palette.background,
    },

    '.cm-content': {
      caretColor: palette.cyan,
    },

    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: palette.cyan,
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {backgroundColor: `${palette.cyan}25`},
    '.cm-panels': {
      backgroundColor: palette.background,
      color: palette.grayLight,
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
      outline: `1px solid ${palette.cyan}50`,
    },

    '.cm-gutters': {
      backgroundColor: `${palette.cyan}60`,
      color: palette.cyan,
      border: 'none',
    },

    '.cm-activeLineGutter': {
      backgroundColor: palette.cyan,
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
        backgroundColor: `${palette.cyan}50`,
      },
    },
  },
  {
    dark: true,
  },
);
export const arcDark = [highlightStyle, theme];
