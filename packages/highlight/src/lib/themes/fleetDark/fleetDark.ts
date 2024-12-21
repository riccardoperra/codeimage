import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {Extension} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {tags as t} from '@lezer/highlight';

export const tokens = {
  blue40: '#194176',
  blue: '#87c3ff',
  cyan: '#82d2ce',
  lime: '#A8CC7C',
  coral: '#CC7C8A',
  yellow: '#EBC88D',
  pink: '#E394DC',
  violet: '#AF9CFF',
  gray120: '#d1d1d1',
  gray90: '#898989',
  gray70: '#5D5D5D',
  gray60: '#484848',
  gray50: '#383838',
  gray40: '#333333',
  gray10: '#181818',
};

export const palette = {
  background: tokens.gray10,
  keyword: tokens.cyan,
  metadata: tokens.lime,
  number: tokens.yellow,
  boolean: tokens.cyan,
  string: tokens.pink,
  classNameDefinition: tokens.blue,
  typeDefinition: tokens.blue,
};

export const highlightStyle: HighlightStyle = HighlightStyle.define([
  {
    tag: [t.comment],
    color: tokens.gray90,
  },
  {
    tag: [t.link],
    textDecoration: 'underline',
  },
  {
    tag: [t.keyword],
    color: palette.keyword,
  },
  {
    tag: [t.typeOperator],
    color: palette.keyword,
  },
  {
    tag: [t.meta],
    color: palette.metadata,
  },
  {
    tag: [t.number],
    color: palette.number,
  },
  {
    tag: [t.self],
    color: tokens.coral,
  },
  {
    tag: [t.definition(t.className)],
    color: palette.classNameDefinition,
  },
  {
    tag: [t.definition(t.typeName)],
    color: palette.typeDefinition,
  },
  {
    tag: [t.bool],
    color: palette.boolean,
  },
  {
    tag: [t.string],
    color: palette.string,
  },
  {
    tag: [t.special(t.string)],
    color: palette.string,
  },
  {
    tag: [t.escape],
    color: tokens.cyan,
  },
  {
    tag: [t.regexp],
    color: tokens.cyan,
  },
  {
    tag: [t.punctuation],
    color: tokens.gray120,
  },
  {
    tag: [t.variableName],
    color: tokens.gray120,
  },
  {
    tag: [t.propertyName],
    color: tokens.violet,
  },
  {
    tag: [t.heading],
    color: tokens.cyan,
    fontWeight: 'medium',
  },
  {
    tag: [t.link],
    color: tokens.pink,
    fontStyle: 'italic',
  },
  {
    tag: [t.quote],
    color: '#EB83E2',
  },
  {
    tag: [t.list],
    color: '#óEB83E2',
  },
  {
    tag: [t.punctuation],
    color: tokens.gray120,
  },
  {
    tag: [t.variableName],
    color: tokens.gray120,
  },
  {
    tag: [t.color, t.constant(t.name), t.standard(t.name)],
    color: tokens.yellow,
  },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName)],
    color: tokens.yellow,
  },
  {
    tag: [t.tagName],
    color: tokens.blue,
  },
  {
    tag: [t.typeName],
    color: tokens.cyan,
  },
]);

export const colors = EditorView.theme(
  {
    '&': {
      color: tokens.gray120,
      background: tokens.gray10,
    },
    '&.cm-editor.cm-focused': {
      outline: 'none',
      border: 'none',
    },
    '.cm-content': {
      fontFamily: 'JetBrains Mono, Inter, monospace',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      border: 'none',
    },
    '.cm-gutters .cm-gutter.cm-lineNumbers .cm-gutterElement': {
      color: tokens.gray70,
      paddingLeft: '12px',
      fontWeight: 600,
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {
        backgroundColor: tokens.gray70,
      },
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: tokens.gray50,
    },
    '.cm-line.cm-activeLine': {
      backgroundColor: tokens.gray50,
    },
    '.cm-gutterElement.cm-activeLineGutter': {
      backgroundColor: tokens.gray50,
    },
    '.cm-tooltip': {
      backgroundColor: tokens.gray40,
      border: `1px solid ${tokens.gray60}`,
      color: tokens.gray120,
      borderRadius: '6px',
      overflow: 'hidden',
      boxShadow:
        'rgba(0, 0, 0, 0.4) 0px 19px 38px, rgba(0, 0, 0, 0.22) 0px 15px 12px',
    },
    '.cm-tooltip .cm-tooltip-lint.cm-tooltip-section .cm-diagnostic.cm-diagnostic-error':
      {
        border: 'none',
      },
    '.cm-tooltip-autocomplete': {
      '& > ul > li': {
        fontFamily: 'JetBrains Mono, Inter, monospace',
        fontSize: '14px',
        padding: '4px !important',
        paddingRight: '8px !important',
        paddingLeft: '8px !important',
      },
      '& > ul > li[aria-selected]': {
        backgroundColor: tokens.blue40,
      },
      '& > ul > li > div.cm-completionIcon': {
        marginRight: '4px !important',
        fontSize: '14px',
      },
    },
    '::-webkit-scrollbar': {
      width: '12px',
      backgroundColor: 'transparent',
    },
    '::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: '#505050',
      borderRadius: '1000px',
      border: '4px solid transparent',
      backgroundClip: 'content-box',
      transition: 'background-color .2s',
    },
  },
  {
    dark: true,
  },
);

export const fleetDark: Extension[] = [
  colors,
  syntaxHighlighting(highlightStyle),
];
