import {HighlightStyle, tags as t} from '@codemirror/highlight';
import {EditorView} from '@codemirror/view';

export const palette = {
  background: '#282a36',
  cyan: '#8be9fd',
  pink: '#ff79c6',
  white: '#f8f8f2',
  green: '#50fa7b',
  yellow: '#f1fa8c',
  violet: '#6272a4',
  purple: '#bd93f9',
};

const highlightStyle = HighlightStyle.define([
  {
    tag: [
      t.string,
      t.meta,
      t.name,
      t.typeName,
      t.special,
      t.variableName,
      t.escape,
      t.quote,
    ],
    color: palette.yellow,
  },

  {tag: [t.propertyName], color: palette.white},
]);

const hg = HighlightStyle.define([
  {tag: [t.keyword], color: palette.pink},
  {tag: [t.literal], color: palette.yellow},
  {tag: [t.className], color: palette.cyan},
  {tag: [t.comment, t.deleted], color: palette.purple},
  {tag: [t.tagName], color: palette.cyan},
  {tag: [t.attributeName], color: palette.green},

  {
    tag: [t.link, t.color],
    color: palette.cyan,
  },

  {
    tag: [t.propertyName],
    color: palette.white,
  },

  {
    tag: [t.function],
    color: palette.green,
  },

  {
    tag: [t.heading, t.attributeValue, t.meta, t.annotation],
    fontStyle: 'italic',
    color: palette.green,
  },

  {
    tag: [t.variableName],
    color: palette.purple,
  },

  {
    tag: [t.function(t.variableName), t.labelName],
    color: palette.green,
  },
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
      backgroundColor: `${palette.violet}60`,
      color: palette.violet,
      border: 'none',
    },

    '.cm-activeLineGutter': {
      backgroundColor: palette.violet,
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
        backgroundColor: `${palette.violet}50`,
      },
    },
  },
  {
    dark: true,
  },
);
export const dracula = [hg, highlightStyle, theme];
