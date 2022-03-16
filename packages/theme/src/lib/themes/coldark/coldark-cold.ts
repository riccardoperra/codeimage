import {buildExternalStylesheet} from '../../core';

const selection = '#8da1b950';

export const coldarkCold = buildExternalStylesheet('coldark-cold')(`
  .cm-selectionBackground,
  .cm-focused .cm-selectionBackground,
  &::selection,
  *::selection {
    background-color: ${selection};
  }

  .cm-selectionMatch {
    background-color: ${selection};
  }

  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: #3c526d;
  }

  .token.punctuation {
    color: #111b27;
  }

  .token.delimiter.important,
  .token.selector .parent,
  .token.tag,
  .token.tag .token.punctuation {
    color: #006d6d;
  }

  .token.attr-name,
  .token.boolean,
  .token.boolean.important,
  .token.number,
  .token.constant,
  .token.selector .token.attribute {
    color: #755f00;
  }

  .token.class-name,
  .token.name,
  .token.key,
  .token.parameter,
  .token.property,
  .token.property-access,
  .token.variable {
    color: #005a8e;
  }

  .token.attr-value,
  .token.inserted,
  .token.color,
  .token.selector .token.value,
  .token.string,
  .token.string .token.url-link {
    color: #116b00;
  }

  .token.builtin,
  .token.keyword-array,
  .token.package,
  .token.regex {
    color: #af00af;
  }

  .token.function,
  .token.selector .token.class,
  .token.selector .token.id {
    color: #7c00aa;
  }

  .token.atrule .token.rule,
  .token.combinator,
  .token.keyword,
  .token.operator,
  .token.pseudo-class,
  .token.pseudo-element,
  .token.selector,
  .token.unit {
    color: #a04900;
  }

  .token.deleted,
  .token.important {
    color: #c22f2e;
  }

  .token.keyword-this,
  .token.this {
    color: #005a8e;
  }

  .token.important,
  .token.keyword-this,
  .token.this,
  .token.bold {
    font-weight: bold;
  }

  .token.delimiter.important {
    font-weight: inherit;
  }

  .token.italic {
    font-style: italic;
  }

  .token.entity {
    cursor: help;
  }

  .language-markdown .token.title,
  .language-markdown .token.title .token.punctuation {
    color: #005a8e;
    font-weight: bold;
  }

  .language-markdown .token.blockquote.punctuation {
    color: #af00af;
  }

  .language-markdown .token.code {
    color: #006d6d;
  }

  .language-markdown .token.hr.punctuation {
    color: #005a8e;
  }

  .language-markdown .token.url > .token.content {
    color: #116b00;
  }

  .language-markdown .token.url-link {
    color: #755f00;
  }

  .language-markdown .token.list.punctuation {
    color: #af00af;
  }

  .language-markdown .token.table-header {
    color: #111b27;
  }

  .language-json .token.operator {
    color: #111b27;
  }

  .language-scss .token.variable {
    color: #006d6d;
  }
`);
