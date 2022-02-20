import {Extension} from '@codemirror/state';
import {HighlightStyle, tags as t} from '@codemirror/highlight';
import {EditorView} from '@codemirror/view';

export const palette = {
  defaultAccent: '#80CBC4',
  background: '#263238',
  backgroundAlt: '#263238',
  contrastBorder: '#263238',
  comments: '#546E7A',
  caret: '#FFCC00',
  findHighlight: '#FFCC00',
  foreground: '#EEFFFF',
  focusBorder: '#FFFFFF',
  guides: '#37474F',
  lineNumbers: '#37474F',
  invisibles: '#65737E',
  lineHighlight: '#000000',
  selection: '#80CBC420',
  shadow: '#00000030',
  inputBackground: '#303C41',
  inputForeground: '#EEFFFF',
  inputBorder: '#FFFFFF10',
  scrollbars: '#EEFFFF20',
  scrollbarsHover: '#EEFFFF10',
  statusbarForeground: '#546E7A',
  sidebarBackground: '#263238',
  sidebarForeground: '#607a86',
  listHoverForeground: '#FFFFFF',
  listHoverBackground: '#263238',
  tabActiveForeground: '#FFFFFF',
  inactiveSelectionBackground: '#00000030',
  findMatchBackground: '#000000',
  findMatchHighlightBackground: '#00000050',
  findMatchHighlightBorder: '#ffffff30',
  base: {
    white: '#ffffff',
    black: '#000000',
    red: '#f07178',
    orange: '#F78C6C',
    yellow: '#FFCB6B',
    green: '#C3E88D',
    cyan: '#89DDFF',
    blue: '#82AAFF',
    paleblue: '#B2CCD6',
    purple: '#C792EA',
    brown: '#916b53',
    pink: '#ff9cac',
    violet: '#bb80b3',
  },
};

// boolean: theme.scheme.base.pink,
// class: theme.scheme.base.yellow,
// classMember: theme.scheme.base.red,
// comment: theme.scheme.comments,
// cssClass: theme.scheme.base.yellow,
// cssId: theme.scheme.base.orange,
// cssProperties: theme.scheme.base.paleblue,
// cssTag: theme.scheme.base.yellow,
// function: theme.scheme.base.blue,
// functionCall: theme.scheme.base.blue,
// identifier: theme.scheme.base.red,
// keyword: theme.scheme.base.cyan,
// storage: theme.scheme.base.purple,
// string: theme.scheme.base.green,
// stringEscape: theme.scheme.foreground,
// type: theme.scheme.base.yellow,
// punctuation: theme.scheme.base.cyan,
// otherKeyword: theme.scheme.base.orange,
// variable: theme.scheme.foreground,
// number: theme.scheme.base.orange

const highlightStyle = HighlightStyle.define([
  {tag: [t.bool], color: palette.base.pink},
  {tag: [t.string], color: palette.base.green},
  {tag: [t.escape], color: palette.foreground},
  {tag: [t.definition], color: palette.base.red},
  {tag: [t.comment], color: palette.comments},
  {tag: [t.punctuation, t.annotation, t.keyword], color: palette.base.cyan},
  {tag: [t.special, t.special(t.variableName)], color: palette.base.purple},
  {tag: [t.attributeName], color: palette.base.purple},
  {tag: [t.attributeValue], color: palette.base.green},
  {tag: t.meta, color: palette.base.purple},

  {
    tag: [t.regexp, t.keyword, t.docComment, t.docString, t.documentMeta],
    color: palette.base.green,
  },

  {tag: [t.quote], color: palette.base.blue},
  {tag: [t.propertyName], color: palette.base.white},
  {tag: [t.operator, t.operatorKeyword], color: palette.base.blue},
  {
    tag: [
      t.controlKeyword,
      t.moduleKeyword,
      t.definitionKeyword,
      t.operatorKeyword,
    ],
    color: palette.base.purple,
  },

  {tag: [t.number], color: palette.base.orange},

  {
    tag: [t.className, t.typeOperator, t.namespace],
    color: palette.base.yellow,
  },

  {
    tag: [t.function(t.variableName), t.labelName],
    color: palette.base.blue,
  },

  {
    tag: [
      t.operator,
      t.operatorKeyword,
      t.url,
      t.escape,
      t.regexp,
      t.link,
      t.special(t.string),
    ],
    color: palette.base.cyan,
  },

  {tag: [t.typeName], color: palette.base.red},

  // base
  {
    tag: t.strong,
    fontWeight: 'bold',
    color: palette.base.yellow,
  },
  {
    tag: t.emphasis,
    fontStyle: 'italic',
  },
  {
    tag: t.strikethrough,
    textDecoration: 'line-through',
  },
  {
    tag: t.link,
    color: palette.defaultAccent,
  },
  {
    tag: t.invalid,
    border: palette.base.red,
  },
  {tag: t.squareBracket, color: palette.base.yellow},
  {tag: t.angleBracket, color: palette.base.cyan},
  {tag: t.bracket, color: palette.base.purple},
  {tag: t.brace, color: palette.base.cyan},
]);

export const materialOceanTheme = EditorView.theme(
  {
    '&': {
      color: palette.base.white,
      backgroundColor: palette.background,
    },

    '.cm-content': {
      caretColor: palette.caret,
    },

    '.cm-cursor, .cm-dropCursor': {borderLeftColor: palette.caret},
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {backgroundColor: palette.selection},

    '.cm-panels': {
      backgroundColor: palette.backgroundAlt,
      color: palette.base.white,
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

    '.cm-activeLine': {backgroundColor: palette.inputBackground},
    '.cm-selectionMatch': {backgroundColor: palette.findMatchBackground},

    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: `${palette.backgroundAlt}50`,
      outline: `1px solid ${palette.caret}50`,
    },

    '.cm-gutters': {
      backgroundColor: `${palette.base.blue}60`,
      color: palette.lineNumbers,
      border: 'none',
    },

    '.cm-activeLineGutter': {
      backgroundColor: palette.inputBackground,
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
        backgroundColor: `${palette.lineHighlight}50`,
      },
    },
    '.cm-function': {
      color: palette.base.purple,
    },
    '.cm-variable-name': {
      color: palette.base.white,
    },
    '.cm-function + .cm-variable-name': {
      color: palette.base.paleblue,
    },
  },
  {dark: true},
);

export const materialOceanic: Extension = [materialOceanTheme, highlightStyle];
