import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {Extension} from '@codemirror/state';
import {tags as t} from '@lezer/highlight';

const palette = {
  cyan: '#82D2CE',
  Lime: '#A8CC7C',
  yellow: '#EBC88D',
  pink: '#E394DC',
  gray120: '#d1d1d1',
  blue: '#87C3FF',
};

export const highlightStyle: HighlightStyle = HighlightStyle.define([
  {
    tag: [t.angleBracket],
    color: palette.blue,
  },
  {
    tag: [t.standard(t.tagName)],
    color: palette.blue,
  },
  {
    tag: [t.link],
    textDecoration: 'underline',
  },
  {
    tag: [t.keyword],
    color: palette.cyan,
  },
  {
    tag: [t.typeOperator],
    color: palette.cyan,
  },
  {
    tag: [t.meta],
    color: palette.Lime,
  },
  {
    tag: [t.number],
    color: palette.yellow,
  },
  {
    tag: [t.bool],
    color: palette.cyan,
  },
  {
    tag: [t.string],
    color: palette.pink,
  },
  {
    tag: [t.special(t.string)],
    color: palette.cyan,
  },
  {
    tag: [t.punctuation],
    color: palette.gray120,
  },
  {
    tag: [t.variableName],
    color: palette.gray120,
  },
  {
    tag: [t.function(t.variableName)],
    color: palette.yellow,
  },
  {
    tag: [t.propertyName],
    color: palette.cyan,
  },
]);

export const theme: Extension = syntaxHighlighting(highlightStyle);
