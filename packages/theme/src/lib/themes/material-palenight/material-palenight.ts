import {buildExternalStylesheet} from '../../core';

const selection = '#7580B850';

export const materialPalenight = buildExternalStylesheet('material-palenight')(`
  .cm-selectionBackground,
  .cm-focused .cm-selectionBackground,
  &::selection,
  *::selection {
    background-color: ${selection};
  }

  .cm-selectionMatch {
    background-color: ${selection};
  }

  .token.script.language-javascript {
    color: #a6accd;
  }

  .token.comment,
  .token.block-comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: #676e95;
  }

  .token.attr-name,
  .token.namespace,
  .token.deleted {
    color: #bb80b3;
  }

  .token.function,
  .token.function-name {
    color: #82aaff;
  }

  .token.unit,
  .token.url,
  .token.boolean,
  .token.number {
    color: #f78c6c;
  }

  .token.color,
  .token.hexcode,
  .token.builtin,
  .token.property,
  .token.class,
  .token.class-name,
  .token.constant,
  .token.symbol {
    color: #ffcb6b;
  }

  .token.id,
  .token.selector,
  .token.important,
  .token.atrule,
  .token.keyword {
    color: #c792ea;
  }

  .token.pseudo-class,
  .token.pseudo-element,
  .token.inserted,
  .token.attribute,
  .token.string,
  .token.char,
  .token.attr-value,
  .token.regex,
  .token.variable {
    color: #c3e88d;
  }

  .token.punctuation,
  .token.operator,
  .token.entity,
  .token.url {
    color: #89ddff;
  }

  .token.tag {
    color: #f07178;
  }

  .token.parameter,
  .token.deleted {
    color: #ff5370;
  }

  .token.important,
  .token.bold {
    font-weight: bold;
  }

  .token.italic {
    font-style: italic;
  }

  .token.entity {
    cursor: help;
  }
`);
