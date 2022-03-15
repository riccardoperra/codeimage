import {HighlightStyle, tags as t} from '@codemirror/highlight';

export const prismjsClassNames = HighlightStyle.define([
  {tag: [t.keyword, t.null], class: 'token keyword'},
  {tag: [t.name], class: 'token name'},
  {tag: [t.propertyName], class: 'token property-name'},
  {tag: [t.typeName, t.className, t.tagName], class: 'token class-name'},
  {tag: [t.operator], class: 'token operator'},
  {tag: [t.punctuation], class: 'token punctuation'},
  {tag: [t.squareBracket], class: 'token punctuation square-bracket'},
  {tag: [t.string], class: 'token string'},
  {tag: [t.angleBracket], class: 'token angle-bracket'},
  {tag: [t.regexp], class: 'token regex'},
  {tag: [t.comment], class: 'token comment'},
  {tag: [t.number], class: 'token number'},
  {tag: [t.bool], class: 'token boolean'},
  {tag: [t.atom], class: 'token name'},
  {
    tag: [t.function(t.variableName), t.function(t.propertyName)],
    class: 'token function',
  },
]);
