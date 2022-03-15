import {HighlightStyle, tags as t} from '@codemirror/highlight';
import {EditorView} from '@codemirror/view';

export const palette = {
  background: '#262335',
  white: '#ffffff',
  purple: '#848bbd',
  orange: '#ff8b39',
  pink: '#ff7edb',
  yellow: '#fede5d',
  coral: '#f97e72',
  cyan: '#36f9f6',
  red: '#fe4450',
};

const hg = HighlightStyle.define([
  {tag: [t.comment], color: palette.purple, fontStyle: 'italic'},
  {tag: [t.string, t.quote, t.punctuation], color: palette.orange},
  {tag: [t.constant(t.variableName)], color: palette.cyan},
  {tag: [t.variableName], color: palette.pink},
  {
    tag: [t.function(t.variableName)],
    color: palette.cyan,
  },
  {tag: [t.modifier, t.bracket], color: palette.yellow},
  {tag: [t.constant, t.number, t.regexp], color: palette.coral},
  {tag: [t.escape], color: palette.cyan},
  {tag: [t.className], color: palette.red},
  {tag: [t.attributeName], color: palette.yellow},
  {tag: [t.function], color: palette.cyan},
  {
    tag: [t.keyword, t.controlKeyword, t.operator, t.operatorKeyword],
    color: palette.yellow,
  },
  {
    tag: [t.literal, t.propertyName],
    color: palette.pink,
  },
  {tag: t.color, color: palette.coral},
]);

const theme = EditorView.theme(
  {
    '&': {
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
      color: palette.coral,
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

    '.cm-activeLine': {
      backgroundColor: palette.background,
      border: 'none',
    },

    '.cm-selectionMatch': {backgroundColor: palette.background},

    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: `${palette.background}50`,
      outline: `1px solid ${palette.purple}50`,
    },

    '.cm-gutters': {
      backgroundColor: `transparent`,
      color: `${palette.white}50`,
      border: 'none',
    },

    '.cm-activeLineGutter': {
      color: palette.white,
      backgroundColor: 'transparent',
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
        backgroundColor: `${palette.coral}50`,
      },
    },
  },
  {
    dark: true,
  },
);
export const synthwave84 = [hg, theme];
