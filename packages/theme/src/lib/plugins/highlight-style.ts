import {HighlightStyle, tags as t} from '@codemirror/highlight';
import {} from '@codemirror/language';

export interface StyledHighlightOptions {
  base: string;
  delimiters: string;
  function?: string;
  comments: string;
  numbers: string;
  regexp: string;
  annotation: string;
  tag: string;
  keywords: string;
  strings: string;
  boolean?: string;
  background?: string;
  quote?: string;
  meta?: string;
  punctuation?: string;
  paren?: string;
  brackets?: string;
  moduleKeyword?: string;
  attrValue?: string;
  className?: string;
  operators?: string;
}

export function styledHighlight(h: StyledHighlightOptions) {
  return HighlightStyle.define([
    // Base
    {
      tag: [t.emphasis],
      fontStyle: 'italic',
    },
    {
      tag: [t.strong],
      fontStyle: 'bold',
    },
    {
      tag: [t.link],
      color: h.delimiters,
    },
    // Keywords
    {
      tag: [t.moduleKeyword],
      color: h.moduleKeyword ?? h.keywords,
    },
    {
      tag: [t.keyword],
      color: h.keywords,
    },
    {
      tag: [t.typeName, t.typeOperator],
      color: h.keywords,
    },
    {
      tag: [t.changed, t.annotation, t.modifier, t.self, t.namespace],
      color: h.keywords,
    },
    // Operators
    {
      tag: [t.operator, t.special(t.string)],
      color: h.operators ?? h.delimiters,
    },
    // Type
    {
      tag: [t.bool],
      color: h.boolean ?? h.strings,
    },
    {
      tag: [t.number],
      color: h.numbers,
    },
    {
      tag: [t.string, t.processingInstruction, t.inserted],
      color: h.strings,
    },
    // Classes
    {
      tag: [t.className, t.namespace],
      color: h.className ?? h.function ?? h.base,
    },
    // Function
    {
      tag: [t.variableName],
      color: h.base,
    },
    {
      tag: [t.function(t.variableName), t.function(t.propertyName)],
      color: h.function,
    },
    // Meta
    {tag: [t.annotation], color: h.annotation ?? h.keywords},
    {tag: [t.punctuation], color: h.punctuation ?? h.delimiters},
    {tag: [t.paren], color: h.paren ?? h.punctuation},
    {
      tag: [t.squareBracket, t.bracket, t.angleBracket],
      color: h.brackets ?? h.delimiters,
    },
    {tag: [t.meta], color: h.meta ?? h.keywords},
    // Other
    {tag: [t.comment], color: h.comments},
    {tag: [t.regexp], color: h.regexp},
    {tag: [t.tagName], color: h.tag},

    {
      tag: [t.atom, t.special(t.variableName)],
      color: 'red',
    },
    {
      tag: [t.attributeValue],
      color: h.strings ?? h.attrValue,
    },
    // Markdown
    {tag: [t.heading], color: h.keywords, fontWeight: 'bold'},
    {tag: [t.quote], color: h.quote},
  ]);
}
